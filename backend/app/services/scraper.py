"""Website scraper.

Uses Playwright (Chromium) to render JS-heavy / React sites, then parses the
DOM with BeautifulSoup to extract structured, meaningful content. Falls back to
a plain httpx + BeautifulSoup fetch if Playwright is unavailable at runtime.

SSRF safety is enforced by app.core.security.validate_url BEFORE this runs.
"""
from __future__ import annotations

import asyncio
import logging
import re
import sys
from dataclasses import dataclass, field
from typing import List
from urllib.parse import urljoin, urlparse

from bs4 import BeautifulSoup
from tenacity import retry, retry_if_not_exception_type, stop_after_attempt, wait_exponential

from app.core.config import settings

logger = logging.getLogger(__name__)


class ScrapeError(RuntimeError):
    pass

_WS_RE = re.compile(r"\s+")
# Selectors that commonly hold product names on e-commerce templates.
_PRODUCT_SELECTORS = [
    "[class*='product'] h2",
    "[class*='product'] h3",
    "[class*='product-title']",
    "[class*='product-name']",
    "[itemprop='name']",
    "li.product a",
]


@dataclass
class ScrapedPage:
    url: str
    title: str = ""
    meta_description: str = ""
    headings: List[str] = field(default_factory=list)
    paragraphs: List[str] = field(default_factory=list)
    nav_items: List[str] = field(default_factory=list)
    internal_links: List[str] = field(default_factory=list)
    product_names: List[str] = field(default_factory=list)
    clean_text: str = ""


def _clean(text: str) -> str:
    return _WS_RE.sub(" ", text or "").strip()


def _dedupe(items: List[str]) -> List[str]:
    seen: set[str] = set()
    out: List[str] = []
    for item in items:
        key = item.lower()
        if item and key not in seen:
            seen.add(key)
            out.append(item)
    return out


def _parse_html(html: str, base_url: str) -> ScrapedPage:
    soup = BeautifulSoup(html, "lxml")

    # Strip non-content nodes.
    for tag in soup(["script", "style", "noscript", "template", "svg"]):
        tag.decompose()

    page = ScrapedPage(url=base_url)
    page.title = _clean(soup.title.string) if soup.title and soup.title.string else ""

    meta_desc = soup.find("meta", attrs={"name": "description"}) or soup.find(
        "meta", attrs={"property": "og:description"}
    )
    if meta_desc and meta_desc.get("content"):
        page.meta_description = _clean(meta_desc["content"])

    page.headings = _dedupe(
        [_clean(h.get_text()) for h in soup.find_all(["h1", "h2", "h3"]) if _clean(h.get_text())]
    )[:60]

    page.paragraphs = _dedupe(
        [_clean(p.get_text()) for p in soup.find_all(["p", "li"]) if len(_clean(p.get_text())) > 25]
    )[:200]

    nav = soup.find_all("nav")
    nav_items: List[str] = []
    for n in nav:
        nav_items.extend(_clean(a.get_text()) for a in n.find_all("a"))
    page.nav_items = _dedupe([n for n in nav_items if n])[:40]

    base_host = urlparse(base_url).netloc
    links: List[str] = []
    for a in soup.find_all("a", href=True):
        full = urljoin(base_url, a["href"])
        if urlparse(full).netloc == base_host and full.startswith("http"):
            links.append(full)
    page.internal_links = _dedupe(links)[:60]

    products: List[str] = []
    for selector in _PRODUCT_SELECTORS:
        for el in soup.select(selector):
            txt = _clean(el.get_text())
            if 2 < len(txt) < 120:
                products.append(txt)
    page.product_names = _dedupe(products)[:60]

    # Normalized content block for the AI.
    body = soup.body or soup
    page.clean_text = _clean(body.get_text(separator=" "))[: settings.max_content_chars]
    return page


def _can_run_playwright() -> bool:
    if sys.platform == "win32":
        try:
            loop = asyncio.get_running_loop()
            if isinstance(loop, getattr(asyncio, "SelectorEventLoop", ())):
                return False
        except RuntimeError:
            pass
    return True


@retry(
    retry=retry_if_not_exception_type(NotImplementedError),
    stop=stop_after_attempt(settings.scrape_max_retries + 1),
    wait=wait_exponential(multiplier=1, min=1, max=6),
    reraise=True,
)
async def _fetch_with_playwright(url: str) -> str:
    from playwright.async_api import async_playwright

    async with async_playwright() as pw:
        browser = await pw.chromium.launch(
            args=["--no-sandbox", "--disable-dev-shm-usage"]
        )
        try:
            context = await browser.new_context(
                user_agent=settings.user_agent,
                java_script_enabled=True,
                ignore_https_errors=True,
            )
            page = await context.new_page()
            # Block heavy resources for speed and safety.
            await page.route(
                "**/*",
                lambda route: route.abort()
                if route.request.resource_type in {"image", "media", "font"}
                else route.continue_(),
            )
            await page.goto(url, timeout=settings.scrape_timeout_ms, wait_until="domcontentloaded")
            try:
                await page.wait_for_load_state("networkidle", timeout=5000)
            except Exception:  # noqa: BLE001 - networkidle is best-effort
                pass
            return await page.content()
        finally:
            await browser.close()


async def _fetch_with_httpx(url: str) -> str:
    import httpx

    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=settings.scrape_timeout_ms / 1000,
        headers={
            "User-Agent": settings.user_agent,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        },
    ) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.text
        except httpx.HTTPStatusError as exc:
            if resp.text and len(resp.text.strip()) > 200:
                logger.warning(
                    "Target %s returned HTTP %s, but returned HTML content (%d chars); using content.",
                    url,
                    resp.status_code,
                    len(resp.text),
                )
                return resp.text
            raise ScrapeError(f"Target site returned HTTP {exc.response.status_code}") from exc
        except httpx.RequestError as exc:
            raise ScrapeError(f"Failed to connect to target site: {exc}") from exc


async def scrape(url: str) -> ScrapedPage:
    """Fetch and parse a URL. Playwright first, httpx fallback."""
    if not _can_run_playwright():
        logger.info("Windows SelectorEventLoop active (subprocesses unsupported); using httpx directly.")
        html = await _fetch_with_httpx(url)
        return _parse_html(html, url)

    try:
        html = await _fetch_with_playwright(url)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Playwright failed for %s (%s); falling back to httpx.", url, exc)
        html = await _fetch_with_httpx(url)
    return _parse_html(html, url)

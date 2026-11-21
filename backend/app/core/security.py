"""URL validation and SSRF protection.

The scraper visits arbitrary user-supplied URLs, which is a classic SSRF sink.
This module resolves the hostname and rejects any request that would touch a
private, loopback, link-local, or otherwise non-public address BEFORE the
scraper is allowed to connect.
"""
from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

from app.core.config import settings


class UnsafeURLError(ValueError):
    """Raised when a URL fails validation or points at a non-public host."""


# Hostnames we never resolve or fetch.
_BLOCKED_HOSTNAMES = {
    "localhost",
    "metadata.google.internal",  # GCP metadata endpoint
    "metadata",
}


def _is_public_ip(ip_str: str) -> bool:
    try:
        ip = ipaddress.ip_address(ip_str)
    except ValueError:
        return False
    return not (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_multicast
        or ip.is_reserved
        or ip.is_unspecified
    )


def validate_url(raw_url: str) -> str:
    """Validate a user-supplied URL and return a normalized version.

    Raises UnsafeURLError on any problem.
    """
    if not raw_url or len(raw_url) > 2048:
        raise UnsafeURLError("URL is empty or too long.")

    raw_url = raw_url.strip()
    parsed = urlparse(raw_url)

    if parsed.scheme.lower() not in settings.allowed_schemes:
        raise UnsafeURLError(f"Scheme '{parsed.scheme}' is not allowed. Use http or https.")

    hostname = parsed.hostname
    if not hostname:
        raise UnsafeURLError("URL has no hostname.")

    if hostname.lower() in _BLOCKED_HOSTNAMES:
        raise UnsafeURLError("This host is not permitted.")

    if not settings.block_private_networks:
        return raw_url

    # Cloud metadata IP shortcuts (AWS/GCP/Azure) and raw-IP requests.
    try:
        # Resolve ALL addresses for the host; every one must be public.
        addr_info = socket.getaddrinfo(hostname, None)
    except socket.gaierror as exc:
        raise UnsafeURLError("Hostname could not be resolved.") from exc

    resolved_ips = {info[4][0] for info in addr_info}
    if not resolved_ips:
        raise UnsafeURLError("Hostname resolved to no addresses.")

    for ip_str in resolved_ips:
        if not _is_public_ip(ip_str):
            raise UnsafeURLError("URL resolves to a private or reserved address.")

    return raw_url

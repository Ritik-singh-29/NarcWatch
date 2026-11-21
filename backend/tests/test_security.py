"""SSRF and URL-validation tests — the highest-risk surface."""
import pytest
from app.core.security import validate_url, UnsafeURLError


@pytest.mark.parametrize("url", [
    "https://example.com",
    "http://example.com/path?q=1",
])
def test_public_urls_allowed(url):
    assert validate_url(url) == url


@pytest.mark.parametrize("url", [
    "http://localhost:8080",
    "http://127.0.0.1/",
    "http://10.0.0.5/",
    "http://192.168.1.1/",
    "http://169.254.169.254/latest/meta-data/",  # cloud metadata
    "http://metadata.google.internal/",
    "ftp://example.com",
    "file:///etc/passwd",
    "http://[::1]/",
])
def test_unsafe_urls_rejected(url):
    with pytest.raises(UnsafeURLError):
        validate_url(url)


def test_empty_and_overlong_rejected():
    with pytest.raises(UnsafeURLError):
        validate_url("")
    with pytest.raises(UnsafeURLError):
        validate_url("https://example.com/" + "a" * 3000)

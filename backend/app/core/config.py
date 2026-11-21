"""Application configuration loaded from environment variables."""
from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "NarcWatch"
    environment: str = "development"
    debug: bool = True

    # CORS
    cors_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # AI providers
    gemini_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash"
    groq_api_key: str = ""
    groq_model: str = "openai/gpt-oss-20b"

    # Scraper
    scrape_timeout_ms: int = 20000
    scrape_max_retries: int = 2
    max_content_chars: int = 40000
    user_agent: str = (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
    )

    # Rate limiting
    rate_limit: str = "10/minute"

    # SSRF / URL safety
    allowed_schemes: List[str] = ["http", "https"]
    block_private_networks: bool = True


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

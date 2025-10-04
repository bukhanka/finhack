"""Configuration management for the financial news radar system."""

import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings."""
    
    # API Keys
    google_api_key: str = os.getenv("GOOGLE_API_KEY", "")
    news_api_key: str = os.getenv("NEWS_API_KEY", "")
    alpha_vantage_key: str = os.getenv("ALPHA_VANTAGE_KEY", "")
    tavily_api_key: str = os.getenv("TAVILY_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")
    
    # Application parameters
    news_window_hours: int = int(os.getenv("NEWS_WINDOW_HOURS", "24"))
    top_k_stories: int = int(os.getenv("TOP_K_STORIES", "10"))
    similarity_threshold: float = float(os.getenv("SIMILARITY_THRESHOLD", "0.85"))
    hotness_threshold: float = float(os.getenv("HOTNESS_THRESHOLD", "0.6"))
    
    # Model settings
    gemini_model: str = "gemini-2.0-flash-exp"
    embedding_model: str = "models/text-embedding-004"
    temperature: float = 0.3
    
    # News sources RSS feeds
    rss_feeds: List[str] = [
        "https://feeds.reuters.com/reuters/businessNews",
        "https://feeds.reuters.com/news/wealth",
        "https://www.ft.com/rss/companies",
        "https://www.bloomberg.com/feed/podcast/markets.xml",
        "https://seekingalpha.com/feed.xml",
        "https://www.investing.com/rss/news.rss",
        "https://www.cnbc.com/id/100003114/device/rss/rss.html",
        "https://www.marketwatch.com/rss/topstories",
    ]
    
    # Cache settings
    cache_ttl_seconds: int = 3600
    enable_cache: bool = True
    
    # Deduplication
    min_cluster_size: int = 2
    
    # Deep research settings
    enable_tavily_search: bool = os.getenv("ENABLE_TAVILY_SEARCH", "true").lower() == "true"
    enable_deep_research: bool = os.getenv("ENABLE_DEEP_RESEARCH", "true").lower() == "true"
    deep_research_threshold: float = float(os.getenv("DEEP_RESEARCH_THRESHOLD", "0.7"))
    tavily_max_results: int = int(os.getenv("TAVILY_MAX_RESULTS", "5"))
    
    class Config:
        env_file = ".env"


settings = Settings()


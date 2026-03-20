from pydantic import BaseModel


class Settings(BaseModel):
    app_name: str = "Funding Fee Dashboard API"
    refresh_interval_seconds: int = 12
    request_timeout_seconds: float = 8.0
    market_metadata_pages: int = 2
    market_metadata_vs_currency: str = "usd"
    top_spread_limit: int = 5


settings = Settings()

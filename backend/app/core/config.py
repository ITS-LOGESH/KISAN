import os
from typing import List

# Read .env file if present
_env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), ".env")
if os.path.exists(_env_path):
    try:
        with open(_env_path, "r", encoding="utf-8") as _f:
            for _line in _f:
                _line = _line.strip()
                if _line and not _line.startswith("#") and "=" in _line:
                    _k, _v = _line.split("=", 1)
                    _k = _k.strip()
                    _v = _v.strip().strip('"').strip("'")
                    if _k and _k not in os.environ:
                        os.environ[_k] = _v
    except Exception:
        pass

class Settings:
    PROJECT_NAME: str = "KrishiNet - AI Agricultural Intelligence Network"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    
    # Optional Gemini API Key and Model
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.1-flash-lite")
    
    # Open-Meteo zero-cost endpoints
    OPEN_METEO_BASE_URL: str = os.getenv("OPEN_METEO_BASE_URL", "https://api.open-meteo.com")
    OPEN_METEO_GEOCODING_URL: str = os.getenv("OPEN_METEO_GEOCODING_URL", "https://geocoding-api.open-meteo.com/v1/search")
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./krishinet.db")
    
    # CORS
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")
        if origin.strip()
    ]
    
    # Optional Earth Engine adapter
    ENABLE_EARTH_ENGINE: bool = os.getenv("ENABLE_EARTH_ENGINE", "false").lower() in ("true", "1", "yes")

settings = Settings()

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.services.database_service import init_db
from app.api import fields, weather, satellite, soil, advisory, disease, assistant, network, users, alerts

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("krishinet")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database and seed demonstration fields
    logger.info("Initializing KrishiNet database and demonstration records...")
    init_db()
    logger.info("KrishiNet Backend successfully initialized at ₹0 cost.")
    yield
    logger.info("Shutting down KrishiNet Backend.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="KrishiNet: AI Agricultural Intelligence Network for Indian farmers, operating at ₹0 cost.",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe error handler - Never expose stack traces or secrets
@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception at {request.url.path}: {str(exc)}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "An internal server error occurred.",
            "detail": "Please check input parameters or try again later.",
            "path": request.url.path
        }
    )

# Health endpoint
@app.get("/api/health", tags=["system"])
def health_check():
    return {
        "status": "HEALTHY",
        "service": "KrishiNet AI Agricultural Intelligence Network",
        "version": settings.VERSION,
        "database": "SQLite (Local ₹0 Cost)",
        "weather_provider": "Open-Meteo Public API (Zero Key / Open Access)",
        "satellite_provider": "Copernicus Sentinel-2 Public Registry (STAC)",
        "geocoding_provider": "Open-Meteo Geocoding / OSM Nominatim",
        "gemini_status": "CONFIGURED" if settings.GEMINI_API_KEY else "OPTIONAL_FALLBACK_ACTIVE"
    }

# Register API Routers
app.include_router(fields.router, prefix=settings.API_V1_PREFIX)
app.include_router(weather.router, prefix=settings.API_V1_PREFIX)
app.include_router(satellite.router, prefix=settings.API_V1_PREFIX)
app.include_router(soil.router, prefix=settings.API_V1_PREFIX)
app.include_router(advisory.router, prefix=settings.API_V1_PREFIX)
app.include_router(disease.router, prefix=settings.API_V1_PREFIX)
app.include_router(assistant.router, prefix=settings.API_V1_PREFIX)
app.include_router(network.router, prefix=settings.API_V1_PREFIX)
app.include_router(users.router, prefix=settings.API_V1_PREFIX)
app.include_router(alerts.router, prefix=settings.API_V1_PREFIX)

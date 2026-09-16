from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.core.config import settings
from app.core.database import engine
from app.api.v1.api import api_router

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("pdm.backend")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup connection check
    logger.info("Initializing connection to PostgreSQL 18...")
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("PostgreSQL database connection verified.")

        # Initialize tables, enums, and default super admin
        from app.core.init_db import init_db
        init_db()
    except Exception as exc:
        logger.warning(f"Database connection or initialization warning on startup: {exc}")
    yield
    # Shutdown
    logger.info("Disposing connection pool...")
    engine.dispose()
    logger.info("Database connection pool closed.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Project Delivery Management System - Foundation API & Admin Management",
    version="1.0.0",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# CORS Configuration for React Frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["Root"])
def root():
    return {
        "app": settings.APP_NAME,
        "environment": settings.APP_ENV,
        "docs": "/docs",
        "health": f"{settings.API_V1_STR}/health/db",
    }

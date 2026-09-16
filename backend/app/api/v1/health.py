import time
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import get_db, engine
from app.schemas.common import HealthResponse

router = APIRouter(prefix="/health", tags=["Health & Diagnostics"])


@router.get("", response_model=HealthResponse, summary="General Health Check")
def health_check() -> HealthResponse:
    """Returns application status."""
    return HealthResponse(
        status="healthy",
        database="connected",
        version="1.0.0",
        timestamp=datetime.now(timezone.utc).isoformat(),
    )


@router.get("/db", response_model=HealthResponse, summary="Database Connection & Diagnostics")
def database_health_check(db: Session = Depends(get_db)) -> HealthResponse:
    """
    Validates PostgreSQL connectivity, latency, active tables, and connection pool.
    """
    start_time = time.perf_counter()
    try:
        result = db.execute(text("SELECT version();")).scalar()
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)

        table_count = db.execute(
            text(
                """
                SELECT count(*) 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
                """
            )
        ).scalar()

        user_count = db.execute(text("SELECT count(*) FROM users;")).scalar()
        audit_count = db.execute(text("SELECT count(*) FROM audit_logs;")).scalar()

        pool = engine.pool
        pool_stats = {
            "pool_size": pool.size(),
            "checked_in_connections": pool.checkedin(),
            "checked_out_connections": pool.checkedout(),
            "overflow_connections": pool.overflow(),
        }

        return HealthResponse(
            status="healthy",
            database="PostgreSQL",
            version=result.split(",")[0] if result else "Unknown",
            timestamp=datetime.now(timezone.utc).isoformat(),
            details={
                "latency_ms": latency_ms,
                "public_table_count": table_count,
                "user_count": user_count,
                "audit_log_count": audit_count,
                "pool_status": pool_stats,
            },
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(exc)}",
        )

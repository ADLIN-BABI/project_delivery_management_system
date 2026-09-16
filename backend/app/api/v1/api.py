from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.admins import router as admins_router
from app.api.v1.health import router as health_router
from app.api.v1.projects import router as projects_router
from app.api.v1.clients import router as clients_router
from app.api.v1.deliveries import router as deliveries_router
from app.api.v1.master_plans import router as master_plans_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(admins_router)
api_router.include_router(projects_router)
api_router.include_router(clients_router)
api_router.include_router(deliveries_router)
api_router.include_router(master_plans_router)

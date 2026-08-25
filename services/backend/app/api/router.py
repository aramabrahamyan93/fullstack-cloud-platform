from fastapi import APIRouter

from app.api.health import router as health_router
from app.api.version import router as version_router
from app.features.auth.router import router as auth_router
from app.features.organizations.router import router as organizations_router
from app.features.organizations.tasks_router import router as organizations_tasks_router
from app.features.tasks.router import router as tasks_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(version_router)
api_router.include_router(auth_router)
api_router.include_router(tasks_router)
api_router.include_router(organizations_router)
api_router.include_router(organizations_tasks_router)

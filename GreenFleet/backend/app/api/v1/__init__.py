from fastapi import APIRouter
from app.api.v1.routes import auth, vessels, voyages, predictions, dashboard, cii

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(vessels.router)
api_router.include_router(voyages.router)
api_router.include_router(predictions.router)
api_router.include_router(dashboard.router)
api_router.include_router(cii.router)

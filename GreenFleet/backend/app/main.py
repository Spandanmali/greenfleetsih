from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.v1 import api_router
from app.db.database import engine, Base
import app.models  # ensure all models are registered

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="GreenFleet Intelligence API",
    description="Quantum-Inspired Fuel Consumption Prediction and Green Fleet Optimization",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}

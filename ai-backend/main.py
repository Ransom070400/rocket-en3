"""
ROCKET EN3 - AI Backend
FastAPI service providing:
- Anti-Scalping Risk Engine (XGBoost)
- User Preference Model
- Organizer Reputation Engine
- Loyalty Engine
- On-chain event listener
- ECDSA signing of risk scores
"""
import asyncio
import logging
from contextlib import asynccontextmanager

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import risk, ratings, recommendations, health
from services.blockchain_listener import start_listener
from services.model_manager import ModelManager

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup/shutdown lifecycle handler."""
    logger.info("🚀 Starting ROCKET EN3 AI Backend...")

    # Initialize and train models on startup
    model_mgr = ModelManager()
    model_mgr.initialize()
    app.state.model_mgr = model_mgr

    # Start blockchain event listener in background
    listener_task = asyncio.create_task(start_listener(app))

    logger.info("✅ ROCKET EN3 AI Backend ready")
    yield

    # Cleanup
    listener_task.cancel()
    try:
        await listener_task
    except asyncio.CancelledError:
        pass
    logger.info("🛑 ROCKET EN3 AI Backend shutdown")


app = FastAPI(
    title="ROCKET EN3 AI Backend",
    description="AI-powered NFT event infrastructure on 0G",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(risk.router, prefix="/score-transfer", tags=["risk"])
app.include_router(ratings.router, prefix="/submit-rating", tags=["ratings"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

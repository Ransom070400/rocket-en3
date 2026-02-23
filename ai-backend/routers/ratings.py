"""
POST /submit-rating
Records a post-event rating and updates preference + organizer reputation models.
"""
import logging
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)
router = APIRouter()


class RatingRequest(BaseModel):
    wallet:         str   = Field(..., min_length=42, max_length=42)
    event_id:       int   = Field(..., gt=0)
    organizer:      str   = Field(..., min_length=42, max_length=42)
    rating:         int   = Field(..., ge=1, le=5)
    category:       str   = Field(default="music")
    loyalty_weight: int   = Field(default=1, ge=1, le=4)  # 1-4 from tier
    timestamp:      int   = Field(default=0, ge=0)


class RatingResponse(BaseModel):
    success:           bool
    organizer_score:   float
    manipulation_flag: bool
    preferences_updated: bool


@router.post("", response_model=RatingResponse)
async def submit_rating(req: RatingRequest, request: Request):
    from services.model_manager import ModelManager
    import time

    model_mgr: ModelManager = request.app.state.model_mgr

    ts = req.timestamp if req.timestamp > 0 else int(time.time())

    # Update organizer reputation engine
    model_mgr.rep_engine.add_rating(
        organizer=req.organizer,
        rating=float(req.rating),
        weight=float(req.loyalty_weight),
        timestamp=ts,
    )

    rep = model_mgr.rep_engine.compute_score(req.organizer)

    # Update user preference model
    model_mgr.pref_model.update(
        wallet=req.wallet,
        category=req.category,
        rating=float(req.rating),
    )

    logger.info(
        f"Rating: wallet={req.wallet[:8]}..., eventId={req.event_id}, "
        f"rating={req.rating}, org_score={rep['score']}"
    )

    return RatingResponse(
        success=True,
        organizer_score=rep["score"],
        manipulation_flag=rep["manipulation_detected"],
        preferences_updated=True,
    )

"""
GET /recommendations?wallet=0x...
Returns personalized event recommendations for a wallet.
"""
import logging
from fastapi import APIRouter, Request, Query, HTTPException
from pydantic import BaseModel

logger = logging.getLogger(__name__)
router = APIRouter()


class RecommendationItem(BaseModel):
    event_id:         int
    name:             str
    category:         str
    preference_score: float


class RecommendationResponse(BaseModel):
    wallet:          str
    preferences:     dict
    recommendations: list[RecommendationItem]
    loyalty_tier:    dict


@router.get("", response_model=RecommendationResponse)
async def get_recommendations(
    wallet: str = Query(..., min_length=42, max_length=42),
    request: Request = None,
):
    from services.model_manager import ModelManager

    model_mgr: ModelManager = request.app.state.model_mgr

    # Get user preferences
    preferences = model_mgr.pref_model.get_preferences(wallet)

    # Mock events for demonstration (in production, fetch from contract/DB)
    sample_events = [
        {"event_id": 1, "name": "Neon Music Fest",    "category": "music"},
        {"event_id": 2, "name": "Tech Summit 2025",   "category": "tech"},
        {"event_id": 3, "name": "Street Art Expo",    "category": "arts"},
        {"event_id": 4, "name": "Gaming Tournament",  "category": "gaming"},
        {"event_id": 5, "name": "Food & Culture Wknd","category": "food"},
        {"event_id": 6, "name": "Film Festival",      "category": "film"},
        {"event_id": 7, "name": "Sports Hackathon",   "category": "sports"},
        {"event_id": 8, "name": "Fashion Week",       "category": "fashion"},
    ]

    scored = model_mgr.pref_model.recommend(wallet, sample_events)

    # Get loyalty tier
    loyalty = 0  # In production, fetch from contract
    tier_info = model_mgr.loyalty_engine.compute(loyalty)

    recs = [
        RecommendationItem(
            event_id=e["event_id"],
            name=e["name"],
            category=e["category"],
            preference_score=round(e["preference_score"], 4),
        )
        for e in scored[:5]  # Top 5
    ]

    return RecommendationResponse(
        wallet=wallet,
        preferences=preferences,
        recommendations=recs,
        loyalty_tier=tier_info,
    )

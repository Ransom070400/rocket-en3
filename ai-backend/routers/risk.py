"""
POST /score-transfer
Scores a transfer request for scalping risk, returns signed assessment.
"""
import logging
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel, Field

from services.signing_service import get_signer
from services.model_manager import ModelManager
from utils.feature_extraction import extract_risk_features, apply_loyalty_discount

logger = logging.getLogger(__name__)
router = APIRouter()


class RiskRequest(BaseModel):
    token_id:                 int    = Field(..., gt=0)
    from_address:             str    = Field(..., min_length=42, max_length=42)
    to_address:               str    = Field(..., min_length=42, max_length=42)
    purchase_velocity:        int    = Field(default=1, ge=0, le=100)
    resale_time_hours:        float  = Field(default=0.0, ge=0)
    transfer_count:           int    = Field(default=0, ge=0)
    gas_multiplier:           float  = Field(default=1.0, ge=0.5, le=10.0)
    cluster_score:            float  = Field(default=0.0, ge=0, le=1)
    loyalty_points:           int    = Field(default=0, ge=0)
    wallet_first_tx_timestamp:int | None = None


class RiskResponse(BaseModel):
    risk_score:    int
    risk_level:    str
    blocked:       bool
    ai_signature:  str
    ai_nonce:      str
    expiration:    int
    signer:        str
    features_used: dict
    loyalty_discount_applied: int


@router.post("", response_model=RiskResponse)
async def score_transfer(req: RiskRequest, request: Request):
    model_mgr: ModelManager = request.app.state.model_mgr

    # Extract features
    features = extract_risk_features(
        wallet=req.from_address,
        purchase_velocity=req.purchase_velocity,
        resale_time_hours=req.resale_time_hours,
        transfer_count=req.transfer_count,
        gas_multiplier=req.gas_multiplier,
        cluster_score=req.cluster_score,
        loyalty_points=req.loyalty_points,
        wallet_first_tx_timestamp=req.wallet_first_tx_timestamp,
    )

    # Score with XGBoost
    try:
        raw_score = model_mgr.risk_model.score(features)
    except Exception as e:
        logger.error(f"Risk model scoring failed: {e}")
        raise HTTPException(status_code=500, detail="Model scoring failed")

    # Apply loyalty discount
    discount = max(0, raw_score - apply_loyalty_discount(raw_score, req.loyalty_points))
    final_score = apply_loyalty_discount(raw_score, req.loyalty_points)

    # Determine risk level
    if final_score < 30:
        level = "LOW"
    elif final_score < 70:
        level = "MEDIUM"
    else:
        level = "HIGH"

    blocked = final_score >= 70  # matches contract RISK_THRESHOLD

    # Sign the assessment
    signer = get_signer()
    signed = signer.sign_risk_score(
        token_id=req.token_id,
        from_address=req.from_address,
        to_address=req.to_address,
        risk_score=final_score,
    )

    logger.info(
        f"Risk scored: tokenId={req.token_id}, from={req.from_address[:8]}..., "
        f"score={final_score}, level={level}, blocked={blocked}"
    )

    return RiskResponse(
        risk_score=final_score,
        risk_level=level,
        blocked=blocked,
        ai_signature=signed["ai_signature"],
        ai_nonce=signed["ai_nonce"],
        expiration=signed["expiration"],
        signer=signed["signer"],
        features_used=features,
        loyalty_discount_applied=discount,
    )

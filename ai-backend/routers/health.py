"""Health check endpoint."""
from fastapi import APIRouter, Request
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    ai_signer: str
    risk_model_ready: bool
    version: str = "1.0.0"


@router.get("", response_model=HealthResponse)
async def health(request: Request):
    from services.signing_service import get_signer
    signer = get_signer()
    model_mgr = request.app.state.model_mgr

    return HealthResponse(
        status="ok",
        ai_signer=signer.address,
        risk_model_ready=model_mgr.risk_model.model is not None,
    )

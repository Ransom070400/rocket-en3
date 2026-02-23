"""
Feature extraction for AI models.
Computes risk features from on-chain + off-chain data.
"""
import time
import logging
from typing import Optional
from web3 import Web3

logger = logging.getLogger(__name__)


def extract_risk_features(
    wallet: str,
    purchase_velocity: int = 1,
    resale_time_hours: float = 0.0,
    transfer_count: int = 0,
    gas_multiplier: float = 1.0,
    cluster_score: float = 0.0,
    loyalty_points: int = 0,
    wallet_first_tx_timestamp: Optional[int] = None,
) -> dict:
    """
    Extract and validate risk features for a wallet.
    Can be called with on-chain data or estimated values.
    """
    now = int(time.time())

    if wallet_first_tx_timestamp and wallet_first_tx_timestamp > 0:
        wallet_age_days = max(0, (now - wallet_first_tx_timestamp) / 86400)
    else:
        wallet_age_days = 365.0  # Default: 1 year if unknown

    return {
        "wallet_age_days":    max(0.0, float(wallet_age_days)),
        "purchase_velocity":  max(0, int(purchase_velocity)),
        "resale_time_hours":  max(0.0, float(resale_time_hours)),
        "transfer_count":     max(0, int(transfer_count)),
        "gas_multiplier":     max(1.0, float(gas_multiplier)),
        "cluster_score":      max(0.0, min(1.0, float(cluster_score))),
        "loyalty_points":     max(0, int(loyalty_points)),
    }


def apply_loyalty_discount(raw_score: int, loyalty_points: int) -> int:
    """
    High-loyalty users get a risk score reduction.
    Matches LoyaltyEngine.TIERS risk_reduction values.
    """
    if loyalty_points >= 100:
        discount = 35
    elif loyalty_points >= 50:
        discount = 20
    elif loyalty_points >= 20:
        discount = 10
    else:
        discount = 0

    adjusted = max(0, raw_score - discount)
    logger.debug(f"Risk score: raw={raw_score}, loyalty={loyalty_points}, adjusted={adjusted}")
    return adjusted

"""
Signing service: ECDSA signs risk scores using AI backend private key.
Smart contract verifies these signatures before allowing NFT transfers.
"""
import os
import time
import secrets
from eth_account import Account
from eth_account.messages import encode_defunct
from web3 import Web3

from config import settings


class SigningService:
    """
    Signs risk assessment data for on-chain verification.
    Uses the AI_SIGNER_PRIVATE_KEY from environment.
    """

    def __init__(self):
        key = settings.AI_SIGNER_PRIVATE_KEY
        if not key or key == "0x" + "0" * 64:
            # Generate a temporary key for development
            acc = Account.create()
            self._account = acc
            import logging
            logging.getLogger(__name__).warning(
                f"⚠️  Using temporary AI signer key: {acc.address}\n"
                "Set AI_SIGNER_PRIVATE_KEY in .env for production"
            )
        else:
            self._account = Account.from_key(key)

    @property
    def address(self) -> str:
        return self._account.address

    def sign_risk_score(
        self,
        token_id: int,
        from_address: str,
        to_address: str,
        risk_score: int,
        expiration: int | None = None,
    ) -> dict:
        """
        Sign: keccak256(tokenId, from, to, riskScore, nonce, expiration)
        Matches RocketEN3.sol transferWithRiskCheck signature verification.
        """
        if expiration is None:
            expiration = int(time.time()) + 300  # 5 minutes

        # Generate unique nonce
        nonce = "0x" + secrets.token_hex(32)
        nonce_bytes = bytes.fromhex(nonce[2:])

        # Encode exactly as Solidity: abi.encodePacked(...)
        msg_bytes = (
            token_id.to_bytes(32, "big")
            + Web3.to_bytes(hexstr=from_address).rjust(32, b"\x00")[-20:].rjust(32, b"\x00")
            + Web3.to_bytes(hexstr=to_address).rjust(32, b"\x00")[-20:].rjust(32, b"\x00")
            + risk_score.to_bytes(32, "big")
            + nonce_bytes
            + expiration.to_bytes(32, "big")
        )

        msg_hash = Web3.keccak(msg_bytes)
        signed = self._account.sign_message(encode_defunct(primitive=msg_hash))

        return {
            "ai_signature": signed.signature.hex(),
            "ai_nonce": nonce,
            "expiration": expiration,
            "risk_score": risk_score,
            "signer": self.address,
        }


# Singleton
_signer: SigningService | None = None


def get_signer() -> SigningService:
    global _signer
    if _signer is None:
        _signer = SigningService()
    return _signer

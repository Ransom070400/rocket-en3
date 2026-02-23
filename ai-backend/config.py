"""
Application configuration loaded from environment variables.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # Blockchain
    OG_RPC_URL: str = "https://evmrpc-testnet.0g.ai"
    OG_RPC_WS:  str = ""
    CONTRACT_ADDRESS: str = "0x0000000000000000000000000000000000000000"

    # AI Signing key (must match contract's aiSigner)
    AI_SIGNER_PRIVATE_KEY: str = "0x" + "0" * 64

    # 0G Storage
    OG_API_KEY: str = ""

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    # Risk threshold (must match contract RISK_THRESHOLD = 70)
    RISK_THRESHOLD: int = 70

    @property
    def ai_signer_address(self) -> str:
        from eth_account import Account
        try:
            acc = Account.from_key(self.AI_SIGNER_PRIVATE_KEY)
            return acc.address
        except Exception:
            return "0x0000000000000000000000000000000000000000"


settings = Settings()

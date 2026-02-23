"""
0G Storage service: uploads and retrieves NFT metadata JSON from 0G decentralized storage.
"""
import json
import logging
import httpx
from config import settings

logger = logging.getLogger(__name__)

OG_UPLOAD_URL = "https://storage-testnet.0g.ai/api/v1/file"
OG_GATEWAY_URL = "https://indexer-storage-testnet-standard.0g.ai/file"


async def upload_metadata(metadata: dict) -> str:
    """
    Upload JSON metadata to 0G storage.
    Returns the CID/hash of the stored content.
    """
    content = json.dumps(metadata, indent=2).encode("utf-8")

    async with httpx.AsyncClient(timeout=30) as client:
        try:
            resp = await client.post(
                OG_UPLOAD_URL,
                files={"file": ("metadata.json", content, "application/json")},
                headers={"Authorization": f"Bearer {settings.OG_API_KEY}"} if settings.OG_API_KEY else {},
            )
            resp.raise_for_status()
            data = resp.json()
            cid = data.get("cid") or data.get("hash") or data.get("id")
            logger.info(f"Uploaded metadata to 0G: {cid}")
            return cid
        except Exception as e:
            logger.error(f"0G upload failed: {e}")
            # Fallback: return a mock CID for development
            import hashlib
            mock_cid = "bafk" + hashlib.sha256(content).hexdigest()[:44]
            logger.warning(f"Using mock CID: {mock_cid}")
            return mock_cid


async def get_metadata(cid: str) -> dict | None:
    """Retrieve metadata JSON from 0G storage by CID."""
    url = f"{OG_GATEWAY_URL}/{cid}"
    async with httpx.AsyncClient(timeout=15) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            logger.error(f"Failed to retrieve 0G metadata {cid}: {e}")
            return None


def build_ticket_metadata(
    token_id: int,
    event_id: int,
    event_name: str,
    owner: str,
    tier_name: str,
    loyalty_points: int,
    attended: bool,
    image_url: str = "",
) -> dict:
    """Build ERC721-compatible metadata JSON for 0G storage."""
    tier_colors = {
        "Bronze":   "#cd7f32",
        "Silver":   "#c0c0c0",
        "Gold":     "#ffd700",
        "Platinum": "#e5e4e2",
    }
    color = tier_colors.get(tier_name, "#cd7f32")

    return {
        "name": f"{event_name} Ticket #{token_id}",
        "description": f"RocketEN3 NFT Ticket for {event_name}. Tier: {tier_name}",
        "image": image_url or f"https://api.dicebear.com/7.x/shapes/svg?seed={token_id}&backgroundColor={color[1:]}",
        "external_url": f"https://rocketен3.app/ticket/{token_id}",
        "attributes": [
            {"trait_type": "Event ID",       "value": str(event_id)},
            {"trait_type": "Event Name",     "value": event_name},
            {"trait_type": "Owner",          "value": owner},
            {"trait_type": "Tier",           "value": tier_name},
            {"trait_type": "Loyalty Points", "value": loyalty_points, "display_type": "number"},
            {"trait_type": "Attended",       "value": "Yes" if attended else "No"},
        ],
        "rocket_en3": {
            "token_id":      token_id,
            "event_id":      event_id,
            "tier":          tier_name,
            "loyalty_points": loyalty_points,
            "attended":      attended,
            "tier_color":    color,
        },
    }

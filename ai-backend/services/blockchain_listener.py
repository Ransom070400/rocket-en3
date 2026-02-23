"""
Blockchain listener: watches RocketEN3 events and triggers AI reactions.
- TicketCheckedIn → update loyalty, potentially upgrade NFT metadata on 0G
- RatingSubmitted → update organizer reputation in-memory model
- TicketMinted    → log for analytics
"""
import asyncio
import logging
import json
from pathlib import Path

from web3 import Web3, AsyncWeb3
from web3.middleware import ExtraDataToPOAMiddleware

from config import settings

logger = logging.getLogger(__name__)

ABI_PATH = Path(__file__).parent.parent / "abi" / "RocketEN3.json"


async def start_listener(app):
    """Start the blockchain event listener loop."""
    if not settings.CONTRACT_ADDRESS or settings.CONTRACT_ADDRESS == "0x0000000000000000000000000000000000000000":
        logger.warning("CONTRACT_ADDRESS not set, skipping blockchain listener")
        return

    if not ABI_PATH.exists():
        logger.warning("ABI file not found, skipping blockchain listener")
        return

    logger.info(f"Starting blockchain listener on {settings.OG_RPC_WS or settings.OG_RPC_URL}")

    try:
        w3 = Web3(Web3.HTTPProvider(settings.OG_RPC_URL))
        w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)

        with open(ABI_PATH) as f:
            abi = json.load(f)

        contract = w3.eth.contract(
            address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
            abi=abi,
        )

        latest_block = w3.eth.block_number
        logger.info(f"Listening from block {latest_block} on contract {settings.CONTRACT_ADDRESS}")

        while True:
            try:
                current_block = w3.eth.block_number
                if current_block > latest_block:
                    # Fetch events in range
                    from_block = latest_block + 1
                    to_block   = min(current_block, from_block + 100)  # cap batch

                    await _process_events(app, contract, from_block, to_block)
                    latest_block = to_block

                await asyncio.sleep(5)  # poll every 5 seconds

            except Exception as e:
                logger.error(f"Listener loop error: {e}")
                await asyncio.sleep(10)

    except Exception as e:
        logger.error(f"Failed to initialize blockchain listener: {e}")


async def _process_events(app, contract, from_block: int, to_block: int):
    model_mgr = app.state.model_mgr

    # TicketCheckedIn
    try:
        checked_in_events = contract.events.TicketCheckedIn.get_logs(
            from_block=from_block, to_block=to_block
        )
        for evt in checked_in_events:
            token_id  = evt["args"]["tokenId"]
            attendee  = evt["args"]["attendee"]
            loyalty   = evt["args"]
            logger.info(f"[LISTENER] CheckIn: tokenId={token_id}, attendee={attendee}")
            # Loyalty update is already on-chain; here we could trigger metadata refresh on 0G
            # Future: call 0G storage to update dynamic NFT metadata

    except Exception as e:
        logger.debug(f"No TicketCheckedIn events or error: {e}")

    # RatingSubmitted
    try:
        rating_events = contract.events.RatingSubmitted.get_logs(
            from_block=from_block, to_block=to_block
        )
        for evt in rating_events:
            event_id = evt["args"]["eventId"]
            rater    = evt["args"]["rater"]
            rating   = evt["args"]["rating"]
            logger.info(f"[LISTENER] Rating: eventId={event_id}, rater={rater}, rating={rating}")
            # Could update in-memory recommendation model here

    except Exception as e:
        logger.debug(f"No RatingSubmitted events or error: {e}")

    # TransferBlocked (log for analytics)
    try:
        blocked_events = contract.events.TransferBlocked.get_logs(
            from_block=from_block, to_block=to_block
        )
        for evt in blocked_events:
            logger.warning(
                f"[LISTENER] Transfer blocked: tokenId={evt['args']['tokenId']}, "
                f"from={evt['args']['from']}, risk={evt['args']['riskScore']}"
            )
    except Exception as e:
        logger.debug(f"No TransferBlocked events or error: {e}")

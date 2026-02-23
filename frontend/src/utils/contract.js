// Contract ABI - generated from compiled RocketEN3.sol
export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ''

export const CONTRACT_ABI = [
  "function totalEvents() view returns (uint256)",
  "function events(uint256) view returns (uint256 id, address organizer, string name, string metadataCid, uint256 startTime, uint256 endTime, uint256 ticketPrice, uint256 maxTickets, uint256 soldTickets, bytes32 merkleRoot, bool active)",
  "function tickets(uint256) view returns (uint256 eventId, address originalBuyer, string metadataCid, bool attended, bool checkedIn, uint8 tier, uint256 loyaltyPoints, uint256 mintTime, bool ratingSubmitted)",
  "function userEventTicket(address, uint256) view returns (uint256)",
  "function getUserEventIds(address) view returns (uint256[])",
  "function userLoyalty(address) view returns (uint256)",
  "function createEvent(string,string,uint256,uint256,uint256,uint256) returns (uint256)",
  "function buyTicket(uint256,string) payable returns (uint256)",
  "function checkIn(uint256,bytes32,uint256,bytes)",
  "function transferWithRiskCheck(uint256,address,uint256,bytes32,uint256,bytes)",
  "function updateMerkleRoot(uint256,bytes32)",
  "function updateTicketMetadata(uint256,string)",
  "function ownerOf(uint256) view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function tokenURI(uint256) view returns (string)",
  "function aiSigner() view returns (address)",
  "function paused() view returns (bool)",
  "function RISK_THRESHOLD() view returns (uint256)"
]

export const OG_CHAIN = {
  id: 16602,
  name: '0G-Galileo-Testnet',
  rpcUrl: 'https://evmrpc-testnet.0g.ai',
  explorer: 'https://chainscan-galileo.0g.ai',
  nativeCurrency: { name: '0G', symbol: 'OG', decimals: 18 },
}

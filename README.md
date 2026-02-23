ROCKET EN3 🎟️

AI-Powered On-Chain Event Ticketing on 0G

Rocket En3 is a decentralized event ticketing platform deployed on the 0G Testnet. It enables users to purchase event tickets using crypto and receive a smart NFT that acts as their verifiable gate pass.

The system combines smart contracts, AI-assisted validation, and NFT-based access control to eliminate fraud, ticket duplication, and centralized manipulation.

🚀 Live Contract

Network: 0G Testnet

Contract Address: 0xcf476Fd8aE0C7D95D0BF73280Ab1078c84c324F1

📌 Overview

Traditional ticketing systems suffer from:

Ticket fraud and duplication

Scalping

Centralized control

Poor transparency

Rocket En3 solves this by:

Minting tickets as NFTs (ERC721)

Verifying ownership on-chain

Preventing reentrancy and replay attacks

Providing event-based tracking for users

Enabling AI-signed validation for secure minting

🏗️ Architecture
Smart Contract Layer

ERC721 NFT-based tickets

Event creation system

Ticket minting logic

AI signature verification

Reentrancy protection

On-chain user-event tracking

Frontend Layer

Wallet connection

Event browsing

Ticket purchase

NFT ownership verification

User dashboard for purchased events

⚙️ Smart Contract Details
Built With

Solidity ^0.8.24

OpenZeppelin Contracts

0G Chain (EVM compatible)

Core Features
1️⃣ Event Creation

Organizers can create events with:

Event name

Date

Ticket price

Maximum ticket supply

Each event is assigned a unique eventId.

2️⃣ Ticket Minting

Users:

Pay the required ticket price

Receive an NFT as proof of purchase

Are mapped to the event in storage

Each ticket:

Is unique

Is linked to an event

Acts as a gate pass

3️⃣ User Event Tracking

Instead of iterating over all NFTs, the contract tracks user-event relationships via:

mapping(address => mapping(uint256 => uint256)) public userEventTicket;

To fetch events a user has tickets for:

function getUserEventIds(address user) 
    external 
    view 
    returns (uint256[] memory)

This function:

Iterates through existing events

Checks if user has a ticket

Returns a dynamic array of event IDs

Since it is a view function:

✅ No gas cost when called from frontend

❗ Would cost gas only if called from another contract

🔐 Security

The contract includes:

Reentrancy protection via OpenZeppelin ReentrancyGuard

Signature verification to prevent unauthorized minting

Replay attack prevention

Supply limits per event

Strict payment validation

📦 Key Functions
Create Event
createEvent(...)

Creates a new event and increments _nextEventId.

Buy Ticket
buyTicket(uint256 eventId, bytes calldata signature)

Verifies signature

Validates payment

Mints NFT

Records user-event mapping

Get User Events
getUserEventIds(address user)

Returns all event IDs where user owns at least one ticket.

🧠 Why 0G?

Rocket En3 is deployed on the 0G ecosystem, designed for scalable AI-integrated decentralized applications.

Benefits:

EVM compatibility

AI-friendly infrastructure

Scalable smart contract execution

Future AI validation integrations

🖥️ Frontend Workflow

Connect wallet

Browse events

Purchase ticket

Receive NFT

Verify ownership at event gate

Optional:

Display only events user has tickets for (more gas-efficient UI logic)

Fetch ticket metadata from tokenURI

📊 Data Model Overview
Event Struct
struct Event {
    string name;
    uint256 price;
    uint256 maxSupply;
    uint256 ticketsSold;
}
Ticket NFT

Standard ERC721 token

tokenId linked to eventId

Stored with metadata URI

🔄 Contract Flow

Organizer creates event

_nextEventId increments

User calls buyTicket

Contract verifies:

Payment

Supply

Signature

NFT is minted

userEventTicket[user][eventId] is updated

User can retrieve owned event IDs

If using Foundry:

forge install OpenZeppelin/openzeppelin-contracts

If using Hardhat:

npm install @openzeppelin/contracts
🧪 Deployment

Update deployment script with:

const contractAddress = "0xcf476Fd8aE0C7D95D0BF73280Ab1078c84c324F1";

Deploy to 0G Testnet using your preferred framework.

📈 Future Improvements

Secondary marketplace with royalty logic

QR-code NFT verification system

On-chain check-in tracking

AI fraud detection

Dynamic NFT upgrades after event attendance

Gas-optimized user-event indexing

📜 License

MIT

👤 Author

Built as part of a decentralized AI-integrated event infrastructure experiment on 0G.
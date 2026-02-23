// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {MessageHashUtils} from "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title RocketEN3
 * @notice AI-Powered Intelligent NFT Event Infrastructure on 0G
 * @dev Optimized for deployment safety & gas efficiency
 */
contract RocketEN3 is ERC721, Ownable, ReentrancyGuard, Pausable {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;


    ///////////////////////////
    /////     Errors     /////
    /////////////////////////
    error InvalidSigner();
    error InvalidEventTime();
    error TicketsMustBeMoreThanZero();
    error MustBeEventOrganizer();
    error InactiveEvent();
    error EventHasEnded();
    error EventIsSoldOut();
    error InsufficientFunds();
    error YouHaveAlreadyBoughtTickets();
    error YouHaveReachedYourPurchasingLimit();
    error YouHaveAlreadyCheckedIn();
    error Expired();
    error lengthVerificationMismatch();
    error BatchIsTooLong();
    error NoRoot();
    error MustBeContractOwner();
    error RiskyTicket();


    ///////////////////////////
    /////     Events     /////
    /////////////////////////
    event EventCreated(uint256 indexed eventId, address indexed organizer);
    event TicketMinted(uint256 indexed tokenId, uint256 indexed eventId, address buyer);
    event TicketCheckedIn(uint256 indexed tokenId, uint256 indexed eventId);
    event AttendanceRecorded(uint256 indexed tokenId, address attendee, uint256 loyalty);
    event RatingSubmitted(uint256 indexed eventId, address rater, uint8 rating);
    event MetadataUpdated(uint256 indexed tokenId, string newCid);
    event MerkleRootUpdated(uint256 indexed eventId, bytes32 root);
    event AiSignerUpdated(address newSigner);


    /////////////////////////////////////
    /////     Type Declarations    /////
    ///////////////////////////////////
    struct Event {
        uint256 id;
        address organizer;
        string  name;
        string  metadataCid;
        uint256 startTime;
        uint256 endTime;
        uint256 ticketPrice;
        uint256 maxTickets;
        uint256 soldTickets;
        bytes32 merkleRoot;
        bool    active;
    }

    struct Ticket {
        uint256 eventId;
        address originalBuyer;
        string  metadataCid;
        bool    attended;
        bool    checkedIn;
        uint8   tier;
        uint256 loyaltyPoints;
        uint256 mintTime;
        bool    ratingSubmitted;
    }

    //////////////////////////////
    /////     Variables     /////
    ////////////////////////////
    uint256 public constant MAX_RISK_SCORE = 100;
    uint256 public constant RISK_THRESHOLD = 70;
    uint256 public constant LOYALTY_PER_ATTENDANCE = 10;

    uint8 public constant TIER_BRONZE   = 0;
    uint8 public constant TIER_SILVER   = 1;
    uint8 public constant TIER_GOLD     = 2;
    uint8 public constant TIER_PLATINUM = 3;

    address public aiSigner;

    uint256 private _nextTokenId = 1;
    uint256 private _nextEventId = 1;


    mapping(uint256 => Event) public events;
    mapping(uint256 => Ticket) public tickets;
    mapping(address => mapping(uint256 => uint256)) public userEventTicket;
    mapping(address => uint256) public userLoyalty;

    mapping(bytes32 => bool) public usedNonces;
    mapping(bytes32 => bool) public usedAINonces;


    ////////////////////////////////
    /////     Constructor     /////
    //////////////////////////////
    constructor(address _aiSigner)
        ERC721("RocketEN3 Ticket", "RKT3")
        Ownable(msg.sender)
    {
        if (_aiSigner == address(0)) revert InvalidSigner();
        aiSigner = _aiSigner;
    }


    ///////////////////////////////////////
    /////     External Functions     /////
    /////////////////////////////////////
    function createEvent(
        string calldata name,
        string calldata metadataCid,
        uint256 startTime,
        uint256 endTime,
        uint256 ticketPrice,
        uint256 maxTickets
    ) external whenNotPaused returns (uint256) {
        if (startTime < block.timestamp) revert InvalidEventTime();
        if (endTime < startTime) revert InvalidEventTime();
        if (maxTickets <= 0) revert TicketsMustBeMoreThanZero();

        uint256 eventId = _nextEventId++;

        events[eventId] = Event({
            id: eventId,
            organizer: msg.sender,
            name: name,
            metadataCid: metadataCid,
            startTime: startTime,
            endTime: endTime,
            ticketPrice: ticketPrice,
            maxTickets: maxTickets,
            soldTickets: 0,
            merkleRoot: bytes32(0),
            active: true
        });

        emit EventCreated(eventId, msg.sender);
        return eventId;
    }

    function updateMerkleRoot(uint256 eventId, bytes32 root) external {
        if (events[eventId].organizer != msg.sender || msg.sender != owner()) revert MustBeEventOrganizer();
        events[eventId].merkleRoot = root;
        emit MerkleRootUpdated(eventId, root);
    }

    function deactivateEvent(uint256 eventId) external {
        if (events[eventId].organizer != msg.sender || msg.sender != owner()) revert MustBeEventOrganizer();
        events[eventId].active = false;
    }


    function buyTicket(uint256 eventId, string calldata ticketMetaCid)
        external
        payable
        nonReentrant
        whenNotPaused
        returns (uint256)
    {
        Event storage evt = events[eventId];

        if (!evt.active) revert InactiveEvent();
        if (block.timestamp >= evt.endTime) revert EventHasEnded();
        if (evt.soldTickets >= evt.maxTickets) revert EventIsSoldOut();
        if (msg.value < evt.ticketPrice) revert InsufficientFunds();
        if (userEventTicket[msg.sender][eventId] != 0) revert YouHaveAlreadyBoughtTickets();

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);

        uint8 tier = _computeTier(userLoyalty[msg.sender]);

        tickets[tokenId] = Ticket({
            eventId: eventId,
            originalBuyer: msg.sender,
            metadataCid: ticketMetaCid,
            attended: false,
            checkedIn: false,
            tier: tier,
            loyaltyPoints: userLoyalty[msg.sender],
            mintTime: block.timestamp,
            ratingSubmitted: false
        });

        evt.soldTickets++;
        userEventTicket[msg.sender][eventId] = tokenId;

        if (msg.value > evt.ticketPrice) {
            payable(msg.sender).call{value: msg.value - evt.ticketPrice};
        }

        payable(evt.organizer).call{value: evt.ticketPrice};

        emit TicketMinted(tokenId, eventId, msg.sender);
        return tokenId;
    }

   
    function checkIn(
        uint256 tokenId,
        bytes32 nonce,
        uint256 expiration,
        bytes calldata signature
    ) external nonReentrant whenNotPaused {
        require(!usedNonces[nonce], "Nonce used");
        if (block.timestamp > expiration) revert Expired();

        address ownerAddr = ownerOf(tokenId);
        Ticket storage tkt = tickets[tokenId];

        if (tkt.checkedIn) revert YouHaveAlreadyCheckedIn();

        bytes32 hash = keccak256(
            abi.encodePacked(tokenId, ownerAddr, tkt.eventId, nonce, expiration)
        );

        address signer = hash.toEthSignedMessageHash().recover(signature);
        if (signer != ownerAddr) revert InvalidSigner();

        usedNonces[nonce] = true;

        tkt.checkedIn = true;
        tkt.attended = true;

        userLoyalty[ownerAddr] += LOYALTY_PER_ATTENDANCE;
        tkt.loyaltyPoints = userLoyalty[ownerAddr];
        tkt.tier = _computeTier(userLoyalty[ownerAddr]);

        emit TicketCheckedIn(tokenId, tkt.eventId);
        emit AttendanceRecorded(tokenId, ownerAddr, userLoyalty[ownerAddr]);
    }

    
    function syncOfflineCheckIns(
        uint256 eventId,
        uint256[] calldata tokenIds,
        bytes32[][] calldata proofs
    ) external nonReentrant {
        if (events[eventId].organizer != msg.sender && msg.sender != owner()) revert MustBeEventOrganizer();
        if (tokenIds.length != proofs.length) revert lengthVerificationMismatch();
        if (tokenIds.length > 50) revert BatchIsTooLong();

        bytes32 root = events[eventId].merkleRoot;
        if (root == bytes32(0)) revert NoRoot();

        for (uint256 i = 0; i < tokenIds.length; i++) {
            uint256 tokenId = tokenIds[i];
            if (tickets[tokenId].checkedIn) continue;

            address ownerAddr = ownerOf(tokenId);
            bytes32 leaf = keccak256(abi.encodePacked(tokenId, ownerAddr, eventId));

            if (_verifyMerkle(leaf, proofs[i], root)) {
                tickets[tokenId].checkedIn = true;
                tickets[tokenId].attended = true;

                userLoyalty[ownerAddr] += LOYALTY_PER_ATTENDANCE;
                tickets[tokenId].loyaltyPoints = userLoyalty[ownerAddr];
                tickets[tokenId].tier = _computeTier(userLoyalty[ownerAddr]);

                emit TicketCheckedIn(tokenId, eventId);
                emit AttendanceRecorded(tokenId, ownerAddr, userLoyalty[ownerAddr]);
            }
        }
    }


    function transferWithRiskCheck(
        uint256 tokenId,
        address to,
        uint256 riskScore,
        bytes32 aiNonce,
        uint256 expiration,
        bytes calldata aiSignature
    ) external nonReentrant {
        if (ownerOf(tokenId) != msg.sender) revert MustBeContractOwner();
        require(!usedAINonces[aiNonce], "Nonce used");
        if (block.timestamp > expiration) revert Expired();
        if (riskScore > MAX_RISK_SCORE) revert RiskyTicket();

        bytes32 hash = keccak256(
            abi.encodePacked(tokenId, msg.sender, to, riskScore, aiNonce, expiration)
        );

        address signer = hash.toEthSignedMessageHash().recover(aiSignature);
        if (signer != aiSigner) revert InvalidSigner();

        usedAINonces[aiNonce] = true;

        if (riskScore >= RISK_THRESHOLD) {
            revert RiskyTicket();
        }

        _transfer(msg.sender, to, tokenId);
    }

    // ─────────────────────────────────────────────
    // METADATA UPDATE
    // ─────────────────────────────────────────────
    function updateTicketMetadata(uint256 tokenId, string calldata newCid) external {
        if (msg.sender != aiSigner || msg.sender != owner()) revert InvalidSigner();
        tickets[tokenId].metadataCid = newCid;
        emit MetadataUpdated(tokenId, newCid);
    }

    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        return string(
            abi.encodePacked(
                "https://indexer-storage-testnet-standard.0g.ai/file/",
                tickets[tokenId].metadataCid
            )
        );
    }

    function _computeTier(uint256 loyalty) internal pure returns (uint8) {
        if (loyalty >= 100) return TIER_PLATINUM;
        if (loyalty >= 50)  return TIER_GOLD;
        if (loyalty >= 20)  return TIER_SILVER;
        return TIER_BRONZE;
    }

    function _verifyMerkle(bytes32 leaf, bytes32[] calldata proof, bytes32 root)
        internal pure returns (bool)
    {
        bytes32 computed = leaf;
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 el = proof[i];
            computed = computed <= el
                ? keccak256(abi.encodePacked(computed, el))
                : keccak256(abi.encodePacked(el, computed));
        }
        return computed == root;
    }

    receive() external payable {}


    ////////////////////////////////////////////////////
    /////    Public & External View Functions     /////
    //////////////////////////////////////////////////
    function totalEvents() external view returns (uint256) {
        return _nextEventId - 1;
    }

    function getUserEventIds(address user) external view returns (uint256[] memory) {
        uint256 count = 0;

        for (uint256 i = 1; i < _nextEventId; i++) {
            if (userEventTicket[user][i] != 0) {
                count++;
            }
        }

        uint256[] memory result = new uint256[](count);
        uint256 idx = 0;

        for (uint256 i = 1; i < _nextEventId; i++) {
            if (userEventTicket[user][i] != 0) {
                result[idx] = i;
                idx++;
            }
        }

        return result;
    }
}
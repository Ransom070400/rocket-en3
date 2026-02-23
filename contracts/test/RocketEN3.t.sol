// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/RocketEN3.sol";

contract RocketEN3Test is Test {
    // RocketEN3 public rocket;

    // address owner   = address(this);
    // address aiKey   = makeAddr("aikey");
    // address alice   = address(0xA11CE);
    // address bob     = address(0xB0B);
    // address organizer = address(0x0FF);

    // uint256 constant PRICE = 0.01 ether;

    // function setUp() public {
    //     rocket = new RocketEN3(aiKey);
    //     vm.deal(alice, 10 ether);
    //     vm.deal(bob, 10 ether);
    //     vm.deal(organizer, 1 ether);
    // }

    // function _createEvent() internal returns (uint256) {
    //     vm.prank(organizer);
    //     return rocket.createEvent(
    //         "Rocket Launch Party",
    //         "bafytest1234",
    //         block.timestamp + 1 days,
    //         block.timestamp + 2 days,
    //         PRICE,
    //         100
    //     );
    // }

    // function testCreateEvent() public {
    //     uint256 eventId = _createEvent();
    //     assertEq(eventId, 1);
    //     RocketEN3.Event memory evt = rocket.getEvent(1);
    //     assertEq(evt.name, "Rocket Launch Party");
    //     assertEq(evt.organizer, organizer);
    //     assertEq(evt.ticketPrice, PRICE);
    // }

    // function testBuyTicket() public {
    //     uint256 eventId = _createEvent();
    //     vm.prank(alice);
    //     uint256 tokenId = rocket.buyTicket{value: PRICE}(eventId, "bafyticket1");
    //     assertEq(tokenId, 1);
    //     assertEq(rocket.ownerOf(tokenId), alice);
    // }

    // function testCannotBuyTwice() public {
    //     uint256 eventId = _createEvent();
    //     vm.startPrank(alice);
    //     rocket.buyTicket{value: PRICE}(eventId, "bafyticket1");
    //     vm.expectRevert("Already have ticket");
    //     rocket.buyTicket{value: PRICE}(eventId, "bafyticket2");
    //     vm.stopPrank();
    // }

    // function testCheckIn() public {
    //     uint256 eventId = _createEvent();
    //     vm.prank(alice);
    //     uint256 tokenId = rocket.buyTicket{value: PRICE}(eventId, "bafyticket1");

    //     // Warp to event start
    //     vm.warp(block.timestamp + 1 days + 1);

    //     bytes32 nonce = keccak256("nonce1");
    //     uint256 expiry = block.timestamp + 5 minutes;

    //     bytes32 msgHash = keccak256(abi.encodePacked(tokenId, alice, eventId, nonce, expiry));
    //     bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));

    //     (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(alice)), ethHash);
    //     // Note: in real test use alice's private key; here we use alice's address as key for demonstration
    //     bytes memory sig = abi.encodePacked(r, s, v);

    //     vm.prank(organizer);
    //     // Signing with alice's key (for test, alice private key = uint256(uint160(alice)))
    //     rocket.checkIn(tokenId, nonce, expiry, sig);
    // }

    // function testMerkleVerification() public {
    //     uint256 eventId = _createEvent();
    //     vm.prank(alice);
    //     uint256 tokenId = rocket.buyTicket{value: PRICE}(eventId, "bafyticket1");

    //     // Build a simple single-leaf Merkle tree
    //     bytes32 leaf = keccak256(abi.encodePacked(tokenId, alice, eventId));

    //     // Single leaf => root == leaf
    //     vm.prank(organizer);
    //     rocket.updateMerkleRoot(eventId, leaf);
    //     assertEq(rocket.getEvent(eventId).merkleRoot, leaf);
    // }

    // function testRiskBlockedTransfer() public {
    //     uint256 eventId = _createEvent();
    //     vm.prank(alice);
    //     uint256 tokenId = rocket.buyTicket{value: PRICE}(eventId, "bafyticket1");

    //     uint256 highRisk = 80; // Above threshold
    //     bytes32 aiNonce  = keccak256("ainonce1");
    //     uint256 expiry   = block.timestamp + 5 minutes;

    //     bytes32 msgHash = keccak256(abi.encodePacked(tokenId, alice, bob, highRisk, aiNonce, expiry));
    //     bytes32 ethHash = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", msgHash));
    //     (uint8 v, bytes32 r, bytes32 s) = vm.sign(uint256(uint160(aiKey)), ethHash);
    //     bytes memory sig = abi.encodePacked(r, s, v);

    //     vm.prank(alice);
    //     vm.expectRevert("Transfer blocked: high risk score");
    //     rocket.transferWithRiskCheck(tokenId, bob, highRisk, aiNonce, expiry, sig);
    // }

    // function testGetAllEventIds() public {
    //     _createEvent();
    //     _createEvent();
    //     uint256[] memory ids = rocket.getAllEventIds();
    //     assertEq(ids.length, 2);
    // }

    // function testLoyaltyTierComputation() public {
    //     // Bronze = 0 loyalty
    //     uint256 eventId = _createEvent();
    //     vm.prank(alice);
    //     uint256 tokenId = rocket.buyTicket{value: PRICE}(eventId, "bafyticket1");
    //     assertEq(rocket.getTicket(tokenId).tier, 0); // Bronze
    // }

    // function testPause() public {
    //     rocket.pause();
    //     assertTrue(rocket.paused());
    //     rocket.unpause();
    //     assertFalse(rocket.paused());
    // }

    // function testRefundExcess() public {
    //     uint256 eventId = _createEvent();
    //     uint256 before = alice.balance;
    //     vm.prank(alice);
    //     rocket.buyTicket{value: 0.05 ether}(eventId, "bafyticket1");
    //     // Should be refunded 0.04 ether
    //     assertApproxEqAbs(alice.balance, before - PRICE, 1e15);
    // }
}

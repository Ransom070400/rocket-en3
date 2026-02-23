// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console2} from "forge-std/Script.sol";
import {RocketEN3} from "../src/RocketEN3.sol";

contract DeployRocketEN3 is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address aiSigner    = vm.envAddress("AI_SIGNER_ADDRESS");

        vm.startBroadcast(deployerPrivateKey);
        RocketEN3 rocket = new RocketEN3(aiSigner);
        vm.stopBroadcast();

        console2.log("Contract:", address(rocket));
        console2.log("AI Signer:", aiSigner);

    }
}

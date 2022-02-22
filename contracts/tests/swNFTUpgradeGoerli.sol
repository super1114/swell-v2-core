//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "../swNFTUpgrade.sol";

contract SWNFTUpgradeGoerli is SWNFTUpgrade {

    function initialize() override external initializer {
        __ERC721_init("Swell NFT", "swNFT");
        __UUPSUpgradeable_init();
        __Ownable_init();
        ETHER = 1e18;
        depositContract = IDepositContract(
        0x07b39F4fDE4A38bACe212b546dAc87C58DfE3fDC);
    }
}
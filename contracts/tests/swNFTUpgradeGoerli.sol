//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "../swNFTUpgrade.sol";

contract SWNFTUpgradeGoerli is SWNFTUpgrade {

    function initialize(address _swDAOAddress) override external initializer {
        require(_swDAOAddress != address(0), "swDAOAddress cannot be 0");
        __ERC721_init("Swell NFT", "swNFT");
        __UUPSUpgradeable_init();
        __Ownable_init();
        ETHER = 1e18;
        depositContract = IDepositContract(
        0x07b39F4fDE4A38bACe212b546dAc87C58DfE3fDC);
        swDAOAddress = _swDAOAddress;
    }
}
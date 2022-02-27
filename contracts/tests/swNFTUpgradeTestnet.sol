//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "../swNFTUpgrade.sol";

contract SWNFTUpgradeTestnet is SWNFTUpgrade {

    function initialize(address _swDAOAddress, address _depositContract) external initializer {
        require(_swDAOAddress != address(0), "swDAOAddress cannot be 0");
        require(_depositContract != address(0), "depositContract cannot be 0");
        __ERC721_init("Swell NFT", "swNFT");
        __UUPSUpgradeable_init();
        __Ownable_init();
        ETHER = 1e18;
        depositContract = IDepositContract(_depositContract);
        swDAOAddress = _swDAOAddress;
        swETHSymbol = "swETH";
    }
}
//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "./swNFTUpgrade18.sol";

contract SWNFTUpgradeTestnet18 is SWNFTUpgrade18 {
    function initialize(address _swellAddress, address _depositContract)
        external
        initializer
    {
        require(_swellAddress != address(0), "SwellAddress cannot be 0");
        require(_depositContract != address(0), "depositContract cannot be 0");
        __ERC721_init(swNFTName, swNFTSymbol);
        __Ownable_init();
        ETHER = 1e18;
        depositContract = IDepositContract(_depositContract);
        swellAddress = _swellAddress;
    }
}

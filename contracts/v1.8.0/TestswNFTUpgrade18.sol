//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.13;

import "./swNFTUpgrade18.sol";

contract TestswNFTUpgrade18 is SWNFTUpgrade18 {
    address public eth1WithdrawalAddress;

    function initialize(address _swellAddress, address _eth1WithdrawalAddress)
        external
        initializer
    {
        require(_swellAddress != address(0), "SwellAddress cannot be 0");
        require(
            _eth1WithdrawalAddress != address(0),
            "eth1WithdrawalAddress cannot be 0"
        );
        eth1WithdrawalAddress = _eth1WithdrawalAddress;
        __ERC721_init(swNFTName, swNFTSymbol);
        __Ownable_init();
        ETHER = 1e18;
        depositContract = IDepositContract(
            0x00000000219ab540356cBB839Cbe05303d7705Fa
        );
        swellAddress = _swellAddress;
    }

    function getWithdrawalCredentials()
        public
        view
        override
        returns (bytes memory)
    {
        return
            abi.encodePacked(bytes1(0x01), bytes11(0x0), eth1WithdrawalAddress);
    }
}

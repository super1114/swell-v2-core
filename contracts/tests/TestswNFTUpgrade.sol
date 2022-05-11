//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "../swNFTUpgrade.sol";

contract TestswNFTUpgrade is SWNFTUpgrade {
    address public eth1WithdrawalAddress;

    function initialize(address _swellAddress, address _eth1WithdrawalAddress) external initializer {
        require(_swellAddress != address(0), "SwellAddress cannot be 0");
        require(_eth1WithdrawalAddress != address(0), "eth1WithdrawalAddress cannot be 0");
        eth1WithdrawalAddress = _eth1WithdrawalAddress;
        __ERC721_init("Swell NFT", "swNFT");
        __Ownable_init();
        ETHER = 1e18;
        depositContract = IDepositContract(
        0x00000000219ab540356cBB839Cbe05303d7705Fa);
        swellAddress = _swellAddress;
        swETHSymbol = "swETH";
    }

    function getWithdrawalCredentials() public override view returns (bytes memory) {
        return abi.encodePacked(bytes1(0x01), bytes11(0x0), eth1WithdrawalAddress);
    }
}
//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "../swNFTUpgrade.sol";

contract TestswNFTUpgrade is SWNFTUpgrade {
    address public eth1WithdrawalAddress;

    function initialize(address _eth1WithdrawalAddress) external initializer {
        eth1WithdrawalAddress = _eth1WithdrawalAddress;
        __ERC721_init("Swell NFT", "swNFT");
        __UUPSUpgradeable_init();
        __Ownable_init();
        ETHER = 1e18;
        depositContract = IDepositContract(
        0x00000000219ab540356cBB839Cbe05303d7705Fa);
    }

    function getWithdrawalCredentials() public override view returns (bytes memory) {
        return abi.encodePacked(bytes1(0x01), bytes11(0x0), eth1WithdrawalAddress);
    }
}
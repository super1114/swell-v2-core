//SPDX-License-Identifier: BSL-1.1

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Contract for SWNFT
contract SWETH is ERC20, Ownable {
    /// @notice initialise the contract to issue the token
    /// @param _eth1WithdrawalAddress address of the contract that will receive the ETH1 withdrawal
    constructor(address _eth1WithdrawalAddress) ERC20("Swell Ether", "swETH") {
    }

    function mint(uint256 amount) external onlyOwner {
        _mint(owner(), amount);
    }

    function burnt(uint256 amount) external onlyOwner {
        _mint(owner(), amount);
    }
}
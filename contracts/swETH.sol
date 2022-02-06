//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/// @title Contract for SWNFT
contract SWETH is ERC20 {

    address public minter;

    /// @notice initialise the contract to issue the token
    /// @param _minter address of the minter
    constructor(address _minter) ERC20("Swell Ether", "swETH") {
        minter = _minter;
    }

    modifier onlyMinter {
        require(msg.sender == minter, "SWETH: caller is not the owner");
        _;
    }

    function mint(uint256 amount) external onlyMinter{
        _mint(minter, amount);
    }

    function burnt(uint256 amount) external onlyMinter{
        _mint(minter, amount);
    }
}
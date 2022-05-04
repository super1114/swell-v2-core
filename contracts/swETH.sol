//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./interfaces/ISWETH.sol";

/// @title Contract for SWNFT
contract SWETH is ISWETH, ERC20 {

    address public immutable minter;
    string constant swETHName = "Swell Ether";
    string constant swETHSymbol = "swETH";

    /// @notice initialise the contract to issue the token
    /// @param _minter address of the minter
    constructor(address _minter) ERC20(swETHName, swETHSymbol) {
        require(_minter != address(0), "Address cannot be 0");
        minter = _minter;
    }

    modifier onlyMinter {
        require(msg.sender == minter, "SWETH: caller is not the minter");
        _;
    }

    function mint(uint256 amount) external onlyMinter{
        _mint(minter, amount);
    }

    function burn(uint256 amount) external onlyMinter{
        _burn(minter, amount);
    }
}
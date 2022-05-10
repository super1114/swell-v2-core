//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/ISWETH.sol";

/// @title Contract for SWNFT
contract SWELL is ISWETH, ERC20, Ownable {
    string constant swDAOName = "Swell DAO Token";
    string constant swDAOSymbol = "SWELL";

    /// @notice initialise the contract to issue the token
    constructor() ERC20(swDAOName, swDAOSymbol) {}

    function burn(uint256 amount) external onlyOwner{
        _burn(msg.sender, amount);
    }

    function mint(uint256 amount) external onlyOwner{
        _mint(msg.sender, amount);
    }
}
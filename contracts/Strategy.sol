//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "./interfaces/IStrategy.sol";
import "./interfaces/ISWETH.sol";
import "./interfaces/ISWNFT.sol";

/// @title Contract for Strategy
contract Strategy is IStrategy {
    /// @dev The token ID position data
    mapping(uint256 => uint) public positions;

    address public immutable swNFT;

    constructor(address _swNFT) {
        require(_swNFT != address(0), "Address cannot be 0");
        swNFT = _swNFT;
    }

    modifier onlyswNFT {
        require(msg.sender == swNFT, "Strategy: caller is not the swNFT");
        _;
    }

    /// @notice Enter vault
    /// @param tokenId The token ID
    /// @param amount The amount of swETH
    /// @return success or not
    function enter(uint tokenId, uint amount) external onlyswNFT returns (bool success) {
        require(amount > 0, "cannot enter strategy with 0 amount");
        address swETHAddress = ISWNFT(swNFT).swETHAddress();
        positions[tokenId] += amount;
        emit LogEnter(tokenId, amount);
        success = ISWETH(swETHAddress).transferFrom(msg.sender, address(this), amount);
    }

    /// @notice Exit vault
    /// @param tokenId The token ID
    /// @param amount The amount of swETH
    /// @return success or not
    function exit(uint tokenId, uint amount) external onlyswNFT returns (bool success) {
        require(amount > 0, "No position to exit");
        require(amount <= positions[tokenId], "Not enough position to exit");
        address swETHAddress = ISWNFT(swNFT).swETHAddress();
        positions[tokenId] -= amount;
        emit LogExit(tokenId, amount);
        success = ISWETH(swETHAddress).transfer(msg.sender, amount);
    }
}
//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

import "./interfaces/IStrategy.sol";
import "./interfaces/ISWETH.sol";
import "./interfaces/ISWNFT.sol";

/// @title Contract for Strategy
contract Strategy is IStrategy {
    /// @dev The token ID position data
    mapping(uint256 => uint) public positions;

    address public swNFT;

    constructor(address _swNFT) {
        swNFT = _swNFT;
    }

    modifier onlyswNFT {
        require(msg.sender == swNFT);
        _;
    }

    function enter(uint tokenId, uint amount) external onlyswNFT returns (bool success) {
        address swETHAddress = ISWNFT(swNFT).swETHAddress();
        success = ISWETH(swETHAddress).transferFrom(msg.sender, address(this), amount);
        if(!success) return success;
        positions[tokenId] += amount;
        emit LogEnter(tokenId, amount);
    }

    function exit(uint tokenId) external onlyswNFT returns (uint amount) {
        address swETHAddress = ISWNFT(swNFT).swETHAddress();
        amount = positions[tokenId];
        require(amount > 0, "No position to exit");
        bool success = ISWETH(swETHAddress).transfer(msg.sender, amount);
        if(!success) return 0;
        positions[tokenId] -= amount;
        emit LogExit(tokenId, amount);
    }
}
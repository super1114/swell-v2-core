//SPDX-License-Identifier: BUSL-1.1

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

pragma solidity 0.8.9;

/// @title Interface for swNFT
interface ISWNFT is IERC721
{
    struct Position {
        bytes pubKey;
        uint value;
        uint baseTokenBalance;
    }

    function stake(
        bytes calldata pubKey,
        bytes calldata signature,
        bytes32 depositDataRoot
    ) external payable returns (uint256 newItemId);

    function setBaseTokenAddress(address _baseTokenAddress) external;

    // ============ Events ============

    event LogStake(
        address user,
        uint256 itemId,
        bytes pubKey,
        uint deposit
    );

    event LogDeposit(
        uint tokenId,
        address user,
        uint amount
    );

    event LogWithdraw(
        uint tokenId,
        address user,
        uint amount
    );
}
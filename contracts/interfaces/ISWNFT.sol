//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

/// @title Interface for swNFT
interface ISWNFT
{
    struct Position {
        bytes pubKey;
        uint value;
        uint baseTokenBalance;
    }

    function deposit(
        bytes calldata pubKey,
        bytes calldata signature,
        bytes32 depositDataRoot
    ) external payable returns (uint256 newItemId);

    // ============ Events ============

    event LogDeposit(
        address user,
        uint256 itemId,
        bytes pubKey,
        uint256 deposit
    );
}
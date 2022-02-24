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

    struct Action {
        uint tokenId;
        uint action;
        uint amount;
        uint strategy;
    }

    enum ActionChoices { Deposit, Withdraw, EnterStrategy, ExitStrategy }

    function swETHAddress() external view returns (address);

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

    event LogAddStrategy(
        address strategy
    );

    event LogRemoveStrategy(
        uint strategyIndex,
        address strategy
    );

    event LogEnterStrategy(
        uint tokenId,
        uint strategyIndex,
        address strategy,
        address user,
        uint amount
    );

    event LogExitStrategy(
        uint tokenId,
        uint strategyIndex,
        address strategy,
        address user,
        uint amount
    );

    event LogAddWhiteList(
        address user,
        bytes pubKey
    );
}
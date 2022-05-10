//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

/// @title Interface for swNFT
interface ISWNFT
{
    struct Position {
        bytes pubKey;
        uint value;
        uint baseTokenBalance;
        uint timeStamp;
        bool operator;
    }

    struct Action {
        uint tokenId;
        uint action;
        uint amount;
        address strategy;
    }

    struct Stake {
        bytes pubKey;
        bytes signature;
        bytes32 depositDataRoot;
        uint amount;
    }

    enum ActionChoices { Deposit, Withdraw, EnterStrategy, ExitStrategy }

    function swETHAddress() external view returns (address);

    // ============ Events ============

    event LogStake(
        address indexed user,
        uint256 indexed itemId,
        bytes indexed pubKey,
        uint deposit,
        uint timeStamp
    );

    event LogDeposit(
        uint indexed tokenId,
        address user,
        uint amount
    );

    event LogWithdraw(
        uint indexed tokenId,
        address user,
        uint amount
    );

    event LogAddStrategy(
        address indexed strategy
    );

    event LogRemoveStrategy(
        address indexed strategy
    );

    event LogEnterStrategy(
        uint indexed tokenId,
        address strategy,
        address user,
        uint amount
    );

    event LogExitStrategy(
        uint indexed tokenId,
        address strategy,
        address user,
        uint amount
    );

    event LogAddWhiteList(
        address user,
        bytes indexed pubKey
    );

    event LogUpdateBotAddress(
        address _address
    );

    event LogUpdateIsValidatorActive(
        address user,
        bytes indexed pubKey,
        bool isActive
    );

    event LogSetSWETHAddress(
        address swETHAddress
    );

    event LogSetFeePool(
        address feePool
    );
}

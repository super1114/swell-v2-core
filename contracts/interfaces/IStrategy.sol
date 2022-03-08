//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

/// @title Interface for swETH
interface IStrategy {
    function enter(uint tokenId, uint amount) external returns (bool success);
    function exit(uint tokenId) external returns (uint amount);

    // ============ Events ============

    event LogEnter(
        uint indexed tokenId,
        uint amount
    );

    event LogExit(
        uint indexed tokenId,
        uint amount
    );
}
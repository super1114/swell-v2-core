//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

/// @title Interface for swETH
interface ISWETH
{
    function mint(uint256 amount) external;

    function burnt(uint256 amount) external;
}
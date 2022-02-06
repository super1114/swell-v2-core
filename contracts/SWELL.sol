//SPDX-License-Identifier: BUSL-1.1

pragma solidity 0.8.9;

/// @title Contract for Swell Network
contract SWELLNETWORK {
    address public swNFT;
    address public swETH;

    constructor(address _swNFT, address _swETH) {
        swNFT = _swNFT;
        swETH = _swETH;
    }

    function deposit() external {}

    function withdraw() external {}
}
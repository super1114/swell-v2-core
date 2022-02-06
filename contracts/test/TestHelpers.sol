//SPDX-License-Identifier: BUSL-1.1
pragma solidity 0.8.9;

import "../helpers.sol";

contract TestHelpers {
    using Helpers for uint256;

    function uint2String(uint a) external pure returns (string memory) {
        return a.uint2str();
    }
}
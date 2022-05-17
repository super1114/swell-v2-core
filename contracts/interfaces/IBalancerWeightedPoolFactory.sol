//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/draft-IERC20Permit.sol";

interface IBalancerWeightedPoolFactory {
    event PoolCreated(address indexed pool);

    function create(
        string memory name,
        string memory symbol,
        IERC20Permit[] memory tokens,
        uint256[] memory weights,
        uint256 swapFeePercentage,
        address owner
    ) external returns (address);
}

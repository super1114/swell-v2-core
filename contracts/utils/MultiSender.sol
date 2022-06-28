//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MultiSender {
    constructor() {}

    event MultiSend(address indexed sender, uint256 value);

    function multiSend(address[] calldata addrs) external payable {
        require(msg.value > 0, "no value");
        require(addrs.length > 0);
        uint256 dispatchAmount = msg.value / addrs.length;
        for (uint256 i = 0; i < addrs.length; i++) {
            payable(addrs[i]).transfer(dispatchAmount);
        }
        emit MultiSend(msg.sender, msg.value);
    }

    receive() external payable {}
}

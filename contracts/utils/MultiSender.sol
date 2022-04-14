//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract MultiSender {
    constructor () {}
    
    function multiSend(address[] memory addrs) external payable {
        require(msg.value>0, "no value");
        require(addrs.length>0);
        uint256 dispatchAmount = msg.value/addrs.length;
        for(uint i=0; i<addrs.length; i++) {
            payable(addrs[i]).transfer(dispatchAmount);
        }
    }
    
    receive() external payable { }
}
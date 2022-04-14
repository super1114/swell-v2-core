//SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract MultiSender {
    constructor () {}
    
    function multiSend(bytes memory data) external payable {
        require(msg.value>0, "no value");
        address[] memory addrs = abi.decode(data, (address[]));
        require(addrs.length>0);
        uint256 dispatchAmount = msg.value/addrs.length;
        for(uint i=0; i<addrs.length; i++) {
            payable(addrs[i]).transfer(dispatchAmount);
        }
    }
    
    receive() external payable { }
}
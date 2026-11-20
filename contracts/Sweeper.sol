// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IERC20 {
    function transferFrom(address, address, uint256) external returns (bool);
}

contract Sweeper {
    address public immutable op;

    constructor(address o) {
        require(o != address(0), "op zero");
        op = o;
    }

    function pull(address token, address from, address to, uint160 amount) external {
        require(msg.sender == op, "op");
        require(IERC20(token).transferFrom(from, to, amount), "transfer");
    }
}
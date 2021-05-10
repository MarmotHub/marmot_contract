/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity ^0.6.9;
pragma experimental ABIEncoderV2;

interface ILpToken {
    function mint(address user, uint256 value) external;

    function burn(address user, uint256 value) external;

    function balanceOf(address owner) external view returns (uint256);

    function totalSupply() external view returns (uint256);
}

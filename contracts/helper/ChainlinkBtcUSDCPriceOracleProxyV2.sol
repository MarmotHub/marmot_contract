/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeMath} from "../lib/SafeMath.sol";

interface IChainlink {
    function latestAnswer() external view returns (uint256);
}


// for WETH-USDC(decimals=6) price convert

contract ChainlinkBTCPriceOracleProxyV2 {
    using SafeMath for uint256;

    address public chainlink = 0x6135b13325bfC4B00278B4abC5e20bbce2D6580e;

    function getPrice() external view returns (uint256) {
        return IChainlink(chainlink).latestAnswer().mul(10**10);
    }
}



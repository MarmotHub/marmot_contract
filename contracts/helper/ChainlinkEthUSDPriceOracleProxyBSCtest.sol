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

contract ChainlinkETHPriceOracleProxyBSCtest {
    using SafeMath for uint256;

    address public chainlink = 0x143db3CEEfbdfe5631aDD3E50f7614B6ba708BA7;

    function getPrice() external view returns (uint256) {
        return IChainlink(chainlink).latestAnswer().mul(10**10);
    }
}



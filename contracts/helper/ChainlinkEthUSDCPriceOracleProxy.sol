/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;


interface IChainlink {
    function latestAnswer() external view returns (uint256);
}


// for WETH-USDC(decimals=6) price convert

contract ChainlinkETHPriceOracleProxy {
    address public chainlink = 0x9326BFA02ADD2366b30bacB125260Af641031331;

    function getPrice() external view returns (uint256) {
        return IChainlink(chainlink).latestAnswer() * 100;
    }
}

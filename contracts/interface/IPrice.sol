/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;


import {IPara} from "../interface/IPara.sol";
import {Types} from "../lib/Types.sol";


// Oracle only for test
interface IPrice {
    // init
    function getExpectedTarget() external view returns (Types.VirtualBalance memory);
    function getMidPrice() external view returns (uint256 midPrice);
    function queryPNLwiValue(
        Types.Side accountSide,
        uint256 entryValue,
        uint256 closeValue
    ) external view returns (int256);
    function queryPNL(
        Types.Side accountSide,
        uint256 accountSize,
        uint256 accountEntryValue,
        uint256 amount
    ) external view returns (int256);
    function closePositionValue(
        Types.Side side,
        uint256 amount
    ) external view returns (uint256 closeValue);
    function querySellBaseToken(uint256 amount) external returns (uint256 receiveQuote);
    function queryBuyBaseToken(uint256 amount) external returns (uint256 payQuote);
    function _queryBuyBaseToken(uint256 buyBaseAmount)
        external
        view
        returns (
            uint256 payQuote,
            uint256 lpFeeQuote,
            uint256 mtFeeQuote,
            Types.VirtualBalance memory updateBalance
        );

    function _querySellBaseToken(uint256 sellBaseAmount)
        external
        view
        returns (
            uint256 receiveQuote,
            uint256 lpFeeQuote,
            uint256 mtFeeQuote,
            Types.VirtualBalance memory updateBalance
        );




}
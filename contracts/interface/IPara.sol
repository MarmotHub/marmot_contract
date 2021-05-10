/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;
import {Admin} from "../admin/Admin.sol";


interface IPara {
    function init(
        address adminAddress,
        address pricingAddress,
        string memory tokenName
    ) external;

    function transferOwnership(address newOwner) external;

    function claimOwnership() external;

    function initialMargin(
        uint256 amount,
        uint256 markPrice
    ) external returns (uint256);

    function maintenanceMargin(
        uint256 amount,
        uint256 markPrice
    ) external view returns (uint256);

    function sellBaseToken(
        uint256 amount,
        uint256 minReceiveQuote
    ) external returns (uint256);

    function buyBaseToken(
        uint256 amount,
        uint256 maxPayQuote
    ) external returns (uint256);

    function querySellBaseToken(uint256 amount) external view returns (uint256 receiveQuote);

    function queryBuyBaseToken(uint256 amount) external view returns (uint256 payQuote);

    function getExpectedTarget() external view returns (uint256 baseTarget, uint256 quoteTarget);

    function depositBaseTo(address to, uint256 amount) external returns (uint256);

    function withdrawBase(uint256 amount) external returns (uint256);

    function withdrawAllBase() external returns (uint256);

    function depositQuoteTo(address to, uint256 amount) external returns (uint256);

    function withdrawQuote(uint256 amount) external returns (uint256);

    function withdrawAllQuote() external returns (uint256);

    function _COLLATERAL_POOL_TOKEN_() external view returns (address);

    function _COLLATERAL_TOKEN_() external returns (address);

    function _ORACLE_() external returns (address);

    function ADMIN() external returns (address);

}

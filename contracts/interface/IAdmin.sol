/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;


import {IPara} from "../interface/IPara.sol";


// Oracle only for test
interface IAdmin {
    // init
    function init(
        address owner,
        address supervisor,
        address maintainer,
        address collateralToken,
        address oracle,
        uint256 lpFeeRate,
        uint256 mtFeeRate,
        uint256 k,
        uint256 gasPriceLimit
    ) external;
    // getters
    function _PAUSED_() external view returns (bool);
    function _CLOSED_() external view returns (bool);
    function _DEPOSIT_ALLOWED_() external view returns (bool);
    function _GAS_PRICE_LIMIT_() external view returns (uint256);
    function _BUYING_ALLOWED_() external view returns (bool);
    function _SELLING_ALLOWED_() external view returns (bool);

    function _SUPERVISOR_() external view returns (address);
    function _MAINTAINER_() external view returns (address);

    function _COLLATERAL_TOKEN_() external view returns (address);
    function _ORACLE_() external view returns (address);
    function _TOKEN_NAME_() external view returns (string memory);
    function _LP_FEE_RATE_() external view returns (uint256);
    function _MT_FEE_RATE_() external view returns (uint256);
    function _K_() external view returns (uint256);

    function _INITIAL_MARGIN_RATE_() external view returns (uint256);
    function _MAINTENANCE_MARGIN_RATE_() external view returns (uint256);
    function _POOL_OPEN_TH_() external view returns (uint256);
    function _POOL_LIQUIDATE_TH_() external view returns (uint256);
    function _LIQUIDATION_PENALTY_RATE_() external view returns (uint256);
    
    // checking functions
    function checkOnlySupervisorOrOwner() external view;
    function checkNotClosed() external view;
    function checkNotPaused() external view;
    function depositAllowed() external view;
    function tradeAllowed() external view;
    function buyingAllowed() external view;
    function sellingAllowed() external view;
    function gasPriceLimit() external view;

    // setting functions
    function setOracle(address newOracle) external;
    function setSupervisor(address newSupervisor) external;
    function setMaintainer(address newMaintainer) external;
    function setLiquidityProviderFeeRate(uint256 newLiquidityPorviderFeeRate) external;
    function setMaintainerFeeRate(uint256 newMaintainerFeeRate) external;
    function setK(uint256 newK) external;
    function setGasPriceLimit(uint256 newGasPriceLimit) external;
    function enablePaused() external;
    function disablePaused() external;
    function enableClosed() external;
    function disableClosed() external;
    function disableDeposit() external;
    function enableDeposit() external;
    function disableBuying() external;
    function enableBuying() external;
    function disableSelling() external;
    function enableSelling() external;
    function disableTrading() external;
    function enableTrading() external;
    function setInitialMarginRate(uint256 newInitialMarginRate) external;
    function setMaintenanceMarginRate(uint256 newMaintenanceMarginRate) external;
    function setPoolOpenTH(uint256 newPoolOpenTH) external;
    function setPoolLiquidateTH(uint256 newPoolLiquidateTH) external;
    function setLiquidationPenaltyRate(uint256 newLiquidationPenaltyRate) external;
    function getOraclePrice() external view returns (uint256);
}
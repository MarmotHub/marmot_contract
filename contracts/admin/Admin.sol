/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {Storage} from "./Storage.sol";
import {IOracle} from "../interface/IOracle.sol";


/**
 * @title admin
 * @author Marmot Finance
 *
 * @notice Functions for admin operations
 */
contract Admin is Storage {
    // ============ Events ============
    event CreateAdmin();

    event UpdateGasPriceLimit(uint256 oldGasPriceLimit, uint256 newGasPriceLimit);

    event UpdateLiquidityProviderFeeRate(
        uint256 oldLiquidityProviderFeeRate,
        uint256 newLiquidityProviderFeeRate
    );

    event UpdateMaintainerFeeRate(uint256 oldMaintainerFeeRate, uint256 newMaintainerFeeRate);

    event UpdateK(uint256 oldK, uint256 newK);


    // ============ Params Setting Functions ============
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
    ) external {
        require(!_INITIALIZED_, "ADMIN_INITIALIZED");
        _INITIALIZED_ = true;
        require(owner != address(0), "INVALID_OWNER");
        _OWNER_ = owner;
        require(supervisor != address(0), "INVALID_SUPERVISOR");
        _SUPERVISOR_ = supervisor;
        _MAINTAINER_ = maintainer;
        _COLLATERAL_TOKEN_ = collateralToken;
        _ORACLE_ = oracle;

        _DEPOSIT_ALLOWED_ = false;
        _GAS_PRICE_LIMIT_ = gasPriceLimit;

        // Advanced controls are disabled by default
        _BUYING_ALLOWED_ = true;
        _SELLING_ALLOWED_ = true;

        _LP_FEE_RATE_ = lpFeeRate;
        _MT_FEE_RATE_ = mtFeeRate;
        _K_ = k;


        checkParaParameters();
        emit CreateAdmin();
    }


    function setOracle(address newOracle) external onlyOwner {
        _ORACLE_ = newOracle;
    }

    function setSupervisor(address newSupervisor) external onlyOwner {
        require(newSupervisor != address(0), "INVALID_SUPERVISOR");
        _SUPERVISOR_ = newSupervisor;
    }

    function setMaintainer(address newMaintainer) external onlyOwner {
        require(newMaintainer != address(0), "INVALID_MAINTAINER");
        _MAINTAINER_ = newMaintainer;
    }

    function setLiquidityProviderFeeRate(uint256 newLiquidityPorviderFeeRate) external onlyOwner {
        emit UpdateLiquidityProviderFeeRate(_LP_FEE_RATE_, newLiquidityPorviderFeeRate);
        _LP_FEE_RATE_ = newLiquidityPorviderFeeRate;
        checkParaParameters();
    }

    function setMaintainerFeeRate(uint256 newMaintainerFeeRate) external onlyOwner {
        emit UpdateMaintainerFeeRate(_MT_FEE_RATE_, newMaintainerFeeRate);
        _MT_FEE_RATE_ = newMaintainerFeeRate;
        checkParaParameters();
    }

    function setK(uint256 newK) external onlyOwner {
        emit UpdateK(_K_, newK);
        _K_ = newK;
        checkParaParameters();
    }

    function setGasPriceLimit(uint256 newGasPriceLimit) external {
        checkOnlySupervisorOrOwner();
        emit UpdateGasPriceLimit(_GAS_PRICE_LIMIT_, newGasPriceLimit);
        _GAS_PRICE_LIMIT_ = newGasPriceLimit;
    }

    // ============ System Control Functions ============
    function enablePaused() external {
        checkOnlySupervisorOrOwner();
        _PAUSED_ = true;
    }

    function disablePaused() external {
        checkOnlySupervisorOrOwner();
        _PAUSED_ = false;
    }

    function enableClosed() external {
        checkOnlySupervisorOrOwner();
        _CLOSED_ = true;
    }

    function disableClosed() external {
        checkOnlySupervisorOrOwner();
        _CLOSED_ = false;
    }

    function disableDeposit() external {
        checkOnlySupervisorOrOwner();
        _DEPOSIT_ALLOWED_ = false;
    }

    function enableDeposit() external onlyOwner {
        checkNotClosed();
        _DEPOSIT_ALLOWED_ = true;
    }

    function disableBuying() external {
        checkOnlySupervisorOrOwner();
        _BUYING_ALLOWED_ = false;
    }

    function enableBuying() external onlyOwner {
        checkNotClosed();
        _BUYING_ALLOWED_ = true;
    }

    function disableSelling() external {
        checkOnlySupervisorOrOwner();
        _SELLING_ALLOWED_ = false;
    }

    function enableSelling() external onlyOwner {
        checkNotClosed();
        _SELLING_ALLOWED_ = true;
    }

    function enableTrading() external onlyOwner {
        checkNotClosed();
        _BUYING_ALLOWED_ = true;
        _SELLING_ALLOWED_ = true;
    }

    function disableTrading() external {
        checkOnlySupervisorOrOwner();
        _BUYING_ALLOWED_ = false;
        _SELLING_ALLOWED_ = false;
    }

    function setInitialMarginRate(uint256 newInitialMarginRate) external onlyOwner {
        checkNotClosed();
        _INITIAL_MARGIN_RATE_ = newInitialMarginRate;
    }

    function setMaintenanceMarginRate(uint256 newMaintenanceMarginRate) external onlyOwner {
        checkNotClosed();
        _MAINTENANCE_MARGIN_RATE_ = newMaintenanceMarginRate;
    }

    function setPoolOpenTH(uint256 newPoolOpenTH) external onlyOwner {
        checkNotClosed();
        _POOL_OPEN_TH_ = newPoolOpenTH;
    }

    function setPoolLiquidateTH(uint256 newPoolLiquidateTH) external onlyOwner {
        checkNotClosed();
        _POOL_LIQUIDATE_TH_ = newPoolLiquidateTH;
    }

    function setLiquidationPenaltyRate(uint256 newLiquidationPenaltyRate) external onlyOwner {
        checkNotClosed();
        _LIQUIDATION_PENALTY_RATE_ = newLiquidationPenaltyRate;
    }

    function setLiquidationPenaltyPoolRate(uint256 newLiquidationPenaltyPoolRate) external onlyOwner {
        checkNotClosed();
        _LIQUIDATION_PENALTY_POOL_RATE_ = newLiquidationPenaltyPoolRate;
    }


    function setTwapInterval(uint256 newTwapInterval) external onlyOwner {
        _TWAP_INTERVAL_ = newTwapInterval;
    }

    function setPremiumLimit(uint256 newPremiumLimit) external onlyOwner {
        _PREMIUM_LIMIT_ = newPremiumLimit;
    }

    // ============ Helper function ============
    function getOraclePrice() external view returns (uint256) {
        return IOracle(_ORACLE_).getPrice();
    }

}


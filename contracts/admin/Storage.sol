/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {ReentrancyGuard} from "../lib/ReentrancyGuard.sol";
import {SafeMath} from "../lib/SafeMath.sol";
import {SignedSafeMath} from "../lib/SignedSafeMath.sol";
import {DecimalMath} from "../lib/DecimalMath.sol";
import {ILpToken} from "../interface/ILpToken.sol";
import {Types} from "../lib/Types.sol";

/**
 * @title Storage
 * @author Marmot Finance
 *
 * @notice Local Variables
 */
contract Storage is InitializableOwnable, ReentrancyGuard {
    using SafeMath for uint256;
    using SignedSafeMath for int256;

    // ============ Variables for Control ============

    bool internal _INITIALIZED_;
    // 暂停
    bool public _PAUSED_;
    bool public _CLOSED_;
    bool public _DEPOSIT_ALLOWED_;
    uint256 public _GAS_PRICE_LIMIT_;

    // ============ Advanced Controls ============
    // BUYING BASE TOKEN ALLOWED
    bool public _BUYING_ALLOWED_;
    // SELLING BASE TOKEN ALLOWED
    bool public _SELLING_ALLOWED_;

    // ============ Core Address ============
    address public _SUPERVISOR_; // could freeze system in emergency
    address public _MAINTAINER_; // collect maintainer fee

    // 保证金币种
    address public _COLLATERAL_TOKEN_;
    address public _ORACLE_;

    // ============ Variables for AMM Algorithm ============
    // 交易手续费
    uint256 public _LP_FEE_RATE_;
    // 管理费
    uint256 public _MT_FEE_RATE_;
    uint256 public _K_;
    // Variable for Margin Trading Governance
    uint256 public _INITIAL_MARGIN_RATE_;
    uint256 public _MAINTENANCE_MARGIN_RATE_;
    // POOL ENP<50% 无法开新仓
    uint256 public _POOL_OPEN_TH_;
    // POOL ENP<20% 触发强平
    uint256 public _POOL_LIQUIDATE_TH_;
    // reward to liquidators when trader got liquidated
    uint256 public _LIQUIDATION_PENALTY_RATE_;
    // reward to pool when trader got liquidated
    uint256 public _LIQUIDATION_PENALTY_POOL_RATE_;
    // interval to store mid-price and oracle price to save gas
    uint256 public _TWAP_INTERVAL_ = 60;


    // ============ Modifiers ============

    function checkOnlySupervisorOrOwner() public view {
        require(
            msg.sender == _SUPERVISOR_ || msg.sender == _OWNER_,
            "NOT_SUPERVISOR_OR_OWNER"
        );
    }

    function checkNotClosed() public view {
        require(!_CLOSED_, "PARA_CLOSED");
    }

    function checkNotPaused() public view {
        require(!_PAUSED_, "PARA_PAUSED");
    }

    function depositAllowed() public view {
        require(_DEPOSIT_ALLOWED_, "DEPOSIT_NOT_ALLOWED");
    }

    function tradeAllowed() public view {
        require(_BUYING_ALLOWED_ && _SELLING_ALLOWED_, "TRADE_NOT_ALLOWED");
    }

    function buyingAllowed() public view {
        require(_BUYING_ALLOWED_, "BUYING_NOT_ALLOWED");
    }

    function sellingAllowed() public view {
        require(_SELLING_ALLOWED_, "SELLING_NOT_ALLOWED");
    }

    function gasPriceLimit() public view {
        require(tx.gasprice <= _GAS_PRICE_LIMIT_, "GAS_PRICE_EXCEED");
    }

    // ============ Helper Functions ============
    function checkParaParameters() public view {
        require(_K_ < DecimalMath.ONE, "K>=1");
        require(_K_ > 0, "K=0");
        require(
            _LP_FEE_RATE_.add(_MT_FEE_RATE_) < DecimalMath.ONE,
            "FEE_RATE>=1"
        );
    }


    // ============ Version Control ============
    function version() external pure returns (uint256) {
        return 101; // 1.0.1
    }
}

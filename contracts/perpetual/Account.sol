/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeMath} from "../lib/SafeMath.sol";
import {SignedSafeMath} from "../lib/SignedSafeMath.sol";
import {InitializableOwnable} from "../lib/InitializableOwnable.sol";
import {ReentrancyGuard} from "../lib/ReentrancyGuard.sol";
import {Types} from "../lib/Types.sol";
import {Admin} from "../admin/Admin.sol";
import {Pricing} from "./Pricing.sol";

/**
 * @title Storage
 * @author Marmot Finance
 *
 * @notice Local Variables
 */
contract Account is InitializableOwnable, ReentrancyGuard {
    using SafeMath for uint256;
    using SignedSafeMath for int256;
    // ============ Variables for Control ============
    bool internal _INITIALIZED_;
    Admin public ADMIN;
    Pricing public PRICING;
    address public _COLLATERAL_POOL_TOKEN_;
//    Types.MarginAccount public _MARGIN_ACCOUNT_[address(this)];
    mapping(address => Types.MarginAccount) public _MARGIN_ACCOUNT_;
    uint256 public _TARGET_BASE_TOKEN_AMOUNT_;
    uint256 public _TARGET_QUOTE_TOKEN_AMOUNT_;
    uint256 public _BASE_BALANCE_;
    uint256 public _QUOTE_BALANCE_;
    Types.Side public _R_STATUS_ = Types.Side.FLAT;

    uint256 public _TOTAL_LONG_SIZE_;
    uint256[3] public _SLOSS_PER_CONTRACT_;
    uint256 public _POOL_INSURANCE_BALANCE_;

    function getSloss() public view returns (uint256[3] memory) {
        return _SLOSS_PER_CONTRACT_;
    }

    function getTotalSize() public view returns (uint256) {
        uint256 totalSize = _MARGIN_ACCOUNT_[address(this)].SIDE == Types.Side.LONG?
            _TOTAL_LONG_SIZE_.add(_MARGIN_ACCOUNT_[address(this)].SIZE): _TOTAL_LONG_SIZE_;
        return totalSize;
    }

    function getPoolMarginSide() external view returns (Types.Side) {
        return _MARGIN_ACCOUNT_[address(this)].SIDE;
    }

    function getPoolMarginCashBalance() external view returns (int256) {
        return _MARGIN_ACCOUNT_[address(this)].CASH_BALANCE;
    }

    function getPoolMarginSize() external view returns (uint256) {
        return _MARGIN_ACCOUNT_[address(this)].SIZE;
    }

    function getPoolMarginEntryValue() external view returns (uint256) {
        return _MARGIN_ACCOUNT_[address(this)].ENTRY_VALUE;
    }

    function getPoolMarginEntrySloss() external view returns (uint256) {
        return _MARGIN_ACCOUNT_[address(this)].ENTRY_SLOSS;
    }

    function updateVirtualBalance (
        uint256 baseTarget,
        uint256 baseBalance,
        uint256 quoteTarget,
        uint256 quoteBalance,
        Types.Side newSide
        ) internal {
        if (_TARGET_QUOTE_TOKEN_AMOUNT_ != quoteTarget) {
            _TARGET_QUOTE_TOKEN_AMOUNT_ = quoteTarget;
        }
        if (_TARGET_BASE_TOKEN_AMOUNT_ != baseTarget) {
            _TARGET_BASE_TOKEN_AMOUNT_ = baseTarget;
        }
        if (_BASE_BALANCE_ != baseBalance) {
            _BASE_BALANCE_ = baseBalance;
        }
        if (_QUOTE_BALANCE_ != quoteBalance) {
            _QUOTE_BALANCE_ = quoteBalance;
        }
        if (_R_STATUS_ != newSide) {
            _R_STATUS_ = newSide;
        }
    }
}

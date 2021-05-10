/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeMath} from "../lib/SafeMath.sol";
import {SignedSafeMath} from "../lib/SignedSafeMath.sol";
import {SafeERC20} from "../lib/SafeERC20.sol";
import {DecimalMath} from "../lib/DecimalMath.sol";
import {Types} from "../lib/Types.sol";
import {ILpToken} from "../interface/ILpToken.sol";
import {IERC20} from "../interface/IERC20.sol";
import {IAdmin} from "../interface/IAdmin.sol";
import {Margin} from "./Margin.sol";


/**
 * @title Settlement
 * @author Marmot Finance
 *
 * @notice Functions for assets settlement
 */
contract Settlement is Margin {
    using SafeMath for uint256;
    using SignedSafeMath for int256;
    using SafeERC20 for IERC20;

    // ============ Events ============

    event Donate(uint256 amount);

    event ClaimAssets(address indexed user, uint256 baseTokenAmount, uint256 quoteTokenAmount);

    // ============ Assets IN/OUT Functions ============

    // ============ Donate to Liquidity Pool Functions ============


    // ============ Assets IN/OUT Functions ============
    /*
     * @dev Trader transfer in Margin Account
     * @param to trader address
     * @param amount collateral amount
     */
    function _collateralTraderTransferIn(address from, uint256 amount)
        internal
    {
        IERC20(ADMIN._COLLATERAL_TOKEN_()).safeTransferFrom(
            from,
            address(this),
            amount
        );
        _MARGIN_ACCOUNT_[from].CASH_BALANCE = _MARGIN_ACCOUNT_[from]
            .CASH_BALANCE
            .add(amount.toint256());
    }



    /*
     * @dev Trader withdraw from Margin Account
     * @param to trader address
     * @param amount collateral amount
     */
    function _collateralTraderTransferOut(address to, uint256 amount) internal {
        Types.MarginAccount memory traderAccount = _MARGIN_ACCOUNT_[msg.sender];
        require(availableMargin(traderAccount, ADMIN.getOraclePrice())>=amount.toint256(), "INSUFFICIENT_FUND_TO_WITHDRAW");

        _MARGIN_ACCOUNT_[to].CASH_BALANCE = _MARGIN_ACCOUNT_[to]
            .CASH_BALANCE
            .sub(amount.toint256());
        IERC20(ADMIN._COLLATERAL_TOKEN_()).safeTransfer(to, amount);
    }


    function collateralTraderTransferIn(address from, uint256 amount) external {
        ADMIN.checkNotClosed();
        ADMIN.checkNotPaused();
        ADMIN.depositAllowed();
        _collateralTraderTransferIn(from, amount);
    }

    function collateralTraderTransferOut(address to, uint256 amount) external {
        ADMIN.checkNotClosed();
        ADMIN.checkNotPaused();
        _collateralTraderTransferOut(to, amount);
    }


    // ============ Donate to Liquidity Pool Functions ============
    function _donateCollateralToken(uint256 amount) internal {
        _MARGIN_ACCOUNT_[address(this)].CASH_BALANCE = _MARGIN_ACCOUNT_[address(this)]
            .CASH_BALANCE
            .add(amount.toint256());
        emit Donate(amount);
    }
    // ============ Final Settlement Functions ============
}

/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeMath} from "../lib/SafeMath.sol";
import {SignedSafeMath} from "../lib/SignedSafeMath.sol";
import {DecimalMath} from "../lib/DecimalMath.sol";
import {Types} from "../lib/Types.sol";
import {ILpToken} from "../interface/ILpToken.sol";
import {Margin} from "./Margin.sol";

/**
 * @title LiquidityProvider
 * @author Marmot Finance
 *
 * @notice Functions for liquidity provider operations
 */
contract LiquidityProvider is Margin {
    using SafeMath for uint256;
    using SignedSafeMath for int256;


    // ============ Events ============

    event LpDeposit(
        address indexed payer,
        address indexed receiver,
        uint256 amount,
        uint256 lpTokenAmount
    );

    event LpWithdraw(
        address indexed payer,
        address indexed receiver,
        uint256 amount,
        uint256 lpTokenAmount
    );


    // ============ Routine Functions ============

    /*
     * @dev deposit to LP
     * @param amount amount of collateral token
     */
    function depositCollateral(uint256 amount) external {
        _depositCollateralTo(msg.sender, amount);
    }

    /*
     * @dev withdraw msg.sender's share to account balance given amount of LP token
     * @param amount amount of LP token.
     */
    function withdrawCollateral(uint256 amount) external {
        _withdrawCollateralTo(msg.sender, amount);
    }

    /*
     * @dev withdraw msg.sender's all share to account balance
     * @param amount amount of LP token.
     */
    function withdrawAllCollateral() external {
        _withdrawAllCollateralTo(msg.sender);
    }


    // ============ Deposit Functions ============
    /*
     * @dev Calculate LP share given Collateral amount
     * @param to LP address.
     * @param amount amount of collateral token.
     */
    function _depositCollateralTo(address to, uint256 amount)
        internal
        preventReentrant
    {
        ADMIN.checkNotClosed();
        ADMIN.checkNotPaused();
        ADMIN.depositAllowed();
        Types.MarginAccount memory lpAccount = _MARGIN_ACCOUNT_[to];
        require(balanceMargin(lpAccount)>=amount.toint256(), "INSUFFICIENT_FUND");

        uint256 totalCapital = getTotalCollateralPoolToken();
        uint256 capital;
        if (totalCapital == 0) {
            // give remaining quote token to lp as a gift
            capital = amount;
        }
        else {
            int256 collateralBalance;
            if (_MARGIN_ACCOUNT_[address(this)].SIDE == Types.Side.FLAT) {
                collateralBalance = _MARGIN_ACCOUNT_[address(this)].CASH_BALANCE;
            }
            else {
                collateralBalance = _MARGIN_ACCOUNT_[address(this)].CASH_BALANCE.add(
                    PRICING.queryPNLMarkPrice(
                        Types.oppositeSide(_MARGIN_ACCOUNT_[address(this)].SIDE),
                        _MARGIN_ACCOUNT_[address(this)].SIZE,
                        _MARGIN_ACCOUNT_[address(this)].ENTRY_VALUE,
                        _MARGIN_ACCOUNT_[address(this)].SIZE,
                        _MARGIN_ACCOUNT_[address(this)].ENTRY_SLOSS
                    )
                );
            }
            capital = DecimalMath.mul(DecimalMath.divCeil(amount, collateralBalance.touint256()), totalCapital);
        }

        // settlement
        (uint256 baseTarget, uint256 baseBalance, uint256 quoteTarget, uint256 quoteBalance, Types.Side newSide) = PRICING.getExpectedTargetExt(
            _MARGIN_ACCOUNT_[address(this)].SIDE,
            _QUOTE_BALANCE_.add(amount),
            ADMIN.getOraclePrice(),
            _MARGIN_ACCOUNT_[address(this)].SIZE,
            ADMIN._K_()
        );

        updateVirtualBalance(baseTarget, baseBalance, quoteTarget, quoteBalance, newSide);
        _marginTransferToPool(to, amount);
        _mintCollateralPoolToken(to, capital);

        emit LpDeposit(msg.sender, to, amount, capital);
    }
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      
    // ============ Withdraw Functions ============
    /*
     * @dev Calculate LP share given LP token amount
     * @param to LP address.
     * @param amount amount of LP token.
     */
    function _withdrawCollateralTo(address to, uint256 lpAmount)
        internal
        preventReentrant
    {
        ADMIN.checkNotClosed();
        ADMIN.checkNotPaused();
        // calculate capital
        uint256 totalCapital = getTotalCollateralPoolToken();
        require(totalCapital > 0, "NO_LP");
        Types.MarginAccount memory poolAccount = _MARGIN_ACCOUNT_[address(this)];
        uint256 cashAmount = DecimalMath.mul(DecimalMath.divCeil(lpAmount, totalCapital), poolAccount.CASH_BALANCE.touint256());
        _marginTransferFromPool(to, cashAmount);
        uint256 sizeAmount;
        uint256 valueAmount;
        uint256 r = DecimalMath.divCeil(lpAmount, totalCapital);
        if (poolAccount.SIDE != Types.Side.FLAT) {
            sizeAmount = DecimalMath.mul(r, poolAccount.SIZE);
            valueAmount = DecimalMath.mul(r, poolAccount.ENTRY_VALUE);
            Types.MarginAccount memory lpAccount = _MARGIN_ACCOUNT_[to];
            lpAccount = trade(lpAccount, poolAccount.SIDE, valueAmount, sizeAmount, false);
            poolAccount = trade(poolAccount, Types.oppositeSide(poolAccount.SIDE), valueAmount, sizeAmount, true);
            _MARGIN_ACCOUNT_[to] = lpAccount;
            _MARGIN_ACCOUNT_[address(this)] = poolAccount;

        }

        (uint256 baseTarget, uint256 baseBalance, uint256 quoteTarget, uint256 quoteBalance, Types.Side newSide) = PRICING.getExpectedTarget();
        baseBalance = DecimalMath.mul(baseBalance,DecimalMath.ONE.sub(r));
        baseTarget = DecimalMath.mul(baseTarget,DecimalMath.ONE.sub(r));
        quoteBalance = DecimalMath.mul(quoteBalance,DecimalMath.ONE.sub(r));
        quoteTarget = DecimalMath.mul(quoteTarget,DecimalMath.ONE.sub(r));
        updateVirtualBalance(baseTarget, baseBalance, quoteTarget, quoteBalance, newSide);

        PRICING._canPoolKeep();
        // settlement
        _burnCollateralPoolToken(to, lpAmount);
        emit LpWithdraw(msg.sender, to, cashAmount, lpAmount);
    }

    // ============ Withdraw all Functions ============

    function _withdrawAllCollateralTo(address to)
        internal
    {
        uint256 totalCapital = getTotalCollateralPoolToken();
        require(totalCapital > 0, "withdrawCollateralTo: NO_LP");
        uint256 lpAmount = getCollateralPoolTokenBalanceOf(to);
        _withdrawCollateralTo(to, lpAmount);
    }


    function getCollateralPoolTokenBalanceOf(address lp)
        public
        view
        returns (uint256)
    {
        return ILpToken(_COLLATERAL_POOL_TOKEN_).balanceOf(lp);
    }

    function getTotalCollateralPoolToken() public view returns (uint256) {
        return ILpToken(_COLLATERAL_POOL_TOKEN_).totalSupply();
    }

    function _mintCollateralPoolToken(address user, uint256 amount) internal {
        ILpToken(_COLLATERAL_POOL_TOKEN_).mint(user, amount);
    }

    function _burnCollateralPoolToken(address user, uint256 amount) internal {
        ILpToken(_COLLATERAL_POOL_TOKEN_).burn(user, amount);
    }
}

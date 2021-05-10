/*

    Copyright 2021 Marmot Finance.
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeMath} from "../lib/SafeMath.sol";
import {DecimalMath} from "../lib/DecimalMath.sol";
import {ParaMath} from "../lib/ParaMath.sol";
import {Types} from "../lib/Types.sol";


/**
 * @title Pricing
 * @author Marmot Finance
 * @notice Parapara Pricing model
 */
library PMMCurve {
    using SafeMath for uint256;


    // ============ R = 1 cases ============
    // 卖ETH, 得USD
    // Solving the quadratic equation for trading 求解Q2
    function _ROneSellBaseToken(uint256 price, uint256 k, uint256 amount, uint256 targetQuoteTokenAmount)
        internal
        pure
        returns (uint256 receiveQuoteToken)
    {
        uint256 Q2 =
            ParaMath._SolveQuadraticFunctionForTrade(
                targetQuoteTokenAmount,
                targetQuoteTokenAmount,
                DecimalMath.mul(price, amount),
                false,
                k
            );
        // in theory Q2 <= targetQuoteTokenAmount
        // however when amount is close to 0, precision problems may cause Q2 > targetQuoteTokenAmount
        return targetQuoteTokenAmount.sub(Q2);
    }

    function _ROneBuyBaseToken(uint256 price, uint256 k, uint256 amount, uint256 targetBaseTokenAmount)
        internal
        pure
        returns (uint256 payQuoteToken)
    {
        require(amount < targetBaseTokenAmount, "PARA_BASE_BALANCE_NOT_ENOUGH");
        uint256 B2 = targetBaseTokenAmount.sub(amount);
        payQuoteToken = _RAboveIntegrate(
            price,
            k,
            targetBaseTokenAmount,
            targetBaseTokenAmount,
            B2
        );
        return payQuoteToken;
    }

    // ============ R < 1 cases ============

    function _RBelowSellBaseToken(
        uint256 price,
        uint256 k,
        uint256 amount,
        uint256 quoteBalance,
        uint256 targetQuoteAmount
    ) internal pure returns (uint256 receieQuoteToken) {
        uint256 Q2 =
            ParaMath._SolveQuadraticFunctionForTrade(
                targetQuoteAmount,
                quoteBalance,
                DecimalMath.mul(price, amount),
                false,
                k
            );
        return quoteBalance.sub(Q2);
    }

    function _RBelowBuyBaseToken(
        uint256 price,
        uint256 k,
        uint256 amount,
        uint256 quoteBalance,
        uint256 targetQuoteAmount
    ) internal pure returns (uint256 payQuoteToken) {
        // Here we don't require amount less than some value
        // Because it is limited at upper function
        // See Trader.queryBuyBaseToken
        uint256 Q2 =
            ParaMath._SolveQuadraticFunctionForTrade(
                targetQuoteAmount,
                quoteBalance,
                DecimalMath.mulCeil(price, amount),
                true,
                k
            );
        return Q2.sub(quoteBalance);
    }

    // ============ R > 1 cases ============

    function _RAboveBuyBaseToken(
        uint256 price,
        uint256 k,
        uint256 amount,
        uint256 baseBalance,
        uint256 targetBaseAmount
    ) internal pure returns (uint256 payQuoteToken) {
        require(amount < baseBalance, "PARA_BASE_BALANCE_NOT_ENOUGH");
        uint256 B2 = baseBalance.sub(amount);
        return _RAboveIntegrate(
            price, k, targetBaseAmount, baseBalance, B2
        );
    }

    function _RAboveSellBaseToken(
        uint256 price,
        uint256 k,
        uint256 amount,
        uint256 baseBalance,
        uint256 targetBaseAmount
    ) internal pure returns (uint256 receiveQuoteToken) {
        // here we don't require B1 <= targetBaseAmount
        // Because it is limited at upper function
        // See Trader.querySellBaseToken
        uint256 B1 = baseBalance.add(amount);
        return _RAboveIntegrate(price, k, targetBaseAmount, B1, baseBalance);
    }

    /*
        Update BaseTarget when AMM holds short position
        given oracle price
        B0 == Q0 / price
    */
    function _RegressionTargetWhenShort(
        uint256 Q1,
        uint256 price,
        uint256 deltaB,
        uint256 k
    )
        internal pure returns (uint256 B0,  uint256 Q0)
    {
        uint256 denominator = DecimalMath.mul(DecimalMath.ONE.mul(2), DecimalMath.ONE.add(k.sqrt()));
        uint256 edgePrice = DecimalMath.divCeil(Q1, denominator);
        require(k < edgePrice, "Unable to long under current pool status!");
        uint256 ideltaB = DecimalMath.mul(deltaB, price);
        uint256 ac = ideltaB.mul(4).mul(Q1.sub(ideltaB).add(DecimalMath.mul(ideltaB,k)));
        uint256 square = (Q1.mul(Q1)).sub(ac);
        uint256 sqrt = square.sqrt();
        B0 = DecimalMath.divCeil(Q1.add(sqrt), price.mul(2));
        Q0 = DecimalMath.mul(B0, price);
    }

    /*
        Update BaseTarget when AMM holds long position
        given oracle price
        B0 == Q0 / price
    */
    function _RegressionTargetWhenLong(
        uint256 Q1,
        uint256 price,
        uint256 deltaB,
        uint256 k
    )
       internal pure returns (uint256 B0, uint256 Q0)
    {
        uint256 square = Q1.mul(Q1).add(DecimalMath.mul(deltaB, price).mul(DecimalMath.mul(Q1, k).mul(4)));
        uint256 sqrt = square.sqrt();
        uint256 deltaQ = DecimalMath.divCeil(sqrt.sub(Q1), k.mul(2));
        Q0 = Q1.add(deltaQ);
        B0 = DecimalMath.divCeil(Q0, price);
    }

    function _RAboveIntegrate(
        uint256 price,
        uint256 k,
        uint256 B0,
        uint256 B1,
        uint256 B2
    ) internal pure returns (uint256) {
        return ParaMath._GeneralIntegrate(B0, B1, B2, price, k);
    }


}

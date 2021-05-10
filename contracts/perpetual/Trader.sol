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
import {Margin} from "./Margin.sol";
import {IERC20} from "../interface/IERC20.sol";
import {SafeERC20} from "../lib/SafeERC20.sol";
import {IAdmin} from "../interface/IAdmin.sol";

/**
 * @title Trader
 * @author Marmot Finance
 *
 * @notice Functions for trader operations
 */
contract Trader is Margin {
    using SafeMath for uint256;
    using SignedSafeMath for int256;
    using SafeERC20 for IERC20;

    // ============ Events ============

    event SellBaseToken(
        address indexed seller,
        uint256 payBase,
        uint256 receiveQuote
    );

    event BuyBaseToken(
        address indexed buyer,
        uint256 receiveBase,
        uint256 payQuote
    );

    event ChargeMaintainerFee(
        address indexed maintainer,
        bool isBaseToken,
        uint256 amount
    );

    // ============ Modifiers ============



    // ============ Trade Functions ============
    function sellBaseToken(
        uint256 amount,
        uint256 minReceiveQuote
    )
        external
        preventReentrant
        returns (uint256)
    {
        // query price
        require(amount > 0, "open: invalid amount");
        ADMIN.sellingAllowed();
        ADMIN.gasPriceLimit();
        PRICING._canPoolOpen();
        Types.MarginAccount memory traderAccount = _MARGIN_ACCOUNT_[msg.sender];
        Types.MarginAccount memory poolAccount = _MARGIN_ACCOUNT_[address(this)];
        Types.VirtualBalance memory updateBalance;
        uint256 receiveQuote;
        uint256 lpFeeQuote;
        uint256 mtFeeQuote;
        (
            receiveQuote,
            lpFeeQuote,
            mtFeeQuote,
            updateBalance.baseTarget,
            updateBalance.baseBalance,
            updateBalance.quoteTarget,
            updateBalance.quoteBalance,
            updateBalance.newSide
        ) = PRICING._querySellBaseToken(amount);
        require(receiveQuote >= minReceiveQuote, "SELL_BASE_RECEIVE_NOT_ENOUGH");

        if (traderAccount.SIDE == Types.Side.LONG && traderAccount.SIZE < amount) {
            // close current position
            uint256 closeAmount = traderAccount.SIZE;
            (uint256 receiveQuote_, , , , , , , ) = PRICING._querySellBaseToken(closeAmount);
            traderAccount = trade(traderAccount, Types.Side.SHORT, receiveQuote_, closeAmount, false);
            poolAccount = trade(poolAccount, Types.Side.LONG, receiveQuote_, closeAmount, true);
            uint256 deltaQuote = receiveQuote.sub(receiveQuote_);
            uint256 deltaAmount = amount.sub(closeAmount);
            traderAccount = trade(traderAccount, Types.Side.SHORT, deltaQuote, deltaAmount, false);
            poolAccount = trade(poolAccount, Types.Side.LONG, deltaQuote, deltaAmount, true);

        }
        else {
            traderAccount = trade(traderAccount, Types.Side.SHORT, receiveQuote, amount, false);
            poolAccount = trade(poolAccount, Types.Side.LONG, receiveQuote, amount, true);
        }

        if (lpFeeQuote > 0) {
            traderAccount.CASH_BALANCE = traderAccount.CASH_BALANCE.sub(lpFeeQuote.toint256());
            poolAccount.CASH_BALANCE = poolAccount.CASH_BALANCE.add(lpFeeQuote.toint256());
        }

        if (mtFeeQuote > 0) {
            traderAccount.CASH_BALANCE = traderAccount.CASH_BALANCE.sub(mtFeeQuote.toint256());
            _MARGIN_ACCOUNT_[ADMIN._MAINTAINER_()].CASH_BALANCE = _MARGIN_ACCOUNT_[ADMIN._MAINTAINER_()].CASH_BALANCE.add(mtFeeQuote.toint256());
        }

        // update storage
        _MARGIN_ACCOUNT_[msg.sender] = traderAccount;
        _MARGIN_ACCOUNT_[address(this)] = poolAccount;
        updateVirtualBalance(
            updateBalance.baseTarget,
            updateBalance.baseBalance,
            updateBalance.quoteTarget,
            updateBalance.quoteBalance,
            updateBalance.newSide);
        PRICING._canPoolOpen();
        PRICING.addReserveSnapshot();
        emit SellBaseToken(msg.sender, amount, receiveQuote);

        return receiveQuote;
    }

    function buyBaseToken(
        uint256 amount,
        uint256 maxPayQuote
    )
        external
        preventReentrant
        returns (uint256)
    {
        ADMIN.buyingAllowed();
        ADMIN.gasPriceLimit();
        PRICING._canPoolOpen();
        // query price
        Types.MarginAccount memory traderAccount = _MARGIN_ACCOUNT_[msg.sender];
        Types.MarginAccount memory poolAccount = _MARGIN_ACCOUNT_[address(this)];
        Types.VirtualBalance memory updateBalance;
        uint256 payQuote;
        uint256 lpFeeQuote;
        uint256 mtFeeQuote;
        (
            payQuote,
            lpFeeQuote,
            mtFeeQuote,
            updateBalance.baseTarget,
            updateBalance.baseBalance,
            updateBalance.quoteTarget,
            updateBalance.quoteBalance,
            updateBalance.newSide
        ) = PRICING._queryBuyBaseToken(amount);
        require(payQuote.add(lpFeeQuote).add(mtFeeQuote) <= maxPayQuote, "BUY_BASE_COST_TOO_MUCH");

        // settle asset
        if (traderAccount.SIDE == Types.Side.SHORT && traderAccount.SIZE < amount) {
            // close current position
            uint256 closeAmount = traderAccount.SIZE;
            (uint256 payQuote_, , , , , , , ) = PRICING._queryBuyBaseToken(closeAmount);
            traderAccount = trade(traderAccount, Types.Side.LONG, payQuote_, closeAmount, false);
            poolAccount = trade(poolAccount, Types.Side.SHORT, payQuote_, closeAmount, true);
            uint256 deltaQuote = payQuote.sub(payQuote_);
            uint256 deltaAmount = amount.sub(closeAmount);
            traderAccount = trade(traderAccount, Types.Side.LONG, deltaQuote, deltaAmount, false);
            poolAccount = trade(poolAccount, Types.Side.SHORT, deltaQuote, deltaAmount, true);
        }
        else {
            traderAccount = trade(traderAccount, Types.Side.LONG, payQuote, amount, false);
            poolAccount = trade(poolAccount, Types.Side.SHORT, payQuote, amount, true);
        }

        if (lpFeeQuote > 0) {
            traderAccount.CASH_BALANCE = traderAccount.CASH_BALANCE.sub(lpFeeQuote.toint256());
            poolAccount.CASH_BALANCE = poolAccount.CASH_BALANCE.add(lpFeeQuote.toint256());
        }
        if (mtFeeQuote > 0) {
             traderAccount.CASH_BALANCE = traderAccount.CASH_BALANCE.sub(mtFeeQuote.toint256());
            _MARGIN_ACCOUNT_[ADMIN._MAINTAINER_()].CASH_BALANCE = _MARGIN_ACCOUNT_[ADMIN._MAINTAINER_()].CASH_BALANCE.add(mtFeeQuote.toint256());

        }

        // update storage
        updateVirtualBalance(updateBalance.baseTarget, updateBalance.baseBalance, updateBalance.quoteTarget, updateBalance.quoteBalance, updateBalance.newSide);
        _MARGIN_ACCOUNT_[msg.sender] = traderAccount;
        _MARGIN_ACCOUNT_[address(this)] = poolAccount;
        PRICING._canPoolOpen();
        PRICING.addReserveSnapshot();
        emit BuyBaseToken(msg.sender, amount, payQuote);
        return payQuote;
    }

}

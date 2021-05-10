/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {Types} from "./lib/Types.sol";
import {IERC20} from "./interface/IERC20.sol";
import {Trader} from "./perpetual/Trader.sol";
import {LpToken} from "./perpetual/LpToken.sol";
import {LiquidityProvider} from "./perpetual/LiquidityProvider.sol";
import {Admin} from "./admin/Admin.sol";
import {Pricing} from "./perpetual/Pricing.sol";
import {Settlement} from "./perpetual/Settlement.sol";
import "./perpetual/Settlement.sol";

/**
 * @title Para
 * @author Marmot Finance
 *
 * @notice Entrance for users
 */

contract Para is Trader, LiquidityProvider, Settlement {
    function init(
        address adminAddress,
        address pricingAddress,
        string memory tokenName
    ) external {
        require(!_INITIALIZED_, "PARA_INITIALIZED");
        _INITIALIZED_ = true;
        ADMIN = Admin(adminAddress);
        PRICING = Pricing(pricingAddress);
        _COLLATERAL_POOL_TOKEN_ = address(new LpToken(tokenName));
    }
}

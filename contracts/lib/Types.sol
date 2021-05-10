/*

    Copyright 2020 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {SafeMath} from "../lib/SafeMath.sol";
import {SignedSafeMath} from "../lib/SignedSafeMath.sol";

library Types {
    using SafeMath for uint256;
    using SignedSafeMath for int256;

    enum RStatus {ONE, ABOVE_ONE, BELOW_ONE}

    enum Side {FLAT, SHORT, LONG}

    enum Status {NORMAL, EMERGENCY, SETTLED}

    //  RStatus ABOVE_ONE 对应 POOL SHORT
    // RStatus BELOW_ONE 对应 POOL LONG

    function oppositeSide(Side side) internal pure returns (Side) {
        if (side == Side.LONG) {
            return Side.SHORT;
        } else if (side == Side.SHORT) {
            return Side.LONG;
        }
        return side;
    }

    struct MarginAccount {
        Side SIDE;
        uint256 SIZE;
        uint256 ENTRY_VALUE;
        int256 CASH_BALANCE;
        uint256 ENTRY_SLOSS;
    }

    struct VirtualBalance {
        uint256 baseTarget;
        uint256 baseBalance;
        uint256 quoteTarget;
        uint256 quoteBalance;
        Side newSide;
    }
}

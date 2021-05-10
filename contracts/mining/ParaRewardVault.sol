/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {Ownable} from "../lib/Ownable.sol";
import {SafeERC20} from "../lib/SafeERC20.sol";
import {IERC20} from "../interface/IERC20.sol";


interface IParaRewardVault {
    function reward(address to, uint256 amount) external;
}


contract ParaRewardVault is Ownable {
    using SafeERC20 for IERC20;

    address public paraToken;

    constructor(address _paraToken) public {
        paraToken = _paraToken;
    }

    function reward(address to, uint256 amount) external onlyOwner {
        IERC20(paraToken).safeTransfer(to, amount);
    }
}

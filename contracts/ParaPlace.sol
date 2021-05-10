/*

    Copyright 2021 Marmot Finance
    SPDX-License-Identifier: Apache-2.0

*/

pragma solidity 0.6.9;
pragma experimental ABIEncoderV2;

import {Ownable} from "./lib/Ownable.sol";
import {IPara} from "./interface/IPara.sol";
import {IAdmin} from "./interface/IAdmin.sol";
import {ICloneFactory} from "./helper/CloneFactory.sol";
import {Admin} from "./admin/Admin.sol";
import {Pricing} from "./perpetual/Pricing.sol";

/**
 * @title ParaPlace
 * @author Marmot Finance
 *
 * @notice Register of All paras
 */
contract ParaPlace is Ownable {
    address public _PARA_LOGIC_;
    address public _ADMIN_LOGIC_;
    address public _CLONE_FACTORY_;
    address public _PRICING_LOGIC_;

    address public _DEFAULT_SUPERVISOR_;

    mapping(address => address) internal _PARA_REGISTER_;
    address[] public _PARAS;

    // ============ Events ============

    event ParaBirth(address newBorn, address oracle);

    // ============ Constructor Function ============

    constructor(
        address _paraLogic,
        address _adminLogic,
        address _pricingLogic,
        address _cloneFactory,
        address _defaultSupervisor
    ) public {
        _PARA_LOGIC_ = _paraLogic;
        _ADMIN_LOGIC_ = _adminLogic;
        _PRICING_LOGIC_ = _pricingLogic;
        _CLONE_FACTORY_ = _cloneFactory;
        _DEFAULT_SUPERVISOR_ = _defaultSupervisor;
    }

    // ============ admin Function ============

    function setParaLogic(address _paraLogic) external onlyOwner {
        _PARA_LOGIC_ = _paraLogic;
    }

    function setAdminLogic(address _adminLogic) external onlyOwner {
        _ADMIN_LOGIC_ = _adminLogic;
    }

    function setPricingLogic(address _pricingLogic) external onlyOwner {
        _PRICING_LOGIC_ = _pricingLogic;
    }

    function setCloneFactory(address _cloneFactory) external onlyOwner {
        _CLONE_FACTORY_ = _cloneFactory;
    }

    function setDefaultSupervisor(address _defaultSupervisor)
        external
        onlyOwner
    {
        _DEFAULT_SUPERVISOR_ = _defaultSupervisor;
    }

    function removePara(address admin, address para) external onlyOwner {
        require(IPara(para).ADMIN() == admin, "ADMIN_PARA_NOT_MATCH");
        address oracle = Admin(admin)._ORACLE_();
        require(isParaRegistered(oracle), "Para_NOT_REGISTERED");
        _PARA_REGISTER_[oracle] = address(0);
        for (uint256 i = 0; i <= _PARAS.length - 1; i++) {
            if (_PARAS[i] == para) {
                _PARAS[i] = _PARAS[_PARAS.length - 1];
                _PARAS.pop();
                break;
            }
        }
    }

    function addPara(address admin, address para) public onlyOwner {
        address oracle = Admin(admin)._ORACLE_();
        require(!isParaRegistered(oracle), "Para_REGISTERED");
        _PARA_REGISTER_[oracle] = para;
        _PARAS.push(para);
    }

    // ============ Breed Para Function ============
    function breedPara(
        address maintainer,
        address collateralToken,
        address oracle,
        string memory tokenName,
        uint256 lpFeeRate,
        uint256 mtFeeRate,
        uint256 k,
        uint256 gasPriceLimit
    ) external onlyOwner returns (address newBornAdmin, address newBornPara) {
        require(!isParaRegistered(oracle), "Para_REGISTERED");
        newBornAdmin = ICloneFactory(_CLONE_FACTORY_).clone(_ADMIN_LOGIC_);
        Admin(newBornAdmin).init(
            _OWNER_,
            _DEFAULT_SUPERVISOR_,
            maintainer,
            collateralToken,
            oracle,
            lpFeeRate,
            mtFeeRate,
            k,
            gasPriceLimit
        );

        address newBornPricing =
            ICloneFactory(_CLONE_FACTORY_).clone(_PRICING_LOGIC_);
        newBornPara = ICloneFactory(_CLONE_FACTORY_).clone(_PARA_LOGIC_);

        Pricing(newBornPricing).init(newBornPara, newBornAdmin);

        IPara(newBornPara).init(newBornAdmin, newBornPricing, tokenName);

        addPara(newBornAdmin, newBornPara);
        emit ParaBirth(newBornPara, oracle);
    }

    // ============ View Functions ============

    function isParaRegistered(address oracle) public view returns (bool) {
        if (_PARA_REGISTER_[oracle] == address(0)) {
            return false;
        } else {
            return true;
        }
    }

    function getPara(address oracle) external view returns (address) {
        return _PARA_REGISTER_[oracle];
    }

    function getParas() external view returns (address[] memory) {
        return _PARAS;
    }

    fallback() external payable {
        require(msg.sender == address(this), "WE_SAVED_YOUR_ETH_");
    }

    receive() external payable {
        require(msg.sender == address(this), "WE_SAVED_YOUR_ETH_");
    }
}

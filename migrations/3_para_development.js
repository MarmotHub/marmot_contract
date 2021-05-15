const fs = require("fs");
const file = fs.createWriteStream("./deploy-logger.txt", {'flags': 'w'});
let logger = new console.Console(file, file);

const ethers = require("ethers")
const MAX_UINT256 = ethers.constants.MaxUint256
const {GetConfig} = require("../configAdapter.js")

function decimalStr(value) {
    return new BigNumber(value).multipliedBy(10 ** 18).toFixed(0, BigNumber.ROUND_DOWN)
}

function gweiStr(gwei) {
    return new BigNumber(gwei).multipliedBy(10 ** 9).toFixed(0, BigNumber.ROUND_DOWN)
}

const BigNumber = require("bignumber.js");
const NaiveOracle = artifacts.require("NaiveOracle");
const TestBUSD = artifacts.require("ERC20Mintable"); // anyone can mint test BUSD
const ParaPlace = artifacts.require("ParaPlace");
const Para = artifacts.require("Para");
const Admin = artifacts.require("Admin");
const Pricing = artifacts.require("Pricing");
const CloneFactory = artifacts.require("CloneFactory");


module.exports = async (deployer, network, accounts) => {
    if (network != 'development') {
        return
    }
    const addresses = await web3.eth.getAccounts();
    const owner = accounts[0];
    logger.log("OWNER: ", owner);
    const supervisor = accounts[0];
    const maintainer = accounts[0];
    const tokenName = "MARMOT";

    const lpFeeRate = decimalStr("0.0005");
    const mtFeeRate = decimalStr("0.00");
    const k = decimalStr("0.1");
    const gasPriceLimit = gweiStr("100");

    let CONFIG = GetConfig(network, accounts)
    if (CONFIG == null) return;
    //TOKEN
    let TestBUSDAddress = CONFIG.TestBUSDAddress
    let ParaPlaceAddress = CONFIG.ParaPlaceAddress
    let ParaOriginAddress = CONFIG.ParaOriginAddress
    let AdminOriginAddress = CONFIG.AdminOriginAddress
    let PricingOriginAddress = CONFIG.PricingOriginAddress

    let NaivePriceOracleProxyAddress = CONFIG.NaiveOracle.PriceOracleProxyAddress
    let NaiveParaAddress = CONFIG.NaiveOracle.ParaAddress
    let NaiveAdminAddress = CONFIG.NaiveOracle.AdminAddress
    let NaivePricingAddress = CONFIG.NaiveOracle.PricingAddress
    let NaiveLpTokenAddress = CONFIG.NaiveOracle.LpTokenAddress




    if (NaivePriceOracleProxyAddress == "") {
        await deployer.deploy(NaiveOracle);
        NaivePriceOracleProxyAddress = NaiveOracle.address
        logger.log("NaivePriceOracleProxyAddress: ", NaivePriceOracleProxyAddress);
        const NaivePriceOracleProxyInstance = await NaiveOracle.at(NaivePriceOracleProxyAddress);
        await NaivePriceOracleProxyInstance.setPrice(decimalStr("100"));
    }



    if (TestBUSDAddress == "") {
        await deployer.deploy(TestBUSD, "TestBUSD", "TestBUSD");
        TestBUSDAddress = TestBUSD.address;
        const TestBUSDInstance = await TestBUSD.at(TestBUSDAddress);
        logger.log("TestUSDTAddress", TestBUSDAddress);
        for (let i = 0; i < 1; i++) {
            await TestBUSDInstance.mint(addresses[i], decimalStr("50000000")); // send 1000000USDT to owner
        }
        for (let i = 1; i < addresses.length; i++) {
            await TestBUSDInstance.mint(addresses[i], decimalStr("50000")); // send 10000USDT to test accounts
        }
    }

    if (ParaOriginAddress == "") {
        await deployer.deploy(Para);
        ParaOriginAddress = Para.address;
        logger.log("ParaOriginAddress: ", ParaOriginAddress)
    }

    if (AdminOriginAddress == "") {
        await deployer.deploy(Admin);
        AdminOriginAddress = Admin.address
        logger.log("AdminOriginAddress: ", AdminOriginAddress)
    }

    if (PricingOriginAddress == "") {
        await deployer.deploy(Pricing);
        PricingOriginAddress = Pricing.address
        logger.log("PricingOriginAddress: ", PricingOriginAddress)
    }

    if (ParaPlaceAddress == "") {
        await deployer.deploy(ParaPlace,
            ParaOriginAddress, AdminOriginAddress, PricingOriginAddress, CloneFactory.address, supervisor
        )
        ParaPlaceAddress = ParaPlace.address;
        logger.log("ParaPlaceAddress: ", ParaPlaceAddress);
    }

    const ParaPlaceInstance = await ParaPlace.at(ParaPlaceAddress);

    if (NaiveParaAddress == "") {
        var tx = await ParaPlaceInstance.breedPara(
            maintainer,
            TestBUSDAddress,
            NaivePriceOracleProxyAddress,
            "NAIVE",
            lpFeeRate,
            mtFeeRate,
            k,
            gasPriceLimit
        );
        NaiveParaAddress = await ParaPlaceInstance.getPara(NaivePriceOracleProxyAddress);
        const NaiveParaInstance = await Para.at(NaiveParaAddress);
        logger.log("NaiveParaAddress: ", NaiveParaAddress);

        NaiveAdminAddress = await NaiveParaInstance.ADMIN();
        const NaiveAdminInstance = await Admin.at(NaiveAdminAddress);
        logger.log("NaiveAdminAddress: ", NaiveAdminAddress);

        const NaivePricingAddress = await NaiveParaInstance.PRICING();
        const NaivePricingInstance = await Pricing.at(NaivePricingAddress);
        logger.log("NaivePricingAddress: ", NaivePricingAddress);

        const NaiveLpTokenAddress = await NaiveParaInstance._COLLATERAL_POOL_TOKEN_();
        logger.log('NaiveLpTokenAddress', NaiveLpTokenAddress);

        await NaiveAdminInstance.enableDeposit();
        await NaiveAdminInstance.enableTrading();



        // setting
        await NaiveAdminInstance.setTwapInterval(60);
        await NaiveAdminInstance.setPremiumLimit(decimalStr("0.1"));
        await NaiveAdminInstance.setInitialMarginRate(decimalStr("0.05"));
        await NaiveAdminInstance.setMaintenanceMarginRate(decimalStr("0.025"));
        await NaiveAdminInstance.setLiquidationPenaltyRate(decimalStr("0.01"));
        await NaiveAdminInstance.setLiquidationPenaltyPoolRate(decimalStr("0.005"));
        await NaiveAdminInstance.setPoolOpenTH(decimalStr("2"));
        await NaiveAdminInstance.setPoolLiquidateTH(decimalStr("1"));

        TestBUSDInstance = await TestBUSD.at(TestBUSDAddress);
        var tx1 = await TestBUSDInstance.approve(NaiveParaAddress, MAX_UINT256, {from: owner})
        await NaiveParaInstance.collateralTraderTransferIn(owner, decimalStr("1000000"));
        await NaiveParaInstance.depositCollateral(decimalStr("1000000"));
    }


};

const fs = require("fs");
const file = fs.createWriteStream("./deploy-logger.txt", { 'flags': 'a' });
let logger = new console.Console(file, file);

const ethers = require("ethers")
const MAX_UINT256 = ethers.constants.MaxUint256
const { GetConfig } = require("../configAdapter.js")

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

const ChainlinkBTCPriceOracleProxyKovan = artifacts.require("ChainlinkBTCPriceOracleProxyKovan");
const ChainlinkBTCPriceOracleProxyBsctest = artifacts.require("ChainlinkBTCPriceOracleProxyBSCtest");
const ChainlinkETHPriceOracleProxyKovan = artifacts.require("ChainlinkETHPriceOracleProxyKovan");
const ChainlinkETHPriceOracleProxyBsctest = artifacts.require("ChainlinkETHPriceOracleProxyBSCtest");

module.exports = async (deployer, network, accounts) => {
    if (network == 'development') {
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
    const k = decimalStr("0.05");
    const gasPriceLimit = gweiStr("100");

    let CONFIG = GetConfig(network, accounts)
    if (CONFIG == null) return;
    //TOKEN
    let TestBUSDAddress = CONFIG.TestBUSDAddress
    let ParaPlaceAddress = CONFIG.ParaPlaceAddress
    let ParaOriginAddress = CONFIG.ParaOriginAddress
    let AdminOriginAddress = CONFIG.AdminOriginAddress
    let PricingOriginAddress = CONFIG.PricingOriginAddress

    let BTCBUSDPriceOracleProxyAddress = CONFIG.BTCBUSD.PriceOracleProxyAddress
    let BTCBUSDParaAddress = CONFIG.BTCBUSD.ParaAddress
    let BTCBUSDAdminAddress = CONFIG.BTCBUSD.AdminAddress
    let BTCBUSDPricingAddress = CONFIG.BTCBUSD.PricingAddress
    let BTCBUSDLpTokenAddress = CONFIG.BTCBUSD.LpTokenAddress

    let ETHBUSDPriceOracleProxyAddress = CONFIG.ETHBUSD.PriceOracleProxyAddress
    let ETHBUSDParaAddress = CONFIG.ETHBUSD.ParaAddress
    let ETHBUSDAdminAddress = CONFIG.ETHBUSD.AdminAddress
    let ETHBUSDPricingAddress = CONFIG.ETHBUSD.PricingAddress
    let ETHBUSDLpTokenAddress = CONFIG.ETHBUSD.LpTokenAddress

    if (BTCBUSDPriceOracleProxyAddress=="") {
        if (network == "kovan") {
            await deployer.deploy(ChainlinkBTCPriceOracleProxyKovan);
            BTCBUSDPriceOracleProxyAddress = ChainlinkBTCPriceOracleProxyKovan.address;
            logger.log("BTCBUSDPriceOracleProxyAddress: ", BTCBUSDPriceOracleProxyAddress);
        }
        if (network == "bsctest") {
            await deployer.deploy(ChainlinkBTCPriceOracleProxyBsctest);
            BTCBUSDPriceOracleProxyAddress = ChainlinkBTCPriceOracleProxyBsctest.address;
            logger.log("BTCBUSDPriceOracleProxyAddress: ", BTCBUSDPriceOracleProxyAddress);
        }
    }

    if (ETHBUSDPriceOracleProxyAddress=="") {
        if (network == "kovan") {
            await deployer.deploy(ChainlinkETHPriceOracleProxyKovan);
            ETHBUSDPriceOracleProxyAddress = ChainlinkETHPriceOracleProxyKovan.address;
            logger.log("ETHBUSDPriceOracleProxyAddress: ", ETHBUSDPriceOracleProxyAddress);
        }
        if (network == "bsctest") {
            await deployer.deploy(ChainlinkETHPriceOracleProxyBsctest);
            ETHBUSDPriceOracleProxyAddress = ChainlinkETHPriceOracleProxyBsctest.address;
            logger.log("ETHBUSDPriceOracleProxyAddress: ", ETHBUSDPriceOracleProxyAddress);
        }
    }


    if (TestBUSDAddress=="") {
        await deployer.deploy(TestBUSD, "TestBUSD", "TestBUSD");
        TestBUSDAddress = TestBUSD.address;
        const TestBUSDInstance = await TestBUSD.at(TestBUSDAddress);
        logger.log("TestUSDTAddress", TestBUSDAddress);
        for (let i=0; i<1; i++ ) {
             await TestBUSDInstance.mint(addresses[i], decimalStr("50000000")); // send 1000000USDT to owner
            }
        for (let i=1; i<addresses.length; i++ ) {
             await TestBUSDInstance.mint(addresses[i], decimalStr("50000")); // send 10000USDT to test accounts
            }
    }

    if (ParaOriginAddress=="") {
        await deployer.deploy(Para);
        ParaOriginAddress = Para.address;
        logger.log("ParaOriginAddress: ", ParaOriginAddress)
    }

    if (AdminOriginAddress=="") {
        await deployer.deploy(Admin);
        AdminOriginAddress = Admin.address
        logger.log("AdminOriginAddress: ", AdminOriginAddress)
    }

    if (PricingOriginAddress=="") {
        await deployer.deploy(Pricing);
        PricingOriginAddress = Pricing.address
        logger.log("PricingOriginAddress: ", PricingOriginAddress)
    }

    if (ParaPlaceAddress=="") {
        await deployer.deploy(ParaPlace,
            ParaOriginAddress, AdminOriginAddress, PricingOriginAddress, CloneFactory.address, supervisor
        )
        ParaPlaceAddress = ParaPlace.address;
        logger.log("ParaPlaceAddress: ", ParaPlaceAddress);
    }

    const ParaPlaceInstance = await ParaPlace.at(ParaPlaceAddress);

    if (BTCBUSDParaAddress == "") {
        var tx = await ParaPlaceInstance.breedPara(
            maintainer,
            TestBUSDAddress,
            BTCBUSDPriceOracleProxyAddress,
            "BTC",
            lpFeeRate,
            mtFeeRate,
            k,
            gasPriceLimit
            );
        BTCBUSDParaAddress = await ParaPlaceInstance.getPara(BTCBUSDPriceOracleProxyAddress);
        const BTCBUSDParaInstance = await Para.at(BTCBUSDParaAddress);
        logger.log("BTCBUSDParaAddress: ", BTCBUSDParaAddress);

        BTCBUSDAdminAddress = await BTCBUSDParaInstance.ADMIN();
        const BTCBUSDAdminInstance = await Admin.at(BTCBUSDAdminAddress);
        logger.log("BTCBUSDAdminAddress: ", BTCBUSDAdminAddress);

        const BTCBUSDPricingAddress = await BTCBUSDParaInstance.PRICING();
        const BTCBUSDPricingInstance = await Pricing.at(BTCBUSDPricingAddress);
        logger.log("BTCBUSDPricingAddress: ", BTCBUSDPricingAddress);

        const BTCBUSDLpTokenAddress = await BTCBUSDParaInstance._COLLATERAL_POOL_TOKEN_();
        logger.log('BTCBUSDLpTokenAddress', BTCBUSDLpTokenAddress);

        await BTCBUSDAdminInstance.enableDeposit();
        await BTCBUSDAdminInstance.enableTrading();


        // setting
        await BTCBUSDAdminInstance.setTwapInterval(60);
        await BTCBUSDAdminInstance.setPremiumLimit(decimalStr("0.1"));
        await BTCBUSDAdminInstance.setInitialMarginRate(decimalStr("0.05"));
        await BTCBUSDAdminInstance.setMaintenanceMarginRate(decimalStr("0.025"));
        await BTCBUSDAdminInstance.setLiquidationPenaltyRate(decimalStr("0.01"));
        await BTCBUSDAdminInstance.setLiquidationPenaltyPoolRate(decimalStr("0.005"));
        await BTCBUSDAdminInstance.setPoolOpenTH(decimalStr("2"));
        await BTCBUSDAdminInstance.setPoolLiquidateTH(decimalStr("1"));

        TestBUSDInstance = await TestBUSD.at(TestBUSDAddress);
        var tx1 = await TestBUSDInstance.approve(BTCBUSDParaAddress, MAX_UINT256, {from: owner})
        await BTCBUSDParaInstance.collateralTraderTransferIn(owner, decimalStr("1000000"));
        await BTCBUSDParaInstance.depositCollateral(decimalStr("1000000"));

    }

    if (ETHBUSDParaAddress == "") {
        var tx = await ParaPlaceInstance.breedPara(
            maintainer,
            TestBUSDAddress,
            ETHBUSDPriceOracleProxyAddress,
            "ETH",
            lpFeeRate,
            mtFeeRate,
            k,
            gasPriceLimit
            );
        ETHBUSDParaAddress = await ParaPlaceInstance.getPara(ETHBUSDPriceOracleProxyAddress);
        const ETHBUSDParaInstance = await Para.at(ETHBUSDParaAddress);
        logger.log("ETHBUSDParaAddress: ", ETHBUSDParaAddress);

        ETHBUSDAdminAddress = await ETHBUSDParaInstance.ADMIN();
        const ETHBUSDAdminInstance = await Admin.at(ETHBUSDAdminAddress);
        logger.log("ETHBUSDAdminAddress: ", ETHBUSDAdminAddress);

        const ETHBUSDPricingAddress = await ETHBUSDParaInstance.PRICING();
        const ETHBUSDPricingInstance = await Pricing.at(ETHBUSDPricingAddress);
        logger.log("ETHBUSDPricingAddress: ", ETHBUSDPricingAddress);

        const ETHBUSDLpTokenAddress = await ETHBUSDParaInstance._COLLATERAL_POOL_TOKEN_();
        logger.log('ETHBUSDLpTokenAddress', ETHBUSDLpTokenAddress);

        await ETHBUSDAdminInstance.enableDeposit();
        await ETHBUSDAdminInstance.enableTrading();
        // setting
        await ETHBUSDAdminInstance.setTwapInterval(60);
        await ETHBUSDAdminInstance.setPremiumLimit(decimalStr("0.1"));
        await ETHBUSDAdminInstance.setInitialMarginRate(decimalStr("0.05"));
        await ETHBUSDAdminInstance.setMaintenanceMarginRate(decimalStr("0.025"));
        await ETHBUSDAdminInstance.setLiquidationPenaltyRate(decimalStr("0.01"));
        await ETHBUSDAdminInstance.setLiquidationPenaltyPoolRate(decimalStr("0.005"));
        await ETHBUSDAdminInstance.setPoolOpenTH(decimalStr("2"));
        await ETHBUSDAdminInstance.setPoolLiquidateTH(decimalStr("1"));

        TestBUSDInstance = await TestBUSD.at(TestBUSDAddress);
        var tx1 = await TestBUSDInstance.approve(ETHBUSDParaAddress, MAX_UINT256, {from: owner})
        await ETHBUSDParaInstance.collateralTraderTransferIn(owner, decimalStr("1000000"));
        await ETHBUSDParaInstance.depositCollateral(decimalStr("1000000"));
    }

};

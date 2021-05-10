const fs = require("fs");
const file = fs.createWriteStream("./deploy-logger.txt", { 'flags': 'w' });
let logger = new console.Console(file, file);

const ethers = require("ethers")
const MAX_UINT256 = ethers.constants.MaxUint256

function decimalStr(value) {
  return new BigNumber(value).multipliedBy(10 ** 18).toFixed(0, BigNumber.ROUND_DOWN)
}

function gweiStr(gwei) {
  return new BigNumber(gwei).multipliedBy(10 ** 9).toFixed(0, BigNumber.ROUND_DOWN)
}

const BigNumber = require("bignumber.js");
const NaiveOracle = artifacts.require("NaiveOracle");
const ChainlinkBTCPriceOracleProxy = artifacts.require("ChainlinkBTCPriceOracleProxy");
const ChainlinkBTCPriceOracleProxyV2 = artifacts.require("ChainlinkBTCPriceOracleProxyV2");
const TestUSDT = artifacts.require("ERC20Mintable"); // anyone can mint test USDT
const ParaPlace = artifacts.require("ParaPlace");
const Para = artifacts.require("Para");
const Admin = artifacts.require("Admin");
const Pricing = artifacts.require("Pricing");
const CloneFactory = artifacts.require("CloneFactory");

module.exports = async (deployer, network, accounts) => {
    const addresses = await web3.eth.getAccounts();
    const owner = accounts[0];
    logger.log("OWNER: ", owner);
    const supervisor = accounts[0];
    const maintainer = accounts[0];
    const tokenName = "MARMOT";


    const lpFeeRate = decimalStr("0.001");
    const mtFeeRate = decimalStr("0.00");
    const k = decimalStr("0.1");
    const gasPriceLimit = gweiStr("100");
    await deployer.deploy(NaiveOracle);
    const NaiveOracleAddress = NaiveOracle.address
    logger.log("NaiveOracle: ", NaiveOracle.address);
    await deployer.deploy(ChainlinkBTCPriceOracleProxyV2);
    logger.log("ChainlinkBTCPriceOracleProxyV2: ", ChainlinkBTCPriceOracleProxyV2.address);

    await deployer.deploy(TestUSDT, "TestUSDT", "TestUSDT");
    const TestUSDTAddress = TestUSDT.address;
    const TestUSDTInstance = await TestUSDT.at(TestUSDTAddress);
    logger.log("TestUSDTAddress", TestUSDTAddress);
    for (let i=0; i<1; i++ ) {
         await TestUSDTInstance.mint(addresses[i], decimalStr("1000000")); // send 1000000USDT to owner
        }
    for (let i=1; i<addresses.length; i++ ) {
         await TestUSDTInstance.mint(addresses[i], decimalStr("10000")); // send 10000USDT to test accounts
        }

    await deployer.deploy(Admin);
    await deployer.deploy(Pricing);
    await deployer.deploy(Para);
    await deployer.deploy(ParaPlace,
        Para.address, Admin.address, Pricing.address, CloneFactory.address, supervisor
    )
    const ParaPlaceAddress = ParaPlace.address;
    logger.log("ParaPlaceAddress: ", ParaPlaceAddress);
    const ParaPlaceInstance = await ParaPlace.at(ParaPlaceAddress);

    let ParaAddress;
    let ParaInstance;
    if (network == 'kovan') {
        var tx = await ParaPlaceInstance.breedPara(
            maintainer,
            TestUSDT.address,
            ChainlinkBTCPriceOracleProxyV2.address,
            tokenName,
            lpFeeRate,
            mtFeeRate,
            k,
            gasPriceLimit
            );
        logger.log("ParaPlace breedPara tx: ", tx.tx);
        ParaAddress = await ParaPlaceInstance.getPara(ChainlinkBTCPriceOracleProxyV2.address);
        ParaInstance = await Para.at(ParaAddress);
        logger.log("ParaAddress: ", ParaAddress);
    }
    else {
        var tx = await ParaPlaceInstance.breedPara(
            maintainer,
            TestUSDT.address,
            NaiveOracle.address,
            tokenName,
            lpFeeRate,
            mtFeeRate,
            k,
            gasPriceLimit
            );
        logger.log("ParaPlace breedPara tx: ", tx.tx);
        const ParaAddress = await ParaPlaceInstance.getPara(NaiveOracle.address);
        ParaInstance = await Para.at(ParaAddress);
        logger.log("ParaAddress: ", ParaAddress);

        const NaiveOracleInstance = await NaiveOracle.at(NaiveOracleAddress);
        await NaiveOracleInstance.setPrice(decimalStr("100"));
    }

    // logger.log('para', para);
    const AdminAddress = await ParaInstance.ADMIN();
    const AdminInstance = await Admin.at(AdminAddress);
    logger.log("AdminAddress: ", AdminAddress);

    const PricingAddress = await ParaInstance.PRICING();
    const PricingInstance = await Pricing.at(PricingAddress);
    logger.log("PricingAddress: ", PricingAddress);

    const LpTokenAddress = await ParaInstance._COLLATERAL_POOL_TOKEN_();
    logger.log('LpTokenAddress', LpTokenAddress);

    await AdminInstance.enableDeposit();
    await AdminInstance.enableTrading();
    logger.log('Admin Owner', await AdminInstance._OWNER_());

    // setting
    await AdminInstance.setInitialMarginRate(decimalStr("0.1"));
    await AdminInstance.setMaintenanceMarginRate(decimalStr("0.05"));
    await AdminInstance.setLiquidationPenaltyRate(decimalStr("0.01"));
    await AdminInstance.setLiquidationPenaltyPoolRate(decimalStr("0.005"));
    await AdminInstance.setPoolOpenTH(decimalStr("2"));
    await AdminInstance.setPoolLiquidateTH(decimalStr("1"));

    // deposit 5000TestUSDT to LP
    if (network == 'development') {
        var tx1 = await TestUSDTInstance.approve(ParaAddress, MAX_UINT256, {from: owner})
        var tx2 = await TestUSDTInstance.approve(ParaAddress, MAX_UINT256, {from: accounts[1]})
        var tx3 = await TestUSDTInstance.approve(ParaAddress, MAX_UINT256, {from: accounts[2]})
        console.log(tx1, tx2, tx3)
        await ParaInstance.collateralTraderTransferIn(owner, decimalStr("1000000"));
        // let {SIDE, SIZE, ENTRY_VALUE, CASH_BALANCE, ENTRY_SLOSS} = await ParaInstance._MARGIN_ACCOUNT_(ParaAddress)
        // logger.log('poolAccount', SIDE, SIZE.toString(), ENTRY_VALUE.toString(), CASH_BALANCE.toString(), ENTRY_SLOSS.toString())
        await ParaInstance.depositCollateral(decimalStr("49900"));
        logger.log('1', await ParaInstance._MARGIN_ACCOUNT_(ParaAddress));
        // let {SIDE2, SIZE2, ENTRY_VALUE2, CASH_BALANCE2, ENTRY_SLOSS2} = await ParaInstance._MARGIN_ACCOUNT_(ParaAddress)
        // logger.log('poolAccount', CASH_BALANCE2.toString())


        await ParaInstance.collateralTraderTransferIn(accounts[1], decimalStr("4000"), {from: accounts[1]});
        await ParaInstance.depositCollateral(decimalStr("1200"), {from: accounts[1]});
        let tx4 = await ParaInstance.getPoolMarginCashBalance()
        logger.log('tx4 before', tx4.toString())
        // buy
        tx3 = await ParaInstance.buyBaseToken(decimalStr("1"), decimalStr("1000"), {from: accounts[1]});
        // logger.log('2', await ParaInstance._MARGIN_ACCOUNT_(ParaAddress));
        let {SIDE2, SIZE2, ENTRY_VALUE2, CASH_BALANCE2, ENTRY_SLOSS2} = await ParaInstance._MARGIN_ACCOUNT_(ParaAddress)
        logger.log('poolAccount', SIDE2, SIZE2, ENTRY_VALUE2, CASH_BALANCE2, ENTRY_SLOSS2)
        logger.log('tx3', tx3)

        tx4 = await ParaInstance.getPoolMarginCashBalance()
        logger.log('tx4 after', tx4.toString())
    }

    if (network == 'kovan') {
        var tx1 = await TestUSDTInstance.approve(ParaAddress, MAX_UINT256, {from: owner})
        await ParaInstance.collateralTraderTransferIn(owner, decimalStr("600000"));
        await ParaInstance.depositCollateral(decimalStr("49900"));

        // buy
        tx3 = await ParaInstance.buyBaseToken(decimalStr("1"), decimalStr("100000000"), {from: owner});
        let {SIDE2, SIZE2, ENTRY_VALUE2, CASH_BALANCE2, ENTRY_SLOSS2} = await ParaInstance._MARGIN_ACCOUNT_(ParaAddress)
        logger.log('poolAccount', SIDE2, SIZE2, ENTRY_VALUE2, CASH_BALANCE2, ENTRY_SLOSS2)
        logger.log('tx3', tx3)
        tx4 = await ParaInstance.getPoolMarginCashBalance()
        logger.log('tx4 after', tx4.toString())
    }


};

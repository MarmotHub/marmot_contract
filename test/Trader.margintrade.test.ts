/*

    Copyright 2021 ParaPara
    SPDX-License-Identifier: Apache-2.0

*/

// import * as assert from 'assert';

import { ParaContext, getParaContext } from './utils/Context';
import {decimalStr} from './utils/Converter';
import assert from "assert";
// import { logGas } from './utils/Log';

let lp1: string;
let lp2: string;
let trader1: string;
let trader2: string;
let trader3: string;
let trader4: string;
let trader5: string;
let tempAccount: string;
// let poolAccount: string;

async function init(ctx: ParaContext): Promise<void> {
  await ctx.setOraclePrice(decimalStr("100"));
  tempAccount = ctx.spareAccounts[5];
  lp1 = ctx.spareAccounts[0];
  lp2 = ctx.spareAccounts[1];
  trader1 = ctx.spareAccounts[2];
  trader2 = ctx.spareAccounts[3];
  trader3 = ctx.spareAccounts[4];
  trader4 = ctx.spareAccounts[5];
  trader5 = ctx.spareAccounts[6];
  // poolAccount = ctx.Para.options.address;
  await ctx.mintTestToken(lp1, decimalStr("100000"));
  await ctx.mintTestToken(lp2, decimalStr("100000"));
  await ctx.mintTestToken(trader1, decimalStr("1000"));
  await ctx.mintTestToken(trader2, decimalStr("1000"));
  await ctx.mintTestToken(trader3, decimalStr("1000"));
  await ctx.mintTestToken(trader4, decimalStr("1000"));
  await ctx.mintTestToken(trader5, decimalStr("1000"));
  await ctx.mintTestToken(tempAccount, decimalStr("1000"));
  await ctx.approvePara(lp1);
  await ctx.approvePara(lp2);
  await ctx.approvePara(trader1);
  await ctx.approvePara(trader2);
  await ctx.approvePara(trader3);
  await ctx.approvePara(trader4);
  await ctx.approvePara(trader5);

  await ctx.Admin.methods
      .enableDeposit()
      .send(ctx.sendParam(ctx.Deployer));
  await ctx.Admin.methods
      .enableTrading()
      .send(ctx.sendParam(ctx.Deployer));
  await ctx.Para.methods
      .collateralTraderTransferIn(lp1, decimalStr("100000"))
      .send(ctx.sendParam(lp1));
  await ctx.Para.methods
      .collateralTraderTransferIn(trader1, decimalStr("1000"))
      .send(ctx.sendParam(trader1));
  await ctx.Para.methods
      .collateralTraderTransferIn(trader2, decimalStr("1000"))
      .send(ctx.sendParam(trader2));
  await ctx.Para.methods
      .collateralTraderTransferIn(trader3, decimalStr("1000"))
      .send(ctx.sendParam(trader3))
    await ctx.Para.methods
      .collateralTraderTransferIn(trader4, decimalStr("1000"))
      .send(ctx.sendParam(trader4));
  await ctx.Para.methods
      .collateralTraderTransferIn(trader5, decimalStr("1000"))
      .send(ctx.sendParam(trader5));
  await ctx.Admin.methods.setInitialMarginRate(decimalStr("0.2")).send(ctx.sendParam(ctx.Deployer));
  await ctx.Admin.methods.setMaintenanceMarginRate(decimalStr("0.1")).send(ctx.sendParam(ctx.Deployer));
}

describe("Trader", () => {
  let snapshotId: string;
  let ctx: ParaContext;

  before(async () => {
    ctx = await getParaContext();
    await init(ctx);
  });

  beforeEach(async () => {
    snapshotId = await ctx.EVM.snapshot();
  });

  afterEach(async () => {
    await ctx.EVM.reset(snapshotId);
  });

  describe("Trader", () => {
      // it("reject when amount large than maximum", async () => {
      //    await ctx.Para.methods.depositCollateral(decimalStr("100000")).send(ctx.sendParam(lp1));
      //    await assert.rejects(
      //       ctx.Para.methods.buyBaseToken(decimalStr("100"), decimalStr("1000000")).send(ctx.sendParam(trader1)), /NOT_SAFE_TO_OPEN/
      //     )
      //     await assert.rejects(
      //       ctx.Para.methods.sellBaseToken(decimalStr("100"), decimalStr("100")).send(ctx.sendParam(trader1)), /NOT_SAFE_TO_OPEN/
      //     )
      //
      // });

      it("liquidate position when price change", async () => {
          // set penalty rate
          await ctx.Admin.methods.setLiquidationPenaltyRate(decimalStr("0.01")).send(ctx.sendParam(ctx.Deployer));
          await ctx.Admin.methods.setLiquidationPenaltyPoolRate(decimalStr("0.005")).send(ctx.sendParam(ctx.Deployer))
          await ctx.Para.methods.depositCollateral(decimalStr("100000")).send(ctx.sendParam(lp1));
          // a. trader1 first to buy 30 base token, will be liquidated by trader2 when price fall; switch a) in liquidate function
          await ctx.Para.methods.buyBaseToken(decimalStr("30"), decimalStr("1000000")).send(ctx.sendParam(trader1))

          let totalSize = await ctx.Para.methods.getTotalSize().call();
          console.log('size', totalSize);
          await ctx.setOraclePrice(decimalStr("70"));
          assert.equal(
              await ctx.Para.methods.isSafeMaintain(trader1).call(),
              false
            );
          await ctx.Para.methods.liquidate(trader2, trader1).send(ctx.sendParam(trader2));
          [totalSize] = await ctx.Para.methods.getTotalSize().call()
          console.log('size', totalSize);


          let [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader1).call();
          assert.deepEqual(
              [side, size, entry_value, cash_balance, entry_sloss],
              [0,0,0,"63618044538529896861",0]
          );
          [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader2).call();
          assert.deepEqual(
              [side, size, entry_value, cash_balance, entry_sloss],
              [2, decimalStr("30"),"2104463345232481029300","1021044633452324810293", 0]
          )
          await assert.equal(
              await ctx.Para.methods._POOL_INSURANCE_BALANCE_().call(),
              "10522316726162405146",
          );

          // b. trader2 close long position, open short position, then liquidated by trader3 when price rise; switch to 2) in liquidate function
          [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader2).call();
          console.log('before trader2', side, size/10**18, entry_value/10**18, cash_balance/10**18);
          await ctx.Para.methods.sellBaseToken(decimalStr("60"), decimalStr("100")).send(ctx.sendParam(trader2));

          totalSize = await ctx.Para.methods.getTotalSize().call();
          console.log('size', totalSize);

          [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader2).call();
          console.log('after trader2', side, size/10**18, entry_value/10**18, cash_balance/10**18);

          await ctx.setOraclePrice(decimalStr("102"));
          let traderAccount = await ctx.Para.methods._MARGIN_ACCOUNT_(trader2).call();
          console.log('trader2 balanceMargin', await ctx.Para.methods.balanceMargin(traderAccount).call()/10**18);

          await ctx.Para.methods.liquidate(trader3, trader2).send(ctx.sendParam(trader3));
          [totalSize] = await ctx.Para.methods.getTotalSize().call()
          console.log('size', totalSize);
          [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader3).call();
          console.log('trader3', side, size/10**18, entry_value/10**18, cash_balance/10**18);
          console.log('pool_insurance', await ctx.Para.methods._POOL_INSURANCE_BALANCE_().call()/10**18)

          await assert.equal(
              await ctx.Para.methods._POOL_INSURANCE_BALANCE_().call(),
              "25775225747983656775",
          );

          // c. trader3 close short position, open long position, then liquidated by trader 4; switch to 3) in liquidation func
          [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader3).call();
          console.log('before trader3', side, size/10**18, entry_value/10**18, cash_balance/10**18);
          await ctx.Para.methods.buyBaseToken(decimalStr("60"), decimalStr("1000000")).send(ctx.sendParam(trader3));
          [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader3).call();
          console.log('after trader3', side, size/10**18, entry_value/10**18, cash_balance/10**18);

          await ctx.setOraclePrice(decimalStr("68"));
          traderAccount = await ctx.Para.methods._MARGIN_ACCOUNT_(trader3).call();
          console.log('trader3 balanceMargin', await ctx.Para.methods.balanceMargin(traderAccount).call()/10**18);

          await ctx.Para.methods.liquidate(trader4, trader3).send(ctx.sendParam(trader4));
          totalSize = await ctx.Para.methods.getTotalSize().call();
          console.log('size', totalSize);
          [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader4).call();
          console.log('trader4', side, size/10**18, entry_value/10**18, cash_balance/10**18);
          console.log('pool_insurance', await ctx.Para.methods._POOL_INSURANCE_BALANCE_().call())

          await assert.equal(
              await ctx.Para.methods._POOL_INSURANCE_BALANCE_().call(),
              "10489154693378527532",
          );

          // d. switch to 4) in liquidation func
          [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader4).call();
          console.log('before trader4', side, size/10**18, entry_value/10**18, cash_balance/10**18);
          await ctx.Para.methods.sellBaseToken(decimalStr("60"), decimalStr("100")).send(ctx.sendParam(trader4));
          [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader4).call();
          console.log('after trader4', side, size/10**18, entry_value/10**18, cash_balance/10**18);

          await ctx.setOraclePrice(decimalStr("120"));
          traderAccount = await ctx.Para.methods._MARGIN_ACCOUNT_(trader4).call();
          console.log('trader4 balanceMargin', await ctx.Para.methods.balanceMargin(traderAccount).call()/10**18);

          await ctx.Para.methods.liquidate(trader5, trader4).send(ctx.sendParam(trader5));
          totalSize = await ctx.Para.methods.getTotalSize().call();
          console.log('size', totalSize);
          [side, size, entry_value, cash_balance, entry_sloss] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader5).call();
          console.log('trader5', side, size/10**18, entry_value/10**18, cash_balance/10**18);
          console.log('pool_insurance', await ctx.Para.methods._POOL_INSURANCE_BALANCE_().call())
          let [,,loss] = await ctx.Para.methods.getSloss().call();
          console.log('_SLOSS_PER_CONTRACT_', loss/10**18);
          totalSize = await ctx.Para.methods.getTotalSize().call()
          console.log('size', totalSize);
          console.log(await ctx.Para.methods._TOTAL_LONG_SIZE_().call());




      })


  })
})

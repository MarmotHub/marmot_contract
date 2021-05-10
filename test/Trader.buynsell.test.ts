/*

    Copyright 2021 ParaPara
    SPDX-License-Identifier: Apache-2.0

*/

import * as assert from 'assert';

import {ParaContext, getParaContext} from './utils/Context';
import {decimalStr} from './utils/Converter';
import {logGas} from './utils/Log';

let lp1: string;
let lp2: string;
let trader1: string;
let trader2: string;
let tempAccount: string;
let poolAccount: string;

async function init(ctx: ParaContext): Promise<void> {
  await ctx.setOraclePrice(decimalStr("100"));
  tempAccount = ctx.spareAccounts[5];
  lp1 = ctx.spareAccounts[0];
  lp2 = ctx.spareAccounts[1];
  trader1 = ctx.spareAccounts[2];
  trader2 = ctx.spareAccounts[3];
  poolAccount = ctx.Para.options.address;
  await ctx.mintTestToken(lp1, decimalStr("1000"));
  await ctx.mintTestToken(lp2, decimalStr("1000"));
  await ctx.mintTestToken(trader1, decimalStr("1000"));
  await ctx.mintTestToken(trader2, decimalStr("1000"));
  await ctx.mintTestToken(tempAccount, decimalStr("1000"));
  await ctx.approvePara(lp1);
  await ctx.approvePara(lp2);
  await ctx.approvePara(trader1);
  await ctx.approvePara(trader2);

  await ctx.Admin.methods
    .enableDeposit()
    .send(ctx.sendParam(ctx.Deployer));
  await ctx.Admin.methods
    .enableTrading()
    .send(ctx.sendParam(ctx.Deployer));
  await ctx.Para.methods
    .collateralTraderTransferIn(lp1, decimalStr("1000"))
    .send(ctx.sendParam(lp1));
  await ctx.Para.methods
    .collateralTraderTransferIn(trader1, decimalStr("1000"))
    .send(ctx.sendParam(trader1));
  await ctx.Para.methods
    .collateralTraderTransferIn(trader2, decimalStr("1000"))
    .send(ctx.sendParam(trader2));
  await ctx.Para.methods
    .depositCollateral(decimalStr("1000"))
    .send(ctx.sendParam(lp1));
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
    it("check expected balance", async () => {
      var [baseTarget, baseBalance, quoteTarget, quoteBalance] = await ctx.Pricing.methods.getExpectedTarget().call();
      assert.equal(
        baseTarget,
        decimalStr("10")
      );
      assert.equal(
        baseBalance,
        decimalStr("10")
      );
      assert.equal(
        quoteTarget,
        decimalStr("1000")
      );
      assert.equal(
        quoteBalance,
        decimalStr("1000")
      );

      // console.log(await ctx.Collateral_Pool_Token.methods.balanceOf(lp1).call());
    });

    it("buy base token when balanced", async () => {
      // await ctx.Para.methods.buyBaseToken(decimalStr("0.1"), decimalStr("100")).send(ctx.sendParam(trader));
      await logGas(ctx.Para.methods.buyBaseToken(decimalStr("1"), decimalStr("1000")), ctx.sendParam(trader1), "buy base token when balanced");
      // const snapshot = await ctx.Pricing.methods.reserveSnapshots(0).call()
      // console.log('snapshot', snapshot)
      console.log(await ctx.Pricing.methods.getSpecificSnapshot(0).call())
      assert.equal(
        await ctx.Para.methods._TARGET_BASE_TOKEN_AMOUNT_().call(),
        decimalStr("10")
      );
      assert.equal(
        await ctx.Para.methods._TARGET_QUOTE_TOKEN_AMOUNT_().call(),
        decimalStr("1000")
      );
      assert.equal(
        await ctx.Para.methods._BASE_BALANCE_().call(),
        decimalStr("9")
      );
      assert.equal(
        await ctx.Para.methods._QUOTE_BALANCE_().call(),
        "1101111111111111111100"
      );

      var [baseTarget, baseBalance, quoteTarget, quoteBalance] = await ctx.Pricing.methods.getExpectedTarget().call();
      assert.equal(
        baseTarget,
        decimalStr("10")
      );
      assert.equal(
        baseBalance,
        decimalStr("9")
      );
      assert.equal(
        quoteTarget,
        decimalStr("1000")
      );
      assert.equal(
        quoteBalance,
        "1101111111111111111100"
      );

      var [side, size, entry_value, cash_balance] = await ctx.Para.methods._MARGIN_ACCOUNT_(trader1).call();
      assert.equal(
        side,
        2
      );
      assert.equal(
        size,
        decimalStr("1")
      );
      assert.equal(
        entry_value,
        decimalStr("101.1111111111111111")
      );
      assert.equal(
        cash_balance,
        decimalStr("1000")
      );

      var [side, size, entry_value, cash_balance] = await ctx.Para.methods._MARGIN_ACCOUNT_(poolAccount).call();
      assert.equal(
        side,
        1
      );
      assert.equal(
        size,
        decimalStr("1")
      );
      assert.equal(
        entry_value,
        decimalStr("101.1111111111111111")
      );
      assert.equal(
        cash_balance,
        decimalStr("1000")
      );
    })

  it("sell base token when balanced", async () => {
      await logGas(ctx.Para.methods.sellBaseToken(decimalStr("1"), decimalStr("10")), ctx.sendParam(trader1), "sell base token when balanced");
      assert.equal(
        await ctx.Para.methods._TARGET_BASE_TOKEN_AMOUNT_().call(),
        decimalStr("10")
      );
      assert.equal(
        await ctx.Para.methods._TARGET_QUOTE_TOKEN_AMOUNT_().call(),
        decimalStr("1000")
      );
      assert.equal(
        await ctx.Para.methods._BASE_BALANCE_().call(),
        decimalStr("11")
      );
      assert.equal(
        await ctx.Para.methods._QUOTE_BALANCE_().call(),
        "901085803182938183889"
      );

    });

    it("TEST", async () => {
      // await ctx.Para.methods.buyBaseToken(decimalStr("0.1"), decimalStr("100")).send(ctx.sendParam(trader));
      await logGas(ctx.Para.methods.buyBaseToken(decimalStr("1"), decimalStr("1000")), ctx.sendParam(trader1), "buy base token when balanced");
      console.log('0', await ctx.Pricing.methods.getSpecificSnapshot(0).call())
      await logGas(ctx.Para.methods.buyBaseToken(decimalStr("2"), decimalStr("1000")), ctx.sendParam(trader1), "buy base token when balanced");
      let length = await ctx.Pricing.methods.getReserveSnapshotLength().call()
      console.log('1',length,  await ctx.Pricing.methods.getSpecificSnapshot(length-1).call())
      //
      await logGas(ctx.Para.methods.buyBaseToken(decimalStr("0.1"), decimalStr("1000")), ctx.sendParam(trader1), "buy base token when balanced");
      length = await ctx.Pricing.methods.getReserveSnapshotLength().call()
      console.log('2',length,  await ctx.Pricing.methods.getSpecificSnapshot(length-1).call())

      await logGas(ctx.Para.methods.sellBaseToken(decimalStr("1"), decimalStr("10")), ctx.sendParam(trader1), "buy base token when balanced");
      length = await ctx.Pricing.methods.getReserveSnapshotLength().call()
      console.log('3',length,  await ctx.Pricing.methods.getSpecificSnapshot(length-1).call())

      console.log("twap price", await ctx.Pricing.methods.getTwapPrice().call())
    })

  })
})


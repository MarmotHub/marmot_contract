/*

    Copyright 2021 ParaPara
    SPDX-License-Identifier: Apache-2.0

*/

import * as assert from 'assert';

import { ParaContext, getParaContext } from './utils/Context';
import { decimalStr } from './utils/Converter';


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
      .collateralTraderTransferIn(lp2, decimalStr("1000"))
      .send(ctx.sendParam(lp2));
  await ctx.Para.methods
      .collateralTraderTransferIn(trader1, decimalStr("1000"))
      .send(ctx.sendParam(trader1));
  await ctx.Para.methods
      .collateralTraderTransferIn(trader2, decimalStr("1000"))
      .send(ctx.sendParam(trader2));
  await ctx.Para.methods.depositCollateral(decimalStr("1000"))
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
	  it("balanced check", async () => {
	      await ctx.Para.methods.depositCollateral(decimalStr("1000")).send(ctx.sendParam(lp2));
	      assert.equal(
              await ctx.Para.methods.getCollateralPoolTokenBalanceOf(lp2).call(),
              decimalStr("1000")
          );
	      // console.log('lp1', await ctx.Para.methods._MARGIN_ACCOUNT_(lp2).call());
	      await ctx.Para.methods.withdrawCollateral(decimalStr("20")).send(ctx.sendParam(lp2));
	      assert.equal(
              await ctx.Para.methods.getCollateralPoolTokenBalanceOf(lp2).call(),
              decimalStr("980")
          );
	      // console.log('lp1', await ctx.Para.methods._MARGIN_ACCOUNT_(lp2).call());
	      await ctx.Para.methods.withdrawAllCollateral().send(ctx.sendParam(lp2));
	      assert.equal(
              await ctx.Para.methods.getCollateralPoolTokenBalanceOf(lp2).call(),
              decimalStr("0")
          );
	      // console.log('lp1', await ctx.Para.methods._MARGIN_ACCOUNT_(lp2).call());
		  // console.log(await ctx.Collateral_Pool_Token.methods.balanceOf(lp1).call());
	  });
	  it("trading check", async () => {
	      // console.log(await ctx.Para.methods._queryBuyBaseToken(decimalStr("1")).call());
	      let [baseTarget, baseBalance, quoteTarget, quoteBalance, ] = await ctx.Pricing.methods.getExpectedTarget().call();
		  console.log('1. Balanced', baseTarget/10**18, baseBalance/10**18, quoteTarget/10**18, quoteBalance/10**18);


		  await ctx.Para.methods.buyBaseToken(decimalStr("1"), decimalStr("1000")).send(ctx.sendParam(trader1));
		  // await ctx.Para.methods.sellBaseToken(decimalStr("1"), decimalStr("10")).send(ctx.sendParam(trader1));
		  [baseTarget, baseBalance, quoteTarget, quoteBalance, ] = await ctx.Pricing.methods.getExpectedTarget().call();
		  console.log('2. Buy 1 base token', baseTarget/10**18, baseBalance/10**18, quoteTarget/10**18, quoteBalance/10**18);




          await ctx.Para.methods.depositCollateral(decimalStr("1000")).send(ctx.sendParam(lp2));
          [baseTarget, baseBalance, quoteTarget, quoteBalance, ] = await ctx.Pricing.methods.getExpectedTarget().call();
		  console.log('3. deposit by lp2', baseTarget/10**18, baseBalance/10**18, quoteTarget/10**18, quoteBalance/10**18);
		  console.log("3. lp2 Pool token", await ctx.Para.methods.getCollateralPoolTokenBalanceOf(lp2).call());
		  console.log("3. lp1 Pool token", await ctx.Para.methods.getCollateralPoolTokenBalanceOf(lp1).call());


          // console.log('lp2 margin balance', await ctx.Para.methods._MARGIN_ACCOUNT_(lp2).call());
          //
          await ctx.Para.methods.withdrawAllCollateral().send(ctx.sendParam(lp2));
          [baseTarget, baseBalance, quoteTarget, quoteBalance, ] = await ctx.Pricing.methods.getExpectedTarget().call();
		  console.log('4. withdraw from lp2', baseTarget/10**18, baseBalance/10**18, quoteTarget/10**18, quoteBalance/10**18);
          console.log('4 lp2 lp balance', await ctx.Para.methods.getCollateralPoolTokenBalanceOf(lp2).call())
          console.log('4 lp2 margin account', await ctx.Para.methods._MARGIN_ACCOUNT_(lp2).call());
          console.log('4 pool margin account', await ctx.Para.methods._MARGIN_ACCOUNT_(poolAccount).call());

          await ctx.Para.methods.buyBaseToken(decimalStr("0.5"), decimalStr("1000")).send(ctx.sendParam(lp2));
          [baseTarget, baseBalance, quoteTarget, quoteBalance, ] = await ctx.Pricing.methods.getExpectedTarget().call();
		  console.log('5.lp2 close position', baseTarget/10**18, baseBalance/10**18, quoteTarget/10**18, quoteBalance/10**18);
		  console.log('5 lp2 margin account', await ctx.Para.methods._MARGIN_ACCOUNT_(lp2).call());
          console.log('5 pool margin account', await ctx.Para.methods._MARGIN_ACCOUNT_(poolAccount).call());

          await ctx.Para.methods.sellBaseToken(decimalStr("1"), decimalStr("10")).send(ctx.sendParam(trader1));
          [baseTarget, baseBalance, quoteTarget, quoteBalance, ] = await ctx.Pricing.methods.getExpectedTarget().call();
		  console.log('6.trader1 close position', baseTarget/10**18, baseBalance/10**18, quoteTarget/10**18, quoteBalance/10**18);
		  console.log('6 trader1 margin account', await ctx.Para.methods._MARGIN_ACCOUNT_(trader1).call());
          console.log('6 pool margin account', await ctx.Para.methods._MARGIN_ACCOUNT_(poolAccount).call());


          }
      )
  })
})

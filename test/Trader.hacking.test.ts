/*

    Copyright 2021 ParaPara
    SPDX-License-Identifier: Apache-2.0

*/

import * as assert from 'assert';

import { ParaContext, getParaContext } from './utils/Context';
import { decimalStr, gweiStr } from './utils/Converter';
// import { logGas } from './utils/Log';

let lp1: string;
let lp2: string;
let trader1: string;
let trader2: string;
let tempAccount: string;

async function init(ctx: ParaContext): Promise<void> {
  await ctx.setOraclePrice(decimalStr("100"));
  tempAccount = ctx.spareAccounts[5];
  lp1 = ctx.spareAccounts[0];
  lp2 = ctx.spareAccounts[1];
  trader1 = ctx.spareAccounts[2];
  trader2 = ctx.spareAccounts[3];
  await ctx.mintTestToken(lp1, decimalStr("100000"));
  await ctx.mintTestToken(lp2, decimalStr("100000"));
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
      .collateralTraderTransferIn(lp1, decimalStr("100000"))
      .send(ctx.sendParam(lp1));
  await ctx.Para.methods
      .collateralTraderTransferIn(trader1, decimalStr("1000"))
      .send(ctx.sendParam(trader1));
  await ctx.Para.methods
      .collateralTraderTransferIn(trader2, decimalStr("1000"))
      .send(ctx.sendParam(trader2));
  await ctx.Para.methods
      .depositCollateral(decimalStr("100000"))
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
      it("front run trading", async () => {
          await assert.rejects(
            ctx.Para.methods.buyBaseToken(decimalStr("1"), decimalStr("1000")).send({ from: trader1, gas: 300000, gasPrice: gweiStr("200") }), /GAS_PRICE_EXCEED/
          )
          await assert.rejects(
            ctx.Para.methods.sellBaseToken(decimalStr("1"), decimalStr("10")).send({ from: trader1, gas: 300000, gasPrice: gweiStr("200") }), /GAS_PRICE_EXCEED/
          )
      });

  })
})

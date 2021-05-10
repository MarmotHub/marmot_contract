/*

    Copyright 2021 ParaPara
    SPDX-License-Identifier: Apache-2.0

*/

import * as assert from 'assert';

import { ParaContext, getParaContext } from './utils/Context';
import { decimalStr } from './utils/Converter';

let lp1: string;
let lp2: string;
let trader: string;
let tempAccount: string;
let poolAccount: string;

async function init(ctx: ParaContext): Promise<void> {
  await ctx.setOraclePrice(decimalStr("100"));
  tempAccount = ctx.spareAccounts[5];
  lp1 = ctx.spareAccounts[0];
  lp2 = ctx.spareAccounts[1];
  trader = ctx.spareAccounts[2];
  poolAccount = ctx.Para.options.address;
  await ctx.mintTestToken(lp1, decimalStr("100"));
  await ctx.mintTestToken(lp2, decimalStr("100"));
  await ctx.mintTestToken(trader, decimalStr("100"));
  await ctx.mintTestToken(tempAccount, decimalStr("100"));
  await ctx.approvePara(lp1);
  await ctx.approvePara(lp2);
  await ctx.approvePara(trader);
}

describe("Admin", () => {
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

  describe("Controls", () => {
	  it("deposit to pool", async () => {
		  // await ctx.admin.methods
			//   .disableDeposit()
			//   .send(ctx.sendParam(ctx.Supervisor));
		  // await assert.rejects(
			//   ctx.Para.methods.depositCollateral(decimalStr("10")).send(ctx.sendParam(lp1)),
			//   /DEPOSIT_NOT_ALLOWED/
		  // );
		  await ctx.Admin.methods
              .enableDeposit()
              .send(ctx.sendParam(ctx.Deployer));
          await ctx.Para.methods.collateralTraderTransferIn(lp1, decimalStr("10"))
              .send(ctx.sendParam(lp1));
		  await ctx.Para.methods
              .depositCollateral(decimalStr("10"))
              .send(ctx.sendParam(lp1));
		  // await assert.equal(
          //     (await ctx.Para.methods._POOL_MARGIN_ACCOUNT_().call())['CASH_BALANCE'],
          //     decimalStr("10")
          // );
		  // // check LPtoken
		  // await assert.equal(
          //     await ctx.Collateral_Pool_Token.methods.balanceOf(lp1).call(),
          //     decimalStr(("10"))
          // );
	  })

      it("deposit and withdraw from pool", async () => {
          await ctx.Admin.methods
              .enableDeposit()
              .send(ctx.sendParam(ctx.Deployer));
          // trader deposit
          await ctx.Para.methods.collateralTraderTransferIn(lp1, decimalStr("10"))
              .send(ctx.sendParam(lp1));
          await ctx.Para.methods
              .depositCollateral(decimalStr("10"))
              .send(ctx.sendParam(lp1));
          // trader withdraw from pool
          await ctx.Para.methods
              .withdrawCollateral(decimalStr("10"))
              .send(ctx.sendParam(lp1));
          await assert.equal(
              (await ctx.Para.methods._MARGIN_ACCOUNT_(lp1).call())['CASH_BALANCE'],
              decimalStr("10")
          );
          // trader transfer out
          await ctx.Para.methods
              .collateralTraderTransferOut(lp1, decimalStr("10"))
              .send(ctx.sendParam(lp1));
          await assert.equal(
              (await ctx.Para.methods._MARGIN_ACCOUNT_(lp1).call())['CASH_BALANCE'],
              0);
          console.log(await ctx.Collateral.methods.balanceOf(lp1).call())
          await assert.equal(
              await ctx.Collateral.methods.balanceOf(lp1).call(),
              decimalStr("100")
          );
      })

      it("two LP deposit to pool", async () => {
          await ctx.Admin.methods
              .enableDeposit()
              .send(ctx.sendParam(ctx.Deployer));
          // trader deposit
          await ctx.Para.methods.collateralTraderTransferIn(lp1, decimalStr("10"))
              .send(ctx.sendParam(lp1));
          await ctx.Para.methods
              .depositCollateral(decimalStr("10"))
              .send(ctx.sendParam(lp1));
          await ctx.Para.methods.collateralTraderTransferIn(lp2, decimalStr("30"))
              .send(ctx.sendParam(lp2));
          await ctx.Para.methods
              .depositCollateral(decimalStr("30"))
              .send(ctx.sendParam(lp2));

          // check pool margin account
          await assert.equal(
              (await ctx.Para.methods._MARGIN_ACCOUNT_(poolAccount).call())['CASH_BALANCE'],
              decimalStr("40")
          );
		  // check LPtoken
		  await assert.equal(
              await ctx.Collateral_Pool_Token.methods.balanceOf(lp1).call(),
              decimalStr(("10"))
          );
		  await assert.equal(
              await ctx.Collateral_Pool_Token.methods.balanceOf(lp2).call(),
              decimalStr(("30"))
          );


      })

  })
})

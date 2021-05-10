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

async function init(ctx: ParaContext): Promise<void> {
  await ctx.setOraclePrice(decimalStr("100"));
  tempAccount = ctx.spareAccounts[5];
  lp1 = ctx.spareAccounts[0];
  lp2 = ctx.spareAccounts[1];
  trader = ctx.spareAccounts[2];
  await ctx.mintTestToken(lp1, decimalStr("100"));
  await ctx.mintTestToken(lp2, decimalStr("100"));
  await ctx.mintTestToken(trader, decimalStr("100"));
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

  describe("Settings", () => {
    it("set oracle", async () => {
      await ctx.Admin.methods
          .setOracle(tempAccount)
          .send(ctx.sendParam(ctx.Deployer));
      assert.equal(await ctx.Admin.methods._ORACLE_().call(), tempAccount);
    });

    it("set supervisor", async () => {
      await ctx.Admin.methods
          .setSupervisor(tempAccount)
          .send(ctx.sendParam(ctx.Deployer));
      assert.equal(await ctx.Admin.methods._SUPERVISOR_().call(), tempAccount);
    });

    it("set maintainer", async () => {
      await ctx.Admin.methods
          .setMaintainer(tempAccount)
          .send(ctx.sendParam(ctx.Deployer));
      assert.equal(await ctx.Admin.methods._MAINTAINER_().call(), tempAccount);
    });

    it("set liquidity provider fee rate", async () => {
      await ctx.Admin.methods
          .setLiquidityProviderFeeRate(decimalStr("0.01"))
          .send(ctx.sendParam(ctx.Deployer));
      assert.equal(
          await ctx.Admin.methods._LP_FEE_RATE_().call(),
          decimalStr("0.01")
      );
    });

    it("set maintainer fee rate", async () => {
      await ctx.Admin.methods
          .setMaintainerFeeRate(decimalStr("0.01"))
          .send(ctx.sendParam(ctx.Deployer));
      assert.equal(
          await ctx.Admin.methods._MT_FEE_RATE_().call(),
          decimalStr("0.01")
      );
    });

    it("set k", async () => {
      await ctx.Admin.methods
          .setK(decimalStr("0.2"))
          .send(ctx.sendParam(ctx.Deployer));
      assert.equal(await ctx.Admin.methods._K_().call(), decimalStr("0.2"));
    });

    it("set gas price limit", async () => {
      await ctx.Admin.methods
          .setGasPriceLimit(decimalStr("100"))
          .send(ctx.sendParam(ctx.Deployer));
      assert.equal(
          await ctx.Admin.methods._GAS_PRICE_LIMIT_().call(),
          decimalStr("100")
      );
    });
  });
})

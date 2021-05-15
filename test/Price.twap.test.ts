/*

    Copyright 2021 ParaPara
    SPDX-License-Identifier: Apache-2.0

*/


import {ParaContext, getParaContext} from './utils/Context';
import {decimalStr} from './utils/Converter';


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
  await ctx.mintTestToken(lp1, decimalStr("100000"));
  await ctx.mintTestToken(lp2, decimalStr("10000"));
  await ctx.mintTestToken(trader1, decimalStr("10000"));
  await ctx.mintTestToken(trader2, decimalStr("10000"));
  await ctx.mintTestToken(tempAccount, decimalStr("10000"));
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
  await ctx.Admin.methods
    .setInitialMarginRate(decimalStr("0.1"))
    .send(ctx.sendParam(ctx.Deployer));
  await ctx.Admin.methods
    .setMaintenanceMarginRate(decimalStr("0.05"))
    .send(ctx.sendParam(ctx.Deployer));
  await ctx.Admin.methods
    .setLiquidationPenaltyRate(decimalStr("0.01"))
    .send(ctx.sendParam(ctx.Deployer));
  await ctx.Admin.methods
    .setLiquidationPenaltyPoolRate(decimalStr("0.005"))
    .send(ctx.sendParam(ctx.Deployer));
  await ctx.Admin.methods
    .setPoolOpenTH(decimalStr("2"))
    .send(ctx.sendParam(ctx.Deployer));
  await ctx.Admin.methods
    .setPoolLiquidateTH(decimalStr("1"))
    .send(ctx.sendParam(ctx.Deployer));


  await ctx.Para.methods
    .collateralTraderTransferIn(lp1, decimalStr("100000"))
    .send(ctx.sendParam(lp1));
  await ctx.Para.methods
    .collateralTraderTransferIn(lp2, decimalStr("5000"))
    .send(ctx.sendParam(lp2));
  await ctx.Para.methods
    .collateralTraderTransferIn(trader1, decimalStr("1000"))
    .send(ctx.sendParam(trader1));
  await ctx.Para.methods
    .collateralTraderTransferIn(trader2, decimalStr("1000"))
    .send(ctx.sendParam(trader2));
  await ctx.Para.methods.depositCollateral(decimalStr("49900"))
    .send(ctx.sendParam(lp1));
  await ctx.Para.methods.depositCollateral(decimalStr("1200"))
    .send(ctx.sendParam(lp2));
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
    it("trading check", async () => {
        // console.log(await ctx.Para.methods._queryBuyBaseToken(decimalStr("1")).call());
        await ctx.EVM.fastMove(100)
        let [baseTarget, baseBalance, quoteTarget, quoteBalance,] = await ctx.Pricing.methods.getExpectedTarget().call();
        console.log('1. Balanced', baseTarget / 10 ** 18, baseBalance / 10 ** 18, quoteTarget / 10 ** 18, quoteBalance / 10 ** 18);
        console.log('2 pool margin account', await ctx.Para.methods._MARGIN_ACCOUNT_(poolAccount).call());

        await ctx.Para.methods.buyBaseToken(decimalStr("1"), decimalStr("1000")).send(ctx.sendParam(lp1));
        console.log('3 pool margin account after trade', await ctx.Para.methods._MARGIN_ACCOUNT_(poolAccount).call());

        await ctx.Para.methods.buyBaseToken(decimalStr("10"), decimalStr("100000")).send(ctx.sendParam(lp2));
        console.log('4 pool margin account after trade', await ctx.Para.methods._MARGIN_ACCOUNT_(poolAccount).call());

        console.log('4 getpoolMarginCashBalance', await ctx.Para.methods.getPoolMarginCashBalance().call());

      }
    )
  })
})

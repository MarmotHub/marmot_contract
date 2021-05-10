/*

    Copyright 2021 ParaPara
    SPDX-License-Identifier: Apache-2.0

*/

import BigNumber from 'bignumber.js';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

import * as contracts from './Contracts';
import { decimalStr, gweiStr, MAX_UINT256 } from './Converter';
import { EVM, getDefaultWeb3 } from './EVM';

BigNumber.config({
  EXPONENTIAL_AT: 1000,
  DECIMAL_PLACES: 80,
});

export interface ParaContextInitConfig {
  tokenName: string;
  lpFeeRate: string;
  mtFeeRate: string;
  k: string;
  gasPriceLimit: string;
}

/*
  price curve when k=0.1
  +──────────────────────+───────────────+
  | purchase percentage  | avg slippage  |
  +──────────────────────+───────────────+
  | 1%                   | 0.1%         |
  | 5%                   | 0.5%         |
  | 10%                  | 1.1%         |
  | 20%                  | 2.5%         |
  | 50%                  | 10%          |
  | 70%                  | 23.3%        |
  +──────────────────────+───────────────+
*/
export let DefaultParaContextInitConfig = {
  tokenName: "FANG",
  lpFeeRate: decimalStr("0.00"),
  mtFeeRate: decimalStr("0.00"),
  k: decimalStr("0.1"),
  gasPriceLimit: gweiStr("100"),
};

export class ParaContext {
  EVM: EVM;
  Web3: Web3;
  Para: Contract;
  ParaPlace: Contract;
  Admin: Contract;
  Pricing: Contract;
  Collateral: Contract;
  Collateral_Pool_Token: Contract;
  Oracle: Contract;
  PMMCurve: Contract;
  Deployer: string;
  Supervisor: string;
  Maintainer: string;
  spareAccounts: string[];

  constructor() {}

  async init(config: ParaContextInitConfig) {
    this.EVM = new EVM();
    this.Web3 = getDefaultWeb3();
    var cloneFactory = await contracts.newContract(
      contracts.CLONE_FACTORY_CONTRACT_NAME
    );
    this.Collateral = await contracts.newContract(
      contracts.ERC20MINTABLE_CONTRACT_NAME,
      ["TestUSDT", "TestUSDT"]
    );
    this.Oracle = await contracts.newContract(
      contracts.NAIVE_ORACLE_CONTRACT_NAME
    );

    const allAccounts = await this.Web3.eth.getAccounts();
    this.Deployer = allAccounts[0];
    this.Supervisor = allAccounts[1];
    this.Maintainer = allAccounts[2];
    this.spareAccounts = allAccounts.slice(3, 10);

    var ParaTemplate = await contracts.newContract(
      contracts.PARA_CONTRACT_NAME
    );

    var AdminTemplate = await contracts.newContract(
        contracts.ADMIN_CONTRACT_NAME
    );

    var PricingTemplate = await contracts.newContract(
        contracts.PRICING_CONTRACT_NAME
    );

    this.ParaPlace = await contracts.newContract(
      contracts.PARA_PLACE_CONTRACT_NAME,
      [
        ParaTemplate.options.address,
        AdminTemplate.options.address,
        PricingTemplate.options.address,
        cloneFactory.options.address,
        this.Supervisor,
      ]
    );


    await this.ParaPlace.methods
      .breedPara(
        this.Maintainer,
        this.Collateral.options.address,
        this.Oracle.options.address,
        config.tokenName,
        config.lpFeeRate,
        config.mtFeeRate,
        config.k,
        config.gasPriceLimit
      )
      .send(this.sendParam(this.Deployer));



    this.Para = contracts.getContractWithAddress(
      contracts.PARA_CONTRACT_NAME,
      await this.ParaPlace.methods
        .getPara(this.Oracle.options.address)
        .call()
    );

    this.Admin = contracts.getContractWithAddress(
        contracts.ADMIN_CONTRACT_NAME,
        await this.Para.methods.ADMIN().call()
    )

    this.Pricing = contracts.getContractWithAddress(
        contracts.PRICING_CONTRACT_NAME,
        await this.Para.methods.PRICING().call()
    )

    await this.Admin.methods
      .enableDeposit()
      .send(this.sendParam(this.Deployer));

    this.Collateral_Pool_Token = contracts.getContractWithAddress(
      contracts.LP_TOKEN_CONTRACT_NAME,
      await this.Para.methods._COLLATERAL_POOL_TOKEN_().call()
    );

  }

  sendParam(sender, value = "0") {
    return {
      from: sender,
      gas: process.env["COVERAGE"] ? 10000000000 : 7000000,
      gasPrice: process.env.GAS_PRICE,
      value: decimalStr(value),
    };
  }

  async setOraclePrice(price: string) {
    await this.Oracle.methods
      .setPrice(price)
      .send(this.sendParam(this.Deployer));
  }

  async mintTestToken(to: string, value: string) {
    await this.Collateral.methods.mint(to, value).send(this.sendParam(this.Deployer));
  }

  async approvePara(account: string) {
    await this.Collateral.methods
      .approve(this.Para.options.address, MAX_UINT256)
      .send(this.sendParam(account));
  }
}

export async function getParaContext(
  config: ParaContextInitConfig = DefaultParaContextInitConfig
): Promise<ParaContext> {
  var context = new ParaContext();
  console.log('contxt', context);
  await context.init(config);
  return context;
}

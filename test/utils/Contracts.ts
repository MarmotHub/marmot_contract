/*

    Copyright 2021 ParaPara
    SPDX-License-Identifier: Apache-2.0

*/
var jsonPath: string = "../../build/contracts/"


const CloneFactory = require(`${jsonPath}CloneFactory.json`)
const Para = require(`${jsonPath}Para.json`)
const ParaPlace = require(`${jsonPath}ParaPlace.json`)
const ERC20 = require(`${jsonPath}ERC20.json`)
const ERC20Mintable = require(`${jsonPath}ERC20Mintable.json`)
const NaiveOracle = require(`${jsonPath}NaiveOracle.json`)
const LpToken = require(`${jsonPath}LpToken.json`)
const PMMCurve = require(`${jsonPath}PMMCurve.json`)
const Admin = require(`${jsonPath}Admin.json`)
const Pricing = require(`${jsonPath}Pricing.json`)

import { getDefaultWeb3 } from './EVM';
import { Contract } from 'web3-eth-contract';

export const CLONE_FACTORY_CONTRACT_NAME = "CloneFactory"
export const PARA_CONTRACT_NAME = "Para"
export const ERC20_CONTRACT_NAME = "ERC20"
export const ERC20MINTABLE_CONTRACT_NAME = "ERC20Mintable"
export const NAIVE_ORACLE_CONTRACT_NAME = "NaiveOracle"
export const LP_TOKEN_CONTRACT_NAME = "LpToken"
export const PARA_PLACE_CONTRACT_NAME = "ParaPlace"
export const PMM_CURVE_CONTRACT_NAME = "PMMCurve"
export const ADMIN_CONTRACT_NAME = "Admin"
export const PRICING_CONTRACT_NAME = "Pricing"

var contractMap: { [name: string]: any } = {}
contractMap[CLONE_FACTORY_CONTRACT_NAME] = CloneFactory
contractMap[PARA_CONTRACT_NAME] = Para
contractMap[ERC20_CONTRACT_NAME] = ERC20
contractMap[ERC20MINTABLE_CONTRACT_NAME] = ERC20Mintable
contractMap[NAIVE_ORACLE_CONTRACT_NAME] = NaiveOracle
contractMap[LP_TOKEN_CONTRACT_NAME] = LpToken
contractMap[PARA_PLACE_CONTRACT_NAME] = ParaPlace
contractMap[PMM_CURVE_CONTRACT_NAME] = PMMCurve
contractMap[ADMIN_CONTRACT_NAME] = Admin
contractMap[PRICING_CONTRACT_NAME] = Pricing

interface ContractJson {
  abi: any;
  networks: { [network: number]: any };
  byteCode: string;
}

export function getContractJSON(contractName: string): ContractJson {
  var info = contractMap[contractName]
  return {
    abi: info.abi,
    networks: info.networks,
    byteCode: info.bytecode
  }
}

export function getContractWithAddress(contractName: string, address: string) {
  var Json = getContractJSON(contractName)
  var web3 = getDefaultWeb3()
  return new web3.eth.Contract(Json.abi, address)
}

export function getDepolyedContract(contractName: string): Contract {
  var Json = getContractJSON(contractName)
  var networkId = process.env.NETWORK_ID
  var deployedAddress = getContractJSON(contractName).networks[networkId].address
  var web3 = getDefaultWeb3()
  return new web3.eth.Contract(Json.abi, deployedAddress)
}

export async function newContract(contractName: string, args: any[] = []): Promise<Contract> {
  var web3 = getDefaultWeb3()
  var Json = getContractJSON(contractName)
  var contract = new web3.eth.Contract(Json.abi)
  var adminAccount = (await web3.eth.getAccounts())[0]
  let parameter = {
    from: adminAccount,
    gas: 10000000000,
    gasPrice: web3.utils.toHex(web3.utils.toWei('1', 'wei'))
  }
  var newC = await contract.deploy({ data: Json.byteCode, arguments: args }).send(parameter)
  return newC
}
import { Contract, ContractFactory } from '@ethersproject/contracts';
import { TransactionResponse } from '@ethersproject/abstract-provider';
import { ethers, ContractInterface, Signer, utils } from 'ethers';
import { getStatic, ParamType } from 'ethers/lib/utils';

export const deploy = async (contract: ContractFactory, args: any[]): Promise<{ tx: TransactionResponse; contract: Contract }> => {
  const deploymentTransactionRequest = await contract.getDeployTransaction(...args);
  const deploymentTx = await contract.signer.sendTransaction(deploymentTransactionRequest);
  const contractAddress = getStatic<(deploymentTx: TransactionResponse) => string>(contract.constructor, 'getContractAddress')(deploymentTx);
  const deployedContract = getStatic<(contractAddress: string, contractInterface: ContractInterface, signer?: Signer) => Contract>(
    contract.constructor,
    'getContract'
  )(contractAddress, contract.interface, contract.signer);
  return {
    tx: deploymentTx,
    contract: deployedContract,
  };
};

export const getCreationCode = ({
  bytecode,
  constructorArgs,
}: {
  bytecode: string;
  constructorArgs: { types: string[] | ParamType[]; values: any[] };
}): string => {
  return `${bytecode}${ethers.utils.defaultAbiCoder.encode(constructorArgs.types, constructorArgs.values).slice(2)}`;
};

export const getCreate3Address = ({ create3FactoryAddress, salt }: { create3FactoryAddress: string; salt: string }): string => {
  const PROXY_BYTECODE = `0x67363d3d37363d34f03d5260086018f3`;
  const PROXY_BYTECODE_HASH = utils.keccak256(PROXY_BYTECODE);
  const proxyAddress = utils.getAddress(
    utils.keccak256(`0xFF${create3FactoryAddress.slice(2)}${salt.slice(2)}${PROXY_BYTECODE_HASH.slice(2)}`).slice(26)
  );
  const deploymentAddress = utils.getAddress(utils.keccak256(`0xd694${proxyAddress.slice(2)}01`).slice(26));
  return deploymentAddress;
};

import hre, { ethers } from 'hardhat';
import { abi as DETERMINISTIC_FACTORY_ABI } from '../artifacts/solidity/contracts/DeterministicFactory.sol/DeterministicFactory.json';
import { PayableOverrides, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ParamType } from 'ethers/lib/utils';
import { ArtifactData, DeployResult } from '@0xged/hardhat-deploy/types';

export const getCreationCode = ({
  bytecode,
  constructorArgs,
}: {
  bytecode: string;
  constructorArgs: { types: string[] | ParamType[]; values: any[] };
}): string => {
  return `${bytecode}${ethers.utils.defaultAbiCoder.encode(constructorArgs.types, constructorArgs.values).slice(2)}`;
};

export const deployThroughDeterministicFactory = async ({
  deployer,
  deployerSigner,
  name,
  salt,
  contract,
  bytecode,
  constructorArgs,
  log,
  skipIfAlreadyDeployed,
  overrides,
}: {
  deployer?: string;
  deployerSigner?: SignerWithAddress;
  name: string;
  salt: string;
  contract: string | ArtifactData;
  bytecode: string;
  constructorArgs: { types: string[] | ParamType[]; values: any[] };
  log?: boolean;
  skipIfAlreadyDeployed?: boolean;
  overrides?: PayableOverrides;
}): Promise<DeployResult> => {
  if (!!deployer && !!deployerSigner && deployerSigner.address != deployer) throw new Error('Deployer and deployer signer dont match');
  if (!deployerSigner) {
    if (!deployer) throw Error('Deployer, or deployer signer must be passed');
    deployerSigner = await ethers.getSigner(deployer);
  }

  const existingDeployment = await hre.deployments.getOrNull(name);
  if (!!existingDeployment) {
    if (skipIfAlreadyDeployed === undefined || skipIfAlreadyDeployed === null || skipIfAlreadyDeployed) {
      if (log) console.log(`Reusing deployment of ${name} at ${existingDeployment.address}`);
      return { ...existingDeployment, newlyDeployed: false };
    }
    if (!skipIfAlreadyDeployed) {
      if (log) console.log(`Removing ${name} old deployment at ${existingDeployment.address}`);
      await hre.deployments.delete(name);
    }
  }

  const deterministicFactory = await ethers.getContractAt(DETERMINISTIC_FACTORY_ABI, '0xbb681d77506df5CA21D2214ab3923b4C056aa3e2');

  const saltAsBytes = utils.formatBytes32String(salt);

  const creationCode = getCreationCode({
    bytecode,
    constructorArgs,
  });

  const deploymentAddress = await deterministicFactory.getDeployed(saltAsBytes);

  const deploymentTx = await deterministicFactory.connect(deployerSigner).deploy(
    saltAsBytes, // SALT
    creationCode,
    0, // Value
    { ...overrides }
  );

  if (log) console.log(`deploying "${name}" (tx: ${deploymentTx.hash}) at ${deploymentAddress}`);

  const receipt = await deploymentTx.wait();

  const deployment = await hre.deployments.buildDeploymentSubmission({
    name,
    contractAddress: deploymentAddress,
    options: {
      contract,
      from: deployerSigner.address!,
      args: constructorArgs.values,
    },
    receipt,
  });

  await hre.deployments.save(name, deployment);

  return { ...deployment, newlyDeployed: true };
};

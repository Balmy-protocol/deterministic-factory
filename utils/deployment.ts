import hre, { ethers } from 'hardhat';
import { abi as DETERMINISTIC_FACTORY_ABI } from '../artifacts/solidity/contracts/DeterministicFactory.sol/DeterministicFactory.json';
import { PayableOverrides, utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { hexlify, ParamType } from 'ethers/lib/utils';
import { ArtifactData, DeployResult } from '@0xged/hardhat-deploy/types';

const DEFAULT_DETERMINISTIC_FACTORY_ADDRESS = '0xD420ea5a1981dB5f1914954CE6e012A3bB10c015';
const DETERMINISTIC_FACTORY_ADDRESS: { [chainId: number]: string } = {
  30: '0xc11154859da6854E1C2A0826a45abe4E6A2eD46A',
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

  const chainId = (await deployerSigner.provider!.getNetwork()).chainId;

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

  const deterministicFactory = await ethers.getContractAt(
    DETERMINISTIC_FACTORY_ABI,
    DETERMINISTIC_FACTORY_ADDRESS[chainId] || DEFAULT_DETERMINISTIC_FACTORY_ADDRESS
  );

  const saltToUse = process.env.USE_RANDOM_SALT === 'true' ? hexlify(utils.randomBytes(10)) : salt;
  const saltAsBytes = utils.formatBytes32String(saltToUse);

  const creationCode = getCreationCode({
    bytecode,
    constructorArgs,
  });

  const deploymentAddress = await deterministicFactory.getDeployed(saltAsBytes);
  const deployedBytecode = await ethers.provider.getCode(deploymentAddress);

  let receipt: any;
  if (!existingDeployment && deployedBytecode !== '0x') {
    // For some reason previous deployment wasn't saved
    if (log) console.log(`deployment "${name}" at ${deploymentAddress} was not saved, re-fetching`);
  } else {
    await deterministicFactory.connect(deployerSigner).callStatic.deploy(
      saltAsBytes, // SALT
      creationCode,
      0, // Value
      { ...overrides }
    );

    const deploymentTx = await deterministicFactory.connect(deployerSigner).deploy(
      saltAsBytes, // SALT
      creationCode,
      0, // Value
      { ...overrides }
    );

    if (log) console.log(`deploying "${name}" (tx: ${deploymentTx.hash}) at ${deploymentAddress}`);

    receipt = await deploymentTx.wait();
  }

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

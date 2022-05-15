import hre, { ethers } from 'hardhat';
import { DeterministicFactory, DeterministicFactory__factory } from '../typechained';
import { utils } from 'ethers';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import { ParamType } from 'ethers/lib/utils';
import { ArtifactData } from '@0xged/hardhat-deploy/types';

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
}: {
  deployer?: string;
  deployerSigner?: SignerWithAddress;
  name: string;
  salt: string;
  contract: string | ArtifactData;
  bytecode: string;
  constructorArgs: { types: string[] | ParamType[]; values: any[] };
}): Promise<void> => {
  if (!!deployer && !!deployerSigner && deployerSigner.address != deployer) throw new Error('Deployer and deployer signer dont match');
  if (!deployerSigner) {
    if (!deployer) throw Error('Deployer, or deployer signer must be passed');
    deployerSigner = await ethers.getSigner(deployer);
  }

  const deterministicFactory = await ethers.getContractAt<DeterministicFactory>(
    DeterministicFactory__factory.abi,
    '0xbb681d77506df5CA21D2214ab3923b4C056aa3e2'
  );

  const saltAsBytes = utils.formatBytes32String(salt);

  const creationCode = getCreationCode({
    bytecode,
    constructorArgs,
  });

  const deploymentAddress = await deterministicFactory.getDeployed(saltAsBytes);

  const deploymentTx = await deterministicFactory.connect(deployerSigner).deploy(
    saltAsBytes, // SALT
    creationCode,
    0 // Value
  );

  console.log(`deploying "${name}" (tx: ${deploymentTx.hash}) at ${deploymentAddress}`);

  const receipt = await deploymentTx.wait();

  const deployment = await hre.deployments.buildDeploymentSubmission({
    name,
    contractAddress: deploymentAddress,
    options: {
      contract,
      from: deployerSigner.address!,
      args: constructorArgs.values,
      log: true,
    },
    receipt,
  });

  await hre.deployments.save(name, deployment);
};

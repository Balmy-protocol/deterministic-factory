import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from '@0xged/hardhat-deploy/types';
import { shouldVerifyContract } from '../utils/deploy';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, balmyDeployer, msig } = await hre.getNamedAccounts();

  const deploy = await hre.deployments.deploy('DeterministicFactory', {
    contract: 'solidity/contracts/DeterministicFactory.sol:DeterministicFactory',
    from: deployer,
    args: [msig, balmyDeployer],
    log: true,
    gasLimit: 3_800_000,
  });

  if (await shouldVerifyContract(deploy)) {
    await hre.run('verify:verify', {
      address: deploy.address,
      constructorArguments: [msig, balmyDeployer],
    });
  }
};

deployFunction.dependencies = [];
deployFunction.tags = ['DeterministicFactory'];
export default deployFunction;

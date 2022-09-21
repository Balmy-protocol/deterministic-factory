import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from '@0xged/hardhat-deploy/types';
import { shouldVerifyContract } from '../utils/deploy';

const deployFunction: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer, meanDeployer, msig } = await hre.getNamedAccounts();

  const deploy = await hre.deployments.deploy('DeterministicFactory', {
    contract: 'solidity/contracts/DeterministicFactory.sol:DeterministicFactory',
    from: deployer,
    args: [msig, meanDeployer],
    log: true,
  });

  if (await shouldVerifyContract(deploy)) {
    await hre.run('verify:verify', {
      address: deploy.address,
      constructorArguments: [msig, meanDeployer],
    });
  }
};

deployFunction.dependencies = [];
deployFunction.tags = ['DeterministicFactory'];
export default deployFunction;

import { constants } from 'ethers';
import { deployments, ethers } from 'hardhat';
import { then, when } from '@utils/bdd';
import { DeterministicFactory, ERC20Mock, ERC20Mock__factory } from '@typechained';
import { expect } from 'chai';
import { randomHex } from 'web3-utils';
import { getCreationCode } from '@utils/contracts';
import { SnapshotRestorer, takeSnapshot } from '@nomicfoundation/hardhat-network-helpers';

// This has all been tested in solmate's repo, but I don't want to be left out
describe('DeterministicFactory', () => {
  let deterministicFactoryContract: DeterministicFactory;
  let snapshot: SnapshotRestorer;

  before(async () => {
    await deployments.run(['DeterministicFactory']);
    deterministicFactoryContract = await ethers.getContract<DeterministicFactory>('DeterministicFactory');
    snapshot = await takeSnapshot();
  });

  beforeEach(async () => {
    await snapshot.restore();
  });

  when('we deploy on a normal workflow', () => {
    then('deploys and gets contract correctly', async () => {
      const ERC20DeploymentSalt = randomHex(32);
      await deterministicFactoryContract.deploy(
        ERC20DeploymentSalt,
        getCreationCode({
          bytecode: ERC20Mock__factory.bytecode,
          constructorArgs: {
            types: ['bool', 'string', 'string'],
            values: [false, 'gname', 'gsymbol'],
          },
        }),
        constants.Zero
      );
      const ERC20Contract = await ethers.getContractAt<ERC20Mock>(
        ERC20Mock__factory.abi,
        await deterministicFactoryContract.getDeployed(ERC20DeploymentSalt)
      );
      expect(await ERC20Contract.name()).to.equal('gname');
      expect(await ERC20Contract.symbol()).to.equal('gsymbol');
    });
  });
  when('deployed on different chains', () => {
    // Can't test this until hardhat lets forks have a diff. chainId
    then.skip('addresses are the same');
  });
});

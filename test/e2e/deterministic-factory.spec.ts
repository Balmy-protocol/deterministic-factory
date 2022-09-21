import { TransactionResponse } from '@ethersproject/abstract-provider';
import { BigNumber, constants, utils } from 'ethers';
import { deployments, ethers, getNamedAccounts } from 'hardhat';
import { evm } from '@utils';
import { then, when } from '@utils/bdd';
import { DeterministicFactory, ERC20Mock, ERC20Mock__factory } from '@typechained';
import { expect } from 'chai';
import { randomHex } from 'web3-utils';
import { getCreationCode } from '@utils/contracts';
import { JsonRpcSigner } from '@ethersproject/providers';
import { impersonate, setBalance } from '@utils/wallet';

// This has all been tested in solmate's repo, but I don't want to be left out
describe('DeterministicFactory', () => {
  let deterministicFactoryContract: DeterministicFactory;
  let snapshotId: string;
  let meanDeployer: JsonRpcSigner;

  before(async () => {
    await deployments.run(['DeterministicFactory']);
    deterministicFactoryContract = await ethers.getContract<DeterministicFactory>('DeterministicFactory');
    const namedAccounts = await getNamedAccounts();
    meanDeployer = await impersonate(namedAccounts.meanDeployer);
    await setBalance({ account: namedAccounts.meanDeployer, balance: constants.MaxUint256 });
    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  when('we deploy on a normal workflow', () => {
    then('deploys and gets contract correctly', async () => {
      const ERC20DeploymentSalt = randomHex(32);
      await deterministicFactoryContract.connect(meanDeployer).deploy(
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

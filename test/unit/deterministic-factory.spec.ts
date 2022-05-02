import { TransactionResponse } from '@ethersproject/abstract-provider';
import { BigNumber, constants, utils } from 'ethers';
import { ethers } from 'hardhat';
import { evm } from '@utils';
import { given, then, when } from '@utils/bdd';
import { expect } from 'chai';
import { DeterministicFactory, DeterministicFactory__factory, ERC20Mock, ERC20Mock__factory } from '@typechained';
import { randomHex } from 'web3-utils';
import { getCreationCode } from '@utils/contracts';

describe('DeterministicFactory', () => {
  // FactoryFactory yikes
  let deterministicFactoryFactory: DeterministicFactory__factory;
  let deterministicFactoryContract: DeterministicFactory;
  let snapshotId: string;

  const firstSalt = randomHex(32);
  const firstCreationCode = getCreationCode({
    bytecode: ERC20Mock__factory.bytecode,
    constructorArgs: {
      types: ['bool', 'string', 'string'],
      values: [false, 'gname', 'gsymbol'],
    },
  });

  before(async () => {
    deterministicFactoryFactory = await ethers.getContractFactory('solidity/contracts/DeterministicFactory.sol:DeterministicFactory');
    deterministicFactoryContract = await deterministicFactoryFactory.deploy();
    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  describe('deploy', () => {
    testDeterministicDeploymentReverts({
      message: 'deploying same bytecode and salt',
      context: () => firstDeployment(),
      creationCode: firstCreationCode,
      salt: firstSalt,
      value: constants.Zero,
      revertMessage: 'DEPLOYMENT_FAILED',
    });

    testDeterministicDeploymentReverts({
      message: 'deploying different bytecode but same salt',
      context: () => firstDeployment(),
      creationCode: getCreationCode({
        bytecode: ERC20Mock__factory.bytecode,
        constructorArgs: {
          types: ['bool', 'string', 'string'],
          values: [false, 'g2name', 'g2symbol'],
        },
      }),
      salt: firstSalt,
      value: constants.Zero,
      revertMessage: 'DEPLOYMENT_FAILED',
    });

    testDeterministicDeploymentReverts({
      message: 'ether sent and value mismatch',
      creationCode: getCreationCode({
        bytecode: ERC20Mock__factory.bytecode,
        constructorArgs: {
          types: ['bool', 'string', 'string'],
          values: [false, 'gname', 'gsymbol'],
        },
      }),
      salt: firstSalt,
      value: utils.parseEther('1'),
      valueSent: constants.Zero,
      revertMessage: 'INITIALIZATION_FAILED',
    });

    testDeterministicDeploymentReverts({
      message: 'contract being deployed reverts on constructor',
      creationCode: getCreationCode({
        bytecode: ERC20Mock__factory.bytecode,
        constructorArgs: {
          types: ['bool', 'string', 'string'],
          values: [true, 'gname', 'gsymbol'],
        },
      }),
      salt: firstSalt,
      value: constants.Zero,
      revertMessage: 'INITIALIZATION_FAILED',
    });

    when('sending ETH to deployment', () => {
      const etherSent = utils.parseEther('1');
      let initialBalance: BigNumber;
      let deploymentAddress: string;
      given(async () => {
        deploymentAddress = await deterministicFactoryContract.callStatic.deploy(firstSalt, firstCreationCode, etherSent, {
          value: etherSent,
        });
        initialBalance = await ethers.provider.getBalance(deploymentAddress);
        await deterministicFactoryContract.deploy(firstSalt, firstCreationCode, etherSent, {
          value: etherSent,
        });
      });
      then('ETH gets sent to deployed contract', async () => {
        expect(initialBalance.add(await ethers.provider.getBalance(deploymentAddress))).to.equal(etherSent);
      });
    });

    when('deploying same bytecode but different salt', () => {
      let firstERC20: ERC20Mock;
      let secondERC20: ERC20Mock;
      given(async () => {
        const firstAddress = await deterministicFactoryContract.callStatic.deploy(firstSalt, firstCreationCode, constants.Zero);
        firstERC20 = await ethers.getContractAt<ERC20Mock>(ERC20Mock__factory.abi, firstAddress);
        await deterministicFactoryContract.deploy(firstSalt, firstCreationCode, constants.Zero);
        const secondSalt = randomHex(32);
        const secondAddress = await deterministicFactoryContract.callStatic.deploy(secondSalt, firstCreationCode, constants.Zero);
        secondERC20 = await ethers.getContractAt<ERC20Mock>(ERC20Mock__factory.abi, secondAddress);
        await deterministicFactoryContract.deploy(secondSalt, firstCreationCode, constants.Zero);
      });
      then('deploys same contract on different addresses', async () => {
        expect(await firstERC20.name()).to.equal(await secondERC20.name());
        expect(await firstERC20.symbol()).to.equal(await secondERC20.symbol());
      });
    });
  });

  function firstDeployment() {
    return deterministicFactoryContract.deploy(firstSalt, firstCreationCode, constants.Zero);
  }

  function testDeterministicDeploymentReverts({
    message,
    context,
    salt,
    creationCode,
    value,
    valueSent,
    revertMessage,
  }: {
    message: string;
    context?: () => Promise<any>;
    salt: string;
    creationCode: string;
    value: BigNumber;
    valueSent?: BigNumber;
    revertMessage: string;
  }) {
    let deploymentTx: Promise<TransactionResponse>;
    when(message, () => {
      given(async () => {
        if (context) await context();
        deploymentTx = deterministicFactoryContract.deploy(salt, creationCode, value, {
          value: valueSent ?? value,
        });
      });
      then(`tx gets reverted with ${revertMessage}`, async () => {
        await expect(deploymentTx).to.be.revertedWith(revertMessage);
      });
    });
  }
});

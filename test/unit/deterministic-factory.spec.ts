import { TransactionResponse } from '@ethersproject/abstract-provider';
import { BigNumber, constants, utils } from 'ethers';
import { ethers } from 'hardhat';
import { evm } from '@utils';
import { given, then, when } from '@utils/bdd';
import { expect } from 'chai';
import { DeterministicFactory, DeterministicFactory__factory, ERC20Mock, ERC20Mock__factory } from '@typechained';
import { randomHex } from 'web3-utils';
import { getCreate3Address, getCreationCode } from '@utils/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('DeterministicFactory', () => {
  // FactoryFactory yikes
  let deterministicFactoryFactory: DeterministicFactory__factory;
  let deterministicFactoryContract: DeterministicFactory;

  let deployer: SignerWithAddress;
  let admin: SignerWithAddress;

  let snapshotId: string;

  const firstSalt = randomHex(32);
  const firstCreationCode = getCreationCode({
    bytecode: ERC20Mock__factory.bytecode,
    constructorArgs: {
      types: ['bool', 'string', 'string'],
      values: [false, 'gname', 'gsymbol'],
    },
  });

  const ADMIN_ROLE = utils.keccak256(utils.toUtf8Bytes('ADMIN_ROLE'));
  const DEPLOYER_ROLE = utils.keccak256(utils.toUtf8Bytes('DEPLOYER_ROLE'));

  before(async () => {
    [deployer, admin] = await ethers.getSigners();
    deterministicFactoryFactory = await ethers.getContractFactory('solidity/contracts/DeterministicFactory.sol:DeterministicFactory');
    deterministicFactoryContract = await deterministicFactoryFactory.deploy(admin.address, deployer.address);
    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  describe('constructor', () => {
    when('deployment is valid', () => {
      then('ADMIN_ROLE is role admin for ADMIN_ROLE', async () => {
        const adminOfAdminRole = await deterministicFactoryContract.getRoleAdmin(ADMIN_ROLE);
        expect(adminOfAdminRole).to.equal(ADMIN_ROLE);
      });
      then('ADMIN_ROLE is role admin for DEPLOYER_ROLE', async () => {
        const adminOfDeployerRole = await deterministicFactoryContract.getRoleAdmin(DEPLOYER_ROLE);
        expect(adminOfDeployerRole).to.equal(ADMIN_ROLE);
      });
      then('admin is set', async () => {
        expect(await deterministicFactoryContract.hasRole(ADMIN_ROLE, admin.address)).to.be.true;
      });
      then('deployer is set', async () => {
        expect(await deterministicFactoryContract.hasRole(DEPLOYER_ROLE, deployer.address)).to.be.true;
      });
    });
  });

  describe('deploy', () => {
    when('not being called from a deployer', () => {
      then('tx gets reverted with access control message', async () => {
        await expect(deterministicFactoryContract.connect(admin).deploy(firstSalt, firstCreationCode, 0)).to.be.revertedWith(
          `AccessControl: account ${admin.address.toLowerCase()} is missing role ${DEPLOYER_ROLE}`
        );
      });
    });

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
        deploymentAddress = getCreate3Address({
          create3FactoryAddress: deterministicFactoryContract.address,
          salt: firstSalt,
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
        const firstAddress = getCreate3Address({
          create3FactoryAddress: deterministicFactoryContract.address,
          salt: firstSalt,
        });
        firstERC20 = await ethers.getContractAt<ERC20Mock>(ERC20Mock__factory.abi, firstAddress);
        await deterministicFactoryContract.deploy(firstSalt, firstCreationCode, constants.Zero);
        const secondSalt = randomHex(32);
        const secondAddress = getCreate3Address({
          create3FactoryAddress: deterministicFactoryContract.address,
          salt: secondSalt,
        });
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

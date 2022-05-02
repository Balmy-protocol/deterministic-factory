import { TransactionResponse } from '@ethersproject/abstract-provider';
import { BigNumber, utils } from 'ethers';
import { ethers } from 'hardhat';
import { evm, wallet } from '@utils';
import { given, then, when } from '@utils/bdd';
import { expect } from 'chai';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';

describe('DeterministicFactory', () => {
  let stranger: SignerWithAddress;
  let snapshotId: string;

  before(async () => {
    [stranger] = await ethers.getSigners();
    snapshotId = await evm.snapshot.take();
  });

  beforeEach(async () => {
    await evm.snapshot.revert(snapshotId);
  });

  then('we test everything');
});

// SPDX-License-Identifier: UNLICENSED
pragma solidity 0.8.7;

import '@openzeppelin/contracts/token/ERC20/ERC20.sol';
import 'hardhat/console.sol';

contract ERC20Mock is ERC20 {
  error Boom();

  constructor(
    bool _revert,
    string memory _name,
    string memory _symbol
  ) payable ERC20(_name, _symbol) {
    if (_revert) revert Boom();
  }
}

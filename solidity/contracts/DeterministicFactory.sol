// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.7;

import {CREATE3} from '@rari-capital/solmate/src/utils/CREATE3.sol';
import {IDeterministicFactory} from '../interfaces/IDeterministicFactory.sol';

contract DeterministicFactory is IDeterministicFactory {
  /// @inheritdoc IDeterministicFactory
  function deploy(
    bytes32 _salt,
    bytes memory _creationCode,
    uint256 _value
  ) external payable override returns (address _deployed) {
    _deployed = CREATE3.deploy(_salt, _creationCode, _value);
  }

  /// @inheritdoc IDeterministicFactory
  function getDeployed(bytes32 _salt) external view override returns (address) {
    return CREATE3.getDeployed(_salt);
  }
}

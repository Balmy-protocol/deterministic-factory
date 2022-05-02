// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.7;

interface IDeterministicFactory {
  function deploy(
    bytes32 _salt,
    bytes memory _creationCode,
    uint256 _value
  ) external returns (address _deployed);

  function getDeployed(bytes32 _salt) external view returns (address _deployed);
}

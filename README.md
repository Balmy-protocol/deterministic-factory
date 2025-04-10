# Deterministic Factory

This is an open factory of smart contracts with deterministic addresses. Based on [t11s](https://github.com/transmissions11) awesome [CREATE3 library](https://github.com/Rari-Capital/solmate/blob/main/src/utils/CREATE3.sol).

## But why?

We all love having the same address for our smart contracts across different chains. This is a tool for that.

## Usage

You can see how it can be used under the [end to end tests](./test/e2e).

## Package

The package will contain:

- Compatible deployments for [hardhat-deploy]() plugin under the `@balmy/deterministic-factory/deployments` folder.
- Typescript smart contract typings under `@balmy/deterministic-factory/typechained`

## Installation

To install with [**Hardhat**](https://github.com/nomiclabs/hardhat) or [**Truffle**](https://github.com/trufflesuite/truffle):

```sh
npm install @balmy/deterministic-factory
```

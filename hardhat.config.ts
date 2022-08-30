import 'dotenv/config';
import '@nomicfoundation/hardhat-toolbox';
import '@typechain/hardhat';
import '@0xged/hardhat-deploy';
import 'tsconfig-paths/register';
import 'hardhat-gas-reporter';
import './tasks/npm-publish-clean-typechain';
import { removeConsoleLog } from 'hardhat-preprocessor';
import { HardhatUserConfig, MultiSolcUserConfig, NetworksUserConfig } from 'hardhat/types';
import * as env from './utils/env';

const networks: NetworksUserConfig =
  env.isHardhatCompile() || env.isHardhatClean() || env.isTesting()
    ? {}
    : {
        hardhat: {},
        ['ethereum-ropsten']: {
          url: env.getNodeUrl('ethereum-ropsten'),
          accounts: env.getAccounts('ethereum-ropsten'),
        },
        ['ethereum-rinkeby']: {
          url: env.getNodeUrl('ethereum-rinkeby'),
          accounts: env.getAccounts('ethereum-rinkeby'),
        },
        ['ethereum-kovan']: {
          url: env.getNodeUrl('ethereum-kovan'),
          accounts: env.getAccounts('ethereum-kovan'),
        },
        ['ethereum-goerli']: {
          url: env.getNodeUrl('ethereum-goerli'),
          accounts: env.getAccounts('ethereum-goerli'),
        },
        ethereum: {
          url: env.getNodeUrl('ethereum'),
          accounts: env.getAccounts('ethereum'),
        },
        optimism: {
          url: env.getNodeUrl('optimism'),
          accounts: env.getAccounts('optimism'),
        },
        ['optimism-kovan']: {
          url: env.getNodeUrl('optimism-kovan'),
          accounts: env.getAccounts('optimism-kovan'),
        },
        arbitrum: {
          url: env.getNodeUrl('arbitrum'),
          accounts: env.getAccounts('arbitrum'),
        },
        ['arbitrum-rinkeby']: {
          url: env.getNodeUrl('arbitrum-rinkeby'),
          accounts: env.getAccounts('arbitrum-rinkeby'),
        },
        polygon: {
          url: env.getNodeUrl('polygon'),
          accounts: env.getAccounts('polygon'),
        },
        ['polygon-mumbai']: {
          url: env.getNodeUrl('polygon-mumbai'),
          accounts: env.getAccounts('polygon-mumbai'),
        },
      };

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: {
      default: 0,
    },
    admin: '0x1a00e1e311009e56e3b0b9ed6f86f5ce128a1c01',
  },
  mocha: {
    timeout: process.env.MOCHA_TIMEOUT || 300000,
  },
  networks,
  solidity: {
    compilers: [
      {
        version: '0.8.7',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  gasReporter: {
    currency: process.env.COINMARKETCAP_DEFAULT_CURRENCY || 'USD',
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
    enabled: process.env.REPORT_GAS ? true : false,
    showMethodSig: true,
    onlyCalledMethods: false,
  },
  preprocess: {
    eachLine: removeConsoleLog((hre) => hre.network.name !== 'hardhat'),
  },
  etherscan: {
    apiKey: env.getEtherscanAPIKeys([
      'ethereum-ropsten',
      'ethereum-rinkeby',
      'ethereum-kovan',
      'ethereum-goerli',
      'ethereum',
      'optimism',
      'optimism-kovan',
      'arbitrum',
      'arbitrum-rinkeby',
      'polygon',
      'polygon-mumbai',
    ]),
  },
  typechain: {
    outDir: 'typechained',
    target: 'ethers-v5',
  },
  paths: {
    sources: './solidity',
  },
};

if (process.env.TEST) {
  (config.solidity as MultiSolcUserConfig).compilers = (config.solidity as MultiSolcUserConfig).compilers.map((compiler) => {
    return {
      ...compiler,
      outputSelection: {
        '*': {
          '*': ['storageLayout'],
        },
      },
    };
  });
}

export default config;

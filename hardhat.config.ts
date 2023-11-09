import 'dotenv/config';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-etherscan';
import '@typechain/hardhat';
import '@typechain/hardhat/dist/type-extensions';
import { removeConsoleLog } from 'hardhat-preprocessor';
import 'hardhat-gas-reporter';
import '@0xged/hardhat-deploy';
import './tasks/npm-publish-clean-typechain';
import 'solidity-coverage';
import { HardhatUserConfig, MultiSolcUserConfig, NetworksUserConfig } from 'hardhat/types';
import * as env from './utils/env';
import 'tsconfig-paths/register';

const networks: NetworksUserConfig =
  env.isHardhatCompile() || env.isHardhatClean() || env.isTesting()
    ? {}
    : {
        hardhat: {},
        ethereum: {
          url: env.getNodeUrl('ethereum'),
          accounts: env.getAccounts('ethereum'),
        },
        ['ethereum-goerli']: {
          url: env.getNodeUrl('ethereum-goerli'),
          accounts: env.getAccounts('ethereum-goerli'),
        },
        ['ethereum-sepolia']: {
          url: env.getNodeUrl('ethereum-sepolia'),
          accounts: env.getAccounts('ethereum-sepolia'),
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
        avalanche: {
          url: env.getNodeUrl('avalanche'),
          accounts: env.getAccounts('avalanche'),
        },
        ['avalanche-fuji']: {
          url: env.getNodeUrl('avalanche-fuji'),
          accounts: env.getAccounts('avalanche-fuji'),
        },
        bnb: {
          url: env.getNodeUrl('bnb'),
          accounts: env.getAccounts('bnb'),
        },
        ['bnb-testnet']: {
          url: env.getNodeUrl('bnb-testnet'),
          accounts: env.getAccounts('bnb-testnet'),
        },
        fantom: {
          url: env.getNodeUrl('fantom'),
          accounts: env.getAccounts('fantom'),
        },
        ['fantom-testnet']: {
          url: env.getNodeUrl('fantom-testnet'),
          accounts: env.getAccounts('fantom-testnet'),
        },
        ['base-goerli']: {
          url: env.getNodeUrl('base-goerli'),
          accounts: env.getAccounts('base-goerli'),
        },
        ['base']: {
          url: env.getNodeUrl('base'),
          accounts: env.getAccounts('base'),
        },
        ['gnosis']: {
          url: env.getNodeUrl('gnosis'),
          accounts: env.getAccounts('gnosis'),
        },
        ['rootstock']: {
          url: env.getNodeUrl('rootstock'),
          accounts: env.getAccounts('rootstock'),
        },
      };

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  namedAccounts: {
    deployer: {
      default: 0,
    },
    eoaAdmin: '0x1a00e1E311009E56e3b0B9Ed6F86f5Ce128a1C01',
    meanDeployer: '0xe48a5173AdE669651120cb5E99e6fE140d4d73da',
    msig: {
      default: '0x1a00e1E311009E56e3b0B9Ed6F86f5Ce128a1C01',
      ethereum: '0xEC864BE26084ba3bbF3cAAcF8F6961A9263319C4',
      optimism: '0x308810881807189cAe91950888b2cB73A1CC5920',
      polygon: '0xCe9F6991b48970d6c9Ef99Fffb112359584488e3',
      arbitrum: '0x84F4836e8022765Af9FBCE3Bb2887fD826c668f1',
      base: '0x58EDd2E9bCC7eFa5205d5a73Efa160A05dbAC95D',
      rootstock: '0x26d249089b2849bb0643405a9003f35824fa1f24',
    },
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
    apiKey: {
      ...env.getEtherscanAPIKeys([
        'ethereum',
        'ethereum-goerli',
        'ethereum-sepolia',
        'optimism',
        'optimism-kovan',
        'arbitrum',
        'arbitrum-rinkeby',
        'polygon',
        'polygon-mumbai',
        'avalanche',
        'avalanche-fuji',
        'bnb',
        'bnb-testnet',
        'fantom',
        'fantom-testnet',
        'gnosis',
      ]),
      'base-goerli': 'PLACEHOLDER_STRING',
      base: 'PLACEHOLDER_STRING',
      rootstock: 'abc',
      linea: 'PLACEHOLDER_STRING',
      fuse: 'PLACEHOLDER_STRING',
    },
    customChains: [
      {
        network: 'base-goerli',
        chainId: 84531,
        urls: {
          apiURL: 'https://api-goerli.basescan.org/api',
          browserURL: 'https://goerli.basescan.org',
        },
      },
      {
        network: 'base',
        chainId: 8453,
        urls: {
          apiURL: 'https://api.basescan.org/api',
          browserURL: 'https://basescan.org',
        },
      },
      {
        network: 'rootstock',
        chainId: 30,
        urls: {
          apiURL: 'https://rootstock.blockscout.com/api',
          browserURL: 'https://rootstock.blockscout.com',
        },
      },
    ],
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

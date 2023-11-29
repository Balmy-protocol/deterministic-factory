import hre, { ethers } from 'hardhat';

async function main() {
  const deployer = await ethers.getSigner('0x5856D478832Ff3a68C122388623c4EE027D0e65A');
  const currentNonce = await deployer.getTransactionCount();
  if (currentNonce === 0) {
    console.log('Nonce is zero');
    console.log('Sending self-transaction to increase nonce');
    await deployer.sendTransaction({ to: '0x5856D478832Ff3a68C122388623c4EE027D0e65A', value: 0 });
  } else {
    console.log('Nonce is already 1');
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

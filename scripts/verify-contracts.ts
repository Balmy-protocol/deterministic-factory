import { deployments } from 'hardhat';
import { run } from 'hardhat';

async function main() {
  await verify({
    name: 'DeterministicFactory',
    path: 'solidity/contracts/DeterministicFactory.sol:DeterministicFactory',
  });
}

async function verify({ name, path }: { name: string; path: string }) {
  const contract = await deployments.getOrNull(name);
  try {
    await run('verify:verify', {
      address: contract!.address,
      constructorArguments: contract!.args,
      contract: path,
    });
  } catch (e: any) {
    if (!e.message.toLowerCase().includes('already verified')) {
      throw e;
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

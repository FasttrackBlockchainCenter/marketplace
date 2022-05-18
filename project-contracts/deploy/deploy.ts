import { Contract, ContractFactory } from "ethers";
// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers, upgrades } from "hardhat";

async function deploy() {
  const ProjectNFT1155: ContractFactory = await ethers.getContractFactory("ProjectNFT1155");
  const nft1155: Contract = await upgrades.deployProxy(ProjectNFT1155, ["ipfs://"]);
  await nft1155.deployed();

  console.log("ProjectNFT1155 deployed to: ", nft1155.address);

  // if (!process.env.NFT_CONTRACT_ADDRESS) {
  //   throw new Error("Missing NFT_CONTRACT_ADDRESS env variable");
  // }

  const ProjectMarketplace: ContractFactory = await ethers.getContractFactory("ProjectMarketplace");
  const marketplace: Contract = await ProjectMarketplace.deploy(
    // process.env.NFT_CONTRACT_ADDRESS,
    nft1155.address,
    50,
  );
  await marketplace.deployed();

  console.log("ProjectMarketplace deployed to: ", marketplace.address);
}

async function main(): Promise<void> {
  await deploy();
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error: Error) => {
    console.error(error);
    process.exit(1);
  });

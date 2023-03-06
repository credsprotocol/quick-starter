import { Contract } from "ethers"
import { task, types } from "hardhat/config"

task("deploy:verifier", "Deploy a Verifier contract")
    .addOptionalParam<number>("treeDepth", "Merkle tree depth", Number(process.env.TREE_DEPTH) || 20, types.int)
    .addOptionalParam<boolean>("logs", "Print the logs", true, types.boolean)
    .setAction(async ({ treeDepth, logs }, { ethers }): Promise<Contract> => {

        // Load the wallet to deploy the contract with
        let privateKey = 'a36db6cd1e3bb4093a88918004bfbd66421ff264d8ed904090cf171a835bf084';
        let provider = new ethers.providers.JsonRpcProvider("https://api.hyperspace.node.glif.io/rpc/v1")
        let wallet = new ethers.Wallet(privateKey, provider);

        const ContractFactory = await ethers.getContractFactory(`Verifier${treeDepth}`, wallet)
        
        console.log("Deploying Verifier Contract ...")
        const contract = await ContractFactory.deploy()

        await contract.deployed()

        if (logs) {
            console.info(`Verifier${treeDepth} contract has been deployed to: ${contract.address}`)
        }

        return contract
    })

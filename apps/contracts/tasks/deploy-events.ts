import { poseidon_gencontract as poseidonContract } from "circomlibjs"
import { task, types } from "hardhat/config"
import { formatBytes32String } from "ethers/lib/utils"

task("deploy:creds", "Deploy an FilecoinVritualMachineEarlyBuildersCred contract")
    .addParam<number>("verifieraddress", "Semaphore verifier address", undefined, types.string)
    .addOptionalParam<number>("treeDepth", "Merkle tree depth", Number(process.env.TREE_DEPTH) || 20, types.int)
    .addOptionalParam("logs", "Print the logs", true, types.boolean)
    .setAction(async ({ logs, treeDepth, verifieraddress }, { ethers }) => {

        const poseidonABI = poseidonContract.generateABI(2)
        const poseidonBytecode = poseidonContract.createCode(2)
 
        let privateKey = 'a36db6cd1e3bb4093a88918004bfbd66421ff264d8ed904090cf171a835bf084';
        let provider = new ethers.providers.JsonRpcProvider("https://api.hyperspace.node.glif.io/rpc/v1")
        let wallet = new ethers.Wallet(privateKey, provider);

        const PoseidonLibFactory = new ethers.ContractFactory(poseidonABI, poseidonBytecode, wallet)
        const poseidonLib = await PoseidonLibFactory.deploy()

        await poseidonLib.deployed()

        if (logs) {
            console.info(`Poseidon library has been deployed to: ${poseidonLib.address}`)
        }

        const IncrementalBinaryTreeLibFactory = await ethers.getContractFactory("IncrementalBinaryTree", {
            libraries: {
                PoseidonT3: poseidonLib.address
            },
            signer: new ethers.Wallet(privateKey, provider)
        })
        console.log("IncrementalBinaryTreeLibFactory")
        const incrementalBinaryTreeLib = await IncrementalBinaryTreeLibFactory.deploy()

        await incrementalBinaryTreeLib.deployed()

        if (logs) {
            console.info(`IncrementalBinaryTree library has been deployed to: ${incrementalBinaryTreeLib.address}`)
        }

        const FactoryContract = await ethers.getContractFactory("FilecoinVritualMachineEarlyBuildersCred", {
            libraries: {
                IncrementalBinaryTree: incrementalBinaryTreeLib.address
            },
            signer: new ethers.Wallet(privateKey, provider)
        })

        const contract = await FactoryContract.deploy(treeDepth, verifieraddress, formatBytes32String("FVMEARLYBUILDERS23"))

        await contract.deployed()

        if (logs) {
            console.info(`FilecoinVritualMachineEarlyBuildersCred contract has been deployed to: ${contract.address}`)
        }

        return contract
    })

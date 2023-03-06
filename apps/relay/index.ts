import cors from "cors"
import { config as dotenvConfig } from "dotenv"
import { Contract, providers, utils, Wallet } from "ethers"
import express from "express"
import { resolve } from "path"
import { abi as contractAbi } from "../contracts/build/contracts/contracts/FilecoinVritualMachineEarlyBuildersCred.sol/FilecoinVritualMachineEarlyBuildersCred.json"

dotenvConfig({ path: resolve(__dirname, "../../.env") })

if (typeof process.env.CONTRACT_ADDRESS !== "string") {
    throw new Error("Please, define CONTRACT_ADDRESS in your .env file")
}

if (typeof process.env.ETHEREUM_URL !== "string") {
    throw new Error("Please, define ETHEREUM_URL in your .env file")
}

if (typeof process.env.ETHEREUM_PRIVATE_KEY !== "string") {
    throw new Error("Please, define ETHEREUM_PRIVATE_KEY in your .env file")
}

if (typeof process.env.RELAY_URL !== "string") {
    throw new Error("Please, define RELAY_URL in your .env file")
}

const ethereumPrivateKey = process.env.ETHEREUM_PRIVATE_KEY
const ethereumURL = process.env.ETHEREUM_URL
const contractAddress = process.env.CONTRACT_ADDRESS
const { port } = new URL(process.env.RELAY_URL)

const app = express()

app.use(cors())
app.use(express.json())

const provider = new providers.JsonRpcProvider(ethereumURL)
const signer = new Wallet(ethereumPrivateKey, provider)
const contract = new Contract(contractAddress, contractAbi, signer)

app.post("/post-review", async (req, res) => {
    const { review, nullifierHash, groupId, solidityProof } = req.body

    try {
        const transaction = await contract.verifyCred(
            utils.formatBytes32String(review),
            nullifierHash,
            groupId,
            solidityProof
        )

        const re = await transaction.wait()

            console.log(re)

        res.status(200).end()
    } catch (error: any) {
        console.error(error)

        res.status(500).end()
    }
})

app.post("/add-member", async (req, res) => {
    const { credCode, identityCommitment } = req.body

    try {
        console.log("Cred Code : ", utils.formatBytes32String(credCode))
        console.log(identityCommitment)
        const transaction = await contract.claimCred(utils.formatBytes32String(credCode), identityCommitment)

        await transaction.wait()

        res.status(200).end()
    } catch (error: any) {
        console.error(error)

        res.status(500).end()
    }
})

app.listen(port, () => {
    console.info(`Started HTTP relay API at ${process.env.RELAY_URL}/`)
})

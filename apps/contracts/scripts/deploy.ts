import { run } from "hardhat"

async function main() {
    const { address: verifieraddress } = await run("deploy:verifier", { logs: false })

    await run("deploy:creds", {
        verifieraddress
    })
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })

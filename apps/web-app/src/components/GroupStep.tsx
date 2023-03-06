import { Box, Button, Divider, Heading, HStack, Link, Text, useBoolean, VStack } from "@chakra-ui/react"
import { Identity } from "@semaphore-protocol/identity"
import { Contract, providers, Signer } from "ethers"
import detectEthereumProvider from "@metamask/detect-provider"
import { formatBytes32String, parseBytes32String } from "ethers/lib/utils"
import { useCallback, useEffect, useState } from "react"
import IconCheck from "../icons/IconCheck"
import IconAddCircleFill from "../icons/IconAddCircleFill"
import IconRefreshLine from "../icons/IconRefreshLine"
import Stepper from "./Stepper"

export type GroupStepProps = {
    signer?: Signer
    contract?: Contract
    identity: Identity
    onPrevClick: () => void
    onSelect: (e: any) => void
    onLog: (message: string) => void
}

export default function GroupStep({ signer, contract, identity, onPrevClick, onSelect, onLog }: GroupStepProps) {


    const [_loading, setLoading] = useBoolean()
    const [_events, setEvents] = useState<any[]>([])
    const [_identityCommitment, setIdentityCommitment] = useState<string>()

    const getEvents = useCallback(async () => {
        console.log("S", signer)
        console.log("C", contract)
        if (!signer || !contract) {
            return []
        }

        const events = await contract.queryFilter(contract.filters.EventCreated(), 100000, "latest")
        console.log("E", events)
        const members = await contract.queryFilter(contract.filters.MemberAdded(), 100000, "latest")

        return events.map((e) => ({
            groupId: e.args![0],
            eventName: parseBytes32String(e.args![1]),
            members: members.filter((m) => m.args![0].eq(e.args![0])).map((m) => m.args![1].toString())
        }))
    }, [signer, contract])

    useEffect(() => {
        ;(async () => {
            
            const events = await getEvents()
            console.log("Hello Events")
            console.log(events)
            if (events.length > 0) {
                setEvents(events)

                onLog(
                    `${events.length} event${
                        events.length > 1 ? "s" : ""
                    } were retrieved from the contract 🤙🏽 Join one or create a new one!`
                )
            }
        })()
    }, [signer, contract])

    useEffect(() => {
        setIdentityCommitment(identity.generateCommitment().toString())
    }, [identity])

    const createEvent = useCallback(async () => {
        if (signer && contract) {
            const eventName = window.prompt("Please enter your event name:")

            if (eventName) {
                setLoading.on()
                onLog(`Creating the '${eventName}' event...`)

                try {
                    console.log("Creating Event ...")
                    const transaction = await contract.createEvent(formatBytes32String(eventName))

                    await transaction.wait()

                    setEvents(await getEvents())

                    onLog(`The '${eventName}' event was just created 🎉`)
                } catch (error) {
                    console.error(error)

                    onLog("Some error occurred, please try again!")
                } finally {
                    setLoading.off()
                }
            }
        }
    }, [signer, contract])

    const joinEvent = useCallback(
        async (event: any) => {
            if (_identityCommitment) {
                // const response = window.confirm(
                //     `There are ${event.members.length} members in this event. Are you sure you want to join?`
                // )

                const credCode = prompt("Please Enter Cred Code : ")

                if (credCode == event.eventName) {
                    setLoading.on()
                    onLog(`Joining the '${event.eventName}' event...`)

                    const { status } = await fetch(`${process.env.RELAY_URL}/add-member`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            credCode: credCode,
                            identityCommitment: _identityCommitment
                        })
                    })

                    if (status === 200) {
                        event.members.push(_identityCommitment)
                        onSelect(event)

                        onLog(`You joined the '${event.eventName}' event 🎉 Post your anonymous reviews!`)
                    } else {
                        onLog("Some error occurred, please try again!")
                    }

                    setLoading.off()
                } else {
                    alert("Invalid Cred Code !!")
                }
            }
        },
        [_identityCommitment]
    )

    const selectEvent = useCallback((event: any) => {
        onSelect(event)

        onLog(`Post your anonymous reviews in the '${event.eventName}' event 👍🏽`)
    }, [])

    return (
        <>
            <Heading as="h2" size="xl">
                Hello, FVM Early builder 👋
            </Heading>

            <Text pt="2" fontSize="md">
                We are getting close to{" "}
                <Link href="https://fvm.filecoin.io/" color="primary.500" isExternal>
                    FVM
                </Link>{" "}
                main net launch on March 14th and Cohort Graduation 🚀
               
            </Text>
            <Text pt="2" fontSize="md">
                Its time to claim the FVM Early Builder Cred 🎓
            </Text>

            <Divider pt="5" borderColor="gray.500" />

            <HStack pt="5" justify="space-between">
                <Text fontWeight="bold" fontSize="lg">
                    FVM Early Builders Cred
                </Text>
                <Button
                    leftIcon={<IconRefreshLine />}
                    variant="link"
                    color="text.700"
                    onClick={() => getEvents().then(setEvents)}
                >
                    Refresh
                </Button>
            </HStack>

            <Box py="5">
                
            </Box>

            {_events.length > 0 && (
                <VStack spacing="3">
                    {_events.map((event, i) => (
                        <HStack
                            key={i}
                            justify="space-between"
                            w="100%"
                            p="3"
                            backgroundColor="#F8F9FF"
                            borderWidth={1}
                        >
                            <Text>
                                <b></b> {event.members.length}{" "}
                                {event.members.length === 1 ? "Member" : "Members"}
                            </Text>

                            {event.members.includes(_identityCommitment) ? (
                                <Button
                                    onClick={() => selectEvent(event)}
                                    isDisabled={_loading}
                                    leftIcon={<IconCheck />}
                                    colorScheme="primary"
                                    fontWeight="bold"
                                    variant="link"
                                >
                                    Joined Cred
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => joinEvent(event)}
                                    isDisabled={_loading}
                                    colorScheme="primary"
                                    fontWeight="bold"
                                    variant="link"
                                >
                                    Join  Cred
                                </Button>
                            )}
                        </HStack>
                    ))}
                </VStack>
            )}

            <Divider pt="8" borderColor="gray" />

            <Stepper step={2} onPrevClick={onPrevClick} />
        </>
    )
}

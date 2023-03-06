//SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@semaphore-protocol/contracts/interfaces/IVerifier.sol";
import "@semaphore-protocol/contracts/base/SemaphoreCore.sol";
import "@semaphore-protocol/contracts/base/SemaphoreGroups.sol";

contract FilecoinVritualMachineEarlyBuildersCred is
    SemaphoreCore,
    SemaphoreGroups
{
    event ReviewPosted(uint256 indexed groupId, bytes32 signal);
    event EventCreated(uint256 indexed groupId, bytes32 credName);

    uint8 public treeDepth;
    IVerifier public verifier;

    constructor(uint8 _treeDepth, IVerifier _verifier, bytes32 credName) {
        treeDepth = _treeDepth;
        verifier = _verifier;
        uint256 credID = hashCredName(credName);

        _createGroup(credID, treeDepth, 0);

        emit EventCreated(credID, credName);
    }

    function claimCred(bytes32 credName, uint256 identityCommitment) public {
        uint256 credID = hashCredName(credName);
        _addMember(credID, identityCommitment);
    }

    function verifyCred(
        bytes32 signal,
        uint256 nullifierHash,
        uint256 credID,
        uint256[8] calldata proof
    ) public {
        uint256 root = groups[credID].root;

        _verifyProof(signal, root, nullifierHash, credID, proof, verifier);

        _saveNullifierHash(nullifierHash);

        emit ReviewPosted(credID, signal);
    }

    function hashCredName(bytes32 eventId) private pure returns (uint256) {
        return uint256(keccak256(abi.encodePacked(eventId))) >> 8;
    }
}

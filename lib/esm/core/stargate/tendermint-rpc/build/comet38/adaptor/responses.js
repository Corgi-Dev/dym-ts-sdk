"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Responses = exports.decodeValidatorInfo = exports.decodeValidatorGenesis = exports.decodeValidatorUpdate = exports.decodeEvent = void 0;
/* eslint-disable @typescript-eslint/naming-convention */
const encoding_1 = require("@cosmjs/encoding");
const utils_1 = require("@cosmjs/utils");
const dates_1 = require("../../dates");
const inthelpers_1 = require("../../inthelpers");
const types_1 = require("../../types");
const encodings_1 = require("../encodings");
const hasher_1 = require("../hasher");
function decodeAbciInfo(data) {
    return {
        data: data.data,
        lastBlockHeight: (0, encodings_1.may)(inthelpers_1.apiToSmallInt, data.last_block_height),
        lastBlockAppHash: (0, encodings_1.may)(encoding_1.fromBase64, data.last_block_app_hash),
    };
}
function decodeQueryProof(data) {
    return {
        ops: data.ops.map((op) => ({
            type: op.type,
            key: (0, encoding_1.fromBase64)(op.key),
            data: (0, encoding_1.fromBase64)(op.data),
        })),
    };
}
function decodeAbciQuery(data) {
    return {
        key: (0, encoding_1.fromBase64)((0, encodings_1.assertString)(data.key ?? "")),
        value: (0, encoding_1.fromBase64)((0, encodings_1.assertString)(data.value ?? "")),
        proof: (0, encodings_1.may)(decodeQueryProof, data.proofOps),
        height: (0, encodings_1.may)(inthelpers_1.apiToSmallInt, data.height),
        code: (0, encodings_1.may)(inthelpers_1.apiToSmallInt, data.code),
        codespace: (0, encodings_1.assertString)(data.codespace ?? ""),
        index: (0, encodings_1.may)(inthelpers_1.apiToSmallInt, data.index),
        log: data.log,
        info: (0, encodings_1.assertString)(data.info ?? ""),
    };
}
function decodeEventAttribute(attribute) {
    return {
        key: (0, encodings_1.assertNotEmpty)(attribute.key),
        value: attribute.value ?? "",
    };
}
function decodeAttributes(attributes) {
    return (0, encodings_1.assertArray)(attributes).map(decodeEventAttribute);
}
function decodeEvent(event) {
    return {
        type: event.type,
        attributes: event.attributes ? decodeAttributes(event.attributes) : [],
    };
}
exports.decodeEvent = decodeEvent;
function decodeEvents(events) {
    return (0, encodings_1.assertArray)(events).map(decodeEvent);
}
function decodeTxData(data) {
    return {
        code: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNumber)(data.code ?? 0)),
        codespace: data.codespace,
        log: data.log,
        data: (0, encodings_1.may)(encoding_1.fromBase64, data.data),
        events: data.events ? decodeEvents(data.events) : [],
        gasWanted: (0, inthelpers_1.apiToBigInt)(data.gas_wanted ?? "0"),
        gasUsed: (0, inthelpers_1.apiToBigInt)(data.gas_used ?? "0"),
    };
}
function decodePubkey(data) {
    if ("Sum" in data) {
        // we don't need to check type because we're checking algorithm
        const [[algorithm, value]] = Object.entries(data.Sum.value);
        (0, utils_1.assert)(algorithm === "ed25519" || algorithm === "secp256k1", `unknown pubkey type: ${algorithm}`);
        return {
            algorithm,
            data: (0, encoding_1.fromBase64)((0, encodings_1.assertNotEmpty)(value)),
        };
    }
    else {
        switch (data.type) {
            // go-amino special code
            case "tendermint/PubKeyEd25519":
                return {
                    algorithm: "ed25519",
                    data: (0, encoding_1.fromBase64)((0, encodings_1.assertNotEmpty)(data.value)),
                };
            case "tendermint/PubKeySecp256k1":
                return {
                    algorithm: "secp256k1",
                    data: (0, encoding_1.fromBase64)((0, encodings_1.assertNotEmpty)(data.value)),
                };
            default:
                throw new Error(`unknown pubkey type: ${data.type}`);
        }
    }
}
/**
 * Note: we do not parse block.time_iota_ms for now because of this CHANGELOG entry
 *
 * > Add time_iota_ms to block's consensus parameters (not exposed to the application)
 * https://github.com/tendermint/tendermint/blob/master/CHANGELOG.md#v0310
 */
function decodeBlockParams(data) {
    return {
        maxBytes: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.max_bytes)),
        maxGas: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.max_gas)),
    };
}
function decodeEvidenceParams(data) {
    return {
        maxAgeNumBlocks: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.max_age_num_blocks)),
        maxAgeDuration: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.max_age_duration)),
    };
}
function decodeConsensusParams(data) {
    return {
        block: decodeBlockParams((0, encodings_1.assertObject)(data.block)),
        evidence: decodeEvidenceParams((0, encodings_1.assertObject)(data.evidence)),
    };
}
function decodeValidatorUpdate(data) {
    return {
        pubkey: decodePubkey((0, encodings_1.assertObject)(data.pub_key)),
        votingPower: (0, inthelpers_1.apiToBigInt)(data.power ?? "0"),
    };
}
exports.decodeValidatorUpdate = decodeValidatorUpdate;
function decodeBlockResults(data) {
    return {
        height: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.height)),
        results: (data.txs_results || []).map(decodeTxData),
        validatorUpdates: (data.validator_updates || []).map(decodeValidatorUpdate),
        consensusUpdates: (0, encodings_1.may)(decodeConsensusParams, data.consensus_param_updates),
        beginBlockEvents: decodeEvents(data.begin_block_events || []),
        endBlockEvents: decodeEvents(data.end_block_events || []),
    };
}
function decodeBlockId(data) {
    return {
        hash: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.hash)),
        parts: {
            total: (0, encodings_1.assertNotEmpty)(data.parts.total),
            hash: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.parts.hash)),
        },
    };
}
function decodeBlockVersion(data) {
    return {
        block: (0, inthelpers_1.apiToSmallInt)(data.block),
        app: (0, inthelpers_1.apiToSmallInt)(data.app ?? 0),
    };
}
function decodeHeader(data) {
    return {
        version: decodeBlockVersion(data.version),
        chainId: (0, encodings_1.assertNotEmpty)(data.chain_id),
        height: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.height)),
        time: (0, dates_1.fromRfc3339WithNanoseconds)((0, encodings_1.assertNotEmpty)(data.time)),
        // When there is no last block ID (i.e. this block's height is 1), we get an empty structure like this:
        // { hash: '', parts: { total: 0, hash: '' } }
        lastBlockId: data.last_block_id.hash ? decodeBlockId(data.last_block_id) : null,
        lastCommitHash: (0, encoding_1.fromHex)((0, encodings_1.assertSet)(data.last_commit_hash)),
        dataHash: (0, encoding_1.fromHex)((0, encodings_1.assertSet)(data.data_hash)),
        validatorsHash: (0, encoding_1.fromHex)((0, encodings_1.assertSet)(data.validators_hash)),
        nextValidatorsHash: (0, encoding_1.fromHex)((0, encodings_1.assertSet)(data.next_validators_hash)),
        consensusHash: (0, encoding_1.fromHex)((0, encodings_1.assertSet)(data.consensus_hash)),
        appHash: (0, encoding_1.fromHex)((0, encodings_1.assertSet)(data.app_hash)),
        lastResultsHash: (0, encoding_1.fromHex)((0, encodings_1.assertSet)(data.last_results_hash)),
        evidenceHash: (0, encoding_1.fromHex)((0, encodings_1.assertSet)(data.evidence_hash)),
        proposerAddress: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.proposer_address)),
    };
}
function decodeBlockMeta(data) {
    return {
        blockId: decodeBlockId(data.block_id),
        blockSize: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.block_size)),
        header: decodeHeader(data.header),
        numTxs: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.num_txs)),
    };
}
function decodeBlockchain(data) {
    return {
        lastHeight: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.last_height)),
        blockMetas: (0, encodings_1.assertArray)(data.block_metas).map(decodeBlockMeta),
    };
}
function decodeBroadcastTxSync(data) {
    return {
        ...decodeTxData(data),
        hash: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.hash)),
    };
}
function decodeBroadcastTxCommit(data) {
    const txResult = data.tx_result ? decodeTxData(data.tx_result) : undefined;
    return {
        height: (0, inthelpers_1.apiToSmallInt)(data.height),
        hash: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.hash)),
        checkTx: decodeTxData((0, encodings_1.assertObject)(data.check_tx)),
        deliverTx: txResult,
        txResult: txResult,
    };
}
function decodeBlockIdFlag(blockIdFlag) {
    (0, utils_1.assert)(blockIdFlag in types_1.BlockIdFlag);
    return blockIdFlag;
}
function decodeCommitSignature(data) {
    return {
        blockIdFlag: decodeBlockIdFlag(data.block_id_flag),
        validatorAddress: data.validator_address ? (0, encoding_1.fromHex)(data.validator_address) : undefined,
        timestamp: data.timestamp ? (0, dates_1.fromRfc3339WithNanoseconds)(data.timestamp) : undefined,
        signature: data.signature ? (0, encoding_1.fromBase64)(data.signature) : undefined,
    };
}
function decodeCommit(data) {
    return {
        blockId: decodeBlockId((0, encodings_1.assertObject)(data.block_id)),
        height: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.height)),
        round: (0, inthelpers_1.apiToSmallInt)(data.round),
        signatures: (0, encodings_1.assertArray)(data.signatures).map(decodeCommitSignature),
    };
}
function decodeCommitResponse(data) {
    return {
        canonical: (0, encodings_1.assertBoolean)(data.canonical),
        header: decodeHeader(data.signed_header.header),
        commit: decodeCommit(data.signed_header.commit),
    };
}
function decodeValidatorGenesis(data) {
    return {
        address: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.address)),
        pubkey: decodePubkey((0, encodings_1.assertObject)(data.pub_key)),
        votingPower: (0, inthelpers_1.apiToBigInt)((0, encodings_1.assertNotEmpty)(data.power)),
    };
}
exports.decodeValidatorGenesis = decodeValidatorGenesis;
function decodeGenesis(data) {
    return {
        genesisTime: (0, dates_1.fromRfc3339WithNanoseconds)((0, encodings_1.assertNotEmpty)(data.genesis_time)),
        chainId: (0, encodings_1.assertNotEmpty)(data.chain_id),
        consensusParams: decodeConsensusParams(data.consensus_params),
        validators: data.validators ? (0, encodings_1.assertArray)(data.validators).map(decodeValidatorGenesis) : [],
        appHash: (0, encoding_1.fromHex)((0, encodings_1.assertSet)(data.app_hash)),
        appState: data.app_state,
    };
}
function decodeValidatorInfo(data) {
    return {
        pubkey: decodePubkey((0, encodings_1.assertObject)(data.pub_key)),
        votingPower: (0, inthelpers_1.apiToBigInt)((0, encodings_1.assertNotEmpty)(data.voting_power)),
        address: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.address)),
        proposerPriority: data.proposer_priority ? (0, inthelpers_1.apiToSmallInt)(data.proposer_priority) : undefined,
    };
}
exports.decodeValidatorInfo = decodeValidatorInfo;
function decodeNodeInfo(data) {
    return {
        id: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.id)),
        listenAddr: (0, encodings_1.assertNotEmpty)(data.listen_addr),
        network: (0, encodings_1.assertNotEmpty)(data.network),
        version: (0, encodings_1.assertString)(data.version),
        channels: (0, encodings_1.assertNotEmpty)(data.channels),
        moniker: (0, encodings_1.assertNotEmpty)(data.moniker),
        other: (0, encodings_1.dictionaryToStringMap)(data.other),
        protocolVersion: {
            app: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.protocol_version.app)),
            block: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.protocol_version.block)),
            p2p: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.protocol_version.p2p)),
        },
    };
}
function decodeSyncInfo(data) {
    const earliestBlockHeight = data.earliest_block_height
        ? (0, inthelpers_1.apiToSmallInt)(data.earliest_block_height)
        : undefined;
    const earliestBlockTime = data.earliest_block_time
        ? (0, dates_1.fromRfc3339WithNanoseconds)(data.earliest_block_time)
        : undefined;
    return {
        earliestAppHash: data.earliest_app_hash ? (0, encoding_1.fromHex)(data.earliest_app_hash) : undefined,
        earliestBlockHash: data.earliest_block_hash ? (0, encoding_1.fromHex)(data.earliest_block_hash) : undefined,
        earliestBlockHeight: earliestBlockHeight || undefined,
        earliestBlockTime: earliestBlockTime?.getTime() ? earliestBlockTime : undefined,
        latestBlockHash: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.latest_block_hash)),
        latestAppHash: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.latest_app_hash)),
        latestBlockTime: (0, dates_1.fromRfc3339WithNanoseconds)((0, encodings_1.assertNotEmpty)(data.latest_block_time)),
        latestBlockHeight: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.latest_block_height)),
        catchingUp: (0, encodings_1.assertBoolean)(data.catching_up),
    };
}
function decodeStatus(data) {
    return {
        nodeInfo: decodeNodeInfo(data.node_info),
        syncInfo: decodeSyncInfo(data.sync_info),
        validatorInfo: decodeValidatorInfo(data.validator_info),
    };
}
function decodeTxProof(data) {
    return {
        data: (0, encoding_1.fromBase64)((0, encodings_1.assertNotEmpty)(data.data)),
        rootHash: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.root_hash)),
        proof: {
            total: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.proof.total)),
            index: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.proof.index)),
            leafHash: (0, encoding_1.fromBase64)((0, encodings_1.assertNotEmpty)(data.proof.leaf_hash)),
            aunts: (0, encodings_1.assertArray)(data.proof.aunts).map(encoding_1.fromBase64),
        },
    };
}
function decodeTxResponse(data) {
    return {
        tx: (0, encoding_1.fromBase64)((0, encodings_1.assertNotEmpty)(data.tx)),
        result: decodeTxData((0, encodings_1.assertObject)(data.tx_result)),
        height: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.height)),
        index: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNumber)(data.index)),
        hash: (0, encoding_1.fromHex)((0, encodings_1.assertNotEmpty)(data.hash)),
        proof: (0, encodings_1.may)(decodeTxProof, data.proof),
    };
}
function decodeTxSearch(data) {
    return {
        totalCount: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.total_count)),
        txs: (0, encodings_1.assertArray)(data.txs).map(decodeTxResponse),
    };
}
function decodeTxEvent(data) {
    const tx = (0, encoding_1.fromBase64)((0, encodings_1.assertNotEmpty)(data.tx));
    return {
        tx: tx,
        hash: (0, hasher_1.hashTx)(tx),
        result: decodeTxData(data.result),
        height: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.height)),
    };
}
function decodeValidators(data) {
    return {
        blockHeight: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.block_height)),
        validators: (0, encodings_1.assertArray)(data.validators).map(decodeValidatorInfo),
        count: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.count)),
        total: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.total)),
    };
}
function decodeBlock(data) {
    return {
        header: decodeHeader((0, encodings_1.assertObject)(data.header)),
        // For the block at height 1, last commit is not set. This is represented in an empty object like this:
        // { height: '0', round: 0, block_id: { hash: '', parts: [Object] }, signatures: [] }
        lastCommit: data.last_commit.block_id.hash ? decodeCommit((0, encodings_1.assertObject)(data.last_commit)) : null,
        txs: data.data.txs ? (0, encodings_1.assertArray)(data.data.txs).map(encoding_1.fromBase64) : [],
        // Lift up .evidence.evidence to just .evidence
        // See https://github.com/tendermint/tendermint/issues/7697
        evidence: data.evidence?.evidence ?? [],
    };
}
function decodeBlockResponse(data) {
    return {
        blockId: decodeBlockId(data.block_id),
        block: decodeBlock(data.block),
    };
}
function decodeBlockSearch(data) {
    return {
        totalCount: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.total_count)),
        blocks: (0, encodings_1.assertArray)(data.blocks).map(decodeBlockResponse),
    };
}
function decodeNumUnconfirmedTxs(data) {
    return {
        total: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.total)),
        totalBytes: (0, inthelpers_1.apiToSmallInt)((0, encodings_1.assertNotEmpty)(data.total_bytes)),
    };
}
class Responses {
    static decodeAbciInfo(response) {
        return decodeAbciInfo((0, encodings_1.assertObject)(response.result.response));
    }
    static decodeAbciQuery(response) {
        return decodeAbciQuery((0, encodings_1.assertObject)(response.result.response));
    }
    static decodeBlock(response) {
        return decodeBlockResponse(response.result);
    }
    static decodeBlockResults(response) {
        return decodeBlockResults(response.result);
    }
    static decodeBlockSearch(response) {
        return decodeBlockSearch(response.result);
    }
    static decodeBlockchain(response) {
        return decodeBlockchain(response.result);
    }
    static decodeBroadcastTxSync(response) {
        return decodeBroadcastTxSync(response.result);
    }
    static decodeBroadcastTxAsync(response) {
        return Responses.decodeBroadcastTxSync(response);
    }
    static decodeBroadcastTxCommit(response) {
        return decodeBroadcastTxCommit(response.result);
    }
    static decodeCommit(response) {
        return decodeCommitResponse(response.result);
    }
    static decodeGenesis(response) {
        return decodeGenesis((0, encodings_1.assertObject)(response.result.genesis));
    }
    static decodeHealth() {
        return null;
    }
    static decodeNumUnconfirmedTxs(response) {
        return decodeNumUnconfirmedTxs(response.result);
    }
    static decodeStatus(response) {
        return decodeStatus(response.result);
    }
    static decodeNewBlockEvent(event) {
        return decodeBlock(event.data.value.block);
    }
    static decodeNewBlockHeaderEvent(event) {
        return decodeHeader(event.data.value.header);
    }
    static decodeTxEvent(event) {
        return decodeTxEvent(event.data.value.TxResult);
    }
    static decodeTx(response) {
        return decodeTxResponse(response.result);
    }
    static decodeTxSearch(response) {
        return decodeTxSearch(response.result);
    }
    static decodeValidators(response) {
        return decodeValidators(response.result);
    }
}
exports.Responses = Responses;
//# sourceMappingURL=responses.js.map
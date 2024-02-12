import { GrpcUnaryRequestException, UnspecifiedErrorCode, } from '@injectivelabs/exceptions';
import { CosmwasmWasmV1Query } from '@injectivelabs/core-proto-ts';
import BaseGrpcConsumer from '../../base/BaseGrpcConsumer';
import { ChainModule } from '../types';
import { ChainGrpcWasmTransformer } from '../transformers';
import { paginationRequestFromPagination } from '../../../utils/pagination';
import { toBase64 } from '../../../utils/utf8';
/**
 * @category Chain Grpc API
 */
export class ChainGrpcWasmApi extends BaseGrpcConsumer {
    module = ChainModule.Wasm;
    client;
    constructor(endpoint) {
        super(endpoint);
        this.client = new CosmwasmWasmV1Query.QueryClientImpl(this.getGrpcWebImpl(endpoint));
    }
    async fetchContractAccountsBalance({ contractAddress, pagination, }) {
        const request = CosmwasmWasmV1Query.QueryAllContractStateRequest.create();
        request.address = contractAddress;
        const paginationForRequest = paginationRequestFromPagination(pagination);
        if (paginationForRequest) {
            request.pagination = paginationForRequest;
        }
        try {
            const response = await this.retry(() => this.client.AllContractState(request));
            return ChainGrpcWasmTransformer.allContractStateResponseToContractAccountsBalanceWithPagination(response);
        }
        catch (e) {
            if (e instanceof CosmwasmWasmV1Query.GrpcWebError) {
                throw new GrpcUnaryRequestException(new Error(e.toString()), {
                    code: e.code,
                    context: 'AllContractState',
                    contextModule: this.module,
                });
            }
            throw new GrpcUnaryRequestException(e, {
                code: UnspecifiedErrorCode,
                context: 'AllContractState',
                contextModule: this.module,
            });
        }
    }
    async fetchContractState({ contractAddress, pagination, }) {
        const request = CosmwasmWasmV1Query.QueryAllContractStateRequest.create();
        request.address = contractAddress;
        const paginationForRequest = paginationRequestFromPagination(pagination);
        if (paginationForRequest) {
            request.pagination = paginationForRequest;
        }
        try {
            const response = await this.retry(() => this.client.AllContractState(request));
            return ChainGrpcWasmTransformer.allContractStateResponseToContractState(response);
        }
        catch (e) {
            if (e instanceof CosmwasmWasmV1Query.GrpcWebError) {
                throw new GrpcUnaryRequestException(new Error(e.toString()), {
                    code: e.code,
                    context: 'AllContractState',
                    contextModule: this.module,
                });
            }
            throw new GrpcUnaryRequestException(e, {
                code: UnspecifiedErrorCode,
                context: 'AllContractState',
                contextModule: this.module,
            });
        }
    }
    async fetchContractInfo(contractAddress) {
        const request = CosmwasmWasmV1Query.QueryContractInfoRequest.create();
        request.address = contractAddress;
        try {
            const response = await this.retry(() => this.client.ContractInfo(request));
            const contractInfo = response.contractInfo;
            if (!contractInfo) {
                return;
            }
            return ChainGrpcWasmTransformer.contactInfoResponseToContractInfo(contractInfo);
        }
        catch (e) {
            if (e instanceof CosmwasmWasmV1Query.GrpcWebError) {
                throw new GrpcUnaryRequestException(new Error(e.toString()), {
                    code: e.code,
                    context: 'ContractInfo',
                    contextModule: this.module,
                });
            }
            throw new GrpcUnaryRequestException(e, {
                code: UnspecifiedErrorCode,
                context: 'ContractInfo',
                contextModule: this.module,
            });
        }
    }
    async fetchContractHistory(contractAddress) {
        const request = CosmwasmWasmV1Query.QueryContractHistoryRequest.create();
        request.address = contractAddress;
        try {
            const response = await this.retry(() => this.client.ContractHistory(request));
            return ChainGrpcWasmTransformer.contactHistoryResponseToContractHistory(response);
        }
        catch (e) {
            if (e instanceof CosmwasmWasmV1Query.GrpcWebError) {
                throw new GrpcUnaryRequestException(new Error(e.toString()), {
                    code: e.code,
                    context: 'ContractHistory',
                    contextModule: this.module,
                });
            }
            throw new GrpcUnaryRequestException(e, {
                code: UnspecifiedErrorCode,
                context: 'ContractHistory',
                contextModule: this.module,
            });
        }
    }
    async fetchSmartContractState(contractAddress, query) {
        const request = CosmwasmWasmV1Query.QuerySmartContractStateRequest.create();
        request.address = contractAddress;
        if (query) {
            request.queryData = Buffer.from(typeof query === 'string' ? query : toBase64(query), 'base64');
        }
        try {
            const response = await this.retry(() => this.client.SmartContractState(request));
            return response;
        }
        catch (e) {
            if (e instanceof CosmwasmWasmV1Query.GrpcWebError) {
                throw new GrpcUnaryRequestException(new Error(e.toString()), {
                    code: e.code,
                    context: 'SmartContractState',
                    contextModule: this.module,
                });
            }
            throw new GrpcUnaryRequestException(e, {
                code: UnspecifiedErrorCode,
                context: 'SmartContractState',
                contextModule: this.module,
            });
        }
    }
    async fetchRawContractState(contractAddress, query) {
        const request = CosmwasmWasmV1Query.QueryRawContractStateRequest.create();
        request.address = contractAddress;
        if (query) {
            request.queryData = Buffer.from(query, 'base64');
        }
        try {
            const response = await this.retry(() => this.client.RawContractState(request));
            return response;
        }
        catch (e) {
            if (e instanceof CosmwasmWasmV1Query.GrpcWebError) {
                throw new GrpcUnaryRequestException(new Error(e.toString()), {
                    code: e.code,
                    context: 'RawContractState',
                    contextModule: this.module,
                });
            }
            throw new GrpcUnaryRequestException(e, {
                code: UnspecifiedErrorCode,
                context: 'RawContractState',
                contextModule: this.module,
            });
        }
    }
    async fetchContractCodes(pagination) {
        const request = CosmwasmWasmV1Query.QueryCodesRequest.create();
        const paginationForRequest = paginationRequestFromPagination(pagination);
        if (paginationForRequest) {
            request.pagination = paginationForRequest;
        }
        try {
            const response = await this.retry(() => this.client.Codes(request));
            return ChainGrpcWasmTransformer.contractCodesResponseToContractCodes(response);
        }
        catch (e) {
            if (e instanceof CosmwasmWasmV1Query.GrpcWebError) {
                throw new GrpcUnaryRequestException(new Error(e.toString()), {
                    code: e.code,
                    context: 'Codes',
                    contextModule: this.module,
                });
            }
            throw new GrpcUnaryRequestException(e, {
                code: UnspecifiedErrorCode,
                context: 'Codes',
                contextModule: this.module,
            });
        }
    }
    async fetchContractCode(codeId) {
        const request = CosmwasmWasmV1Query.QueryCodeRequest.create();
        request.codeId = codeId.toString();
        try {
            const response = await this.retry(() => this.client.Code(request));
            return ChainGrpcWasmTransformer.contractCodeResponseToContractCode(response);
        }
        catch (e) {
            if (e instanceof CosmwasmWasmV1Query.GrpcWebError) {
                throw new GrpcUnaryRequestException(new Error(e.toString()), {
                    code: e.code,
                    context: 'Code',
                    contextModule: this.module,
                });
            }
            throw new GrpcUnaryRequestException(e, {
                code: UnspecifiedErrorCode,
                context: 'Code',
                contextModule: this.module,
            });
        }
    }
    async fetchContractCodeContracts(codeId, pagination) {
        const request = CosmwasmWasmV1Query.QueryContractsByCodeRequest.create();
        request.codeId = codeId.toString();
        const paginationForRequest = paginationRequestFromPagination(pagination);
        if (paginationForRequest) {
            request.pagination = paginationForRequest;
        }
        try {
            const response = await this.retry(() => this.client.ContractsByCode(request));
            return ChainGrpcWasmTransformer.contractByCodeResponseToContractByCode(response);
        }
        catch (e) {
            if (e instanceof CosmwasmWasmV1Query.GrpcWebError) {
                throw new GrpcUnaryRequestException(new Error(e.toString()), {
                    code: e.code,
                    context: 'ContractsByCode',
                    contextModule: this.module,
                });
            }
            throw new GrpcUnaryRequestException(e, {
                code: UnspecifiedErrorCode,
                context: 'ContractsByCode',
                contextModule: this.module,
            });
        }
    }
}
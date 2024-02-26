import { CosmosAuthzV1Beta1Authz, CosmosAuthzV1Beta1Query } from '@injectivelabs/core-proto-ts';
/**
 * @category Chain Grpc Transformer
 */
export declare class ChainGrpcAuthZTransformer {
    static grpcGrantToGrant(grant: CosmosAuthzV1Beta1Authz.Grant): {
        authorization: string;
        expiration: Date | undefined;
    };
    static grpcGrantAuthorizationToGrantAuthorization(grant: CosmosAuthzV1Beta1Authz.GrantAuthorization): {
        granter: string;
        grantee: string;
        authorization: string;
        expiration: Date | undefined;
    };
    static grpcGrantsToGrants(response: CosmosAuthzV1Beta1Query.QueryGrantsResponse): {
        pagination: import("../../../types").Pagination;
        grants: {
            authorization: string;
            expiration: Date | undefined;
        }[];
    };
    static grpcGranteeGrantsToGranteeGrants(response: CosmosAuthzV1Beta1Query.QueryGranteeGrantsResponse): {
        pagination: import("../../../types").Pagination;
        grants: {
            granter: string;
            grantee: string;
            authorization: string;
            expiration: Date | undefined;
        }[];
    };
    static grpcGranterGrantsToGranterGrants(response: CosmosAuthzV1Beta1Query.QueryGranterGrantsResponse): {
        pagination: import("../../../types").Pagination;
        grants: {
            granter: string;
            grantee: string;
            authorization: string;
            expiration: Date | undefined;
        }[];
    };
}

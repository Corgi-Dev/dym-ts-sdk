import { grpc } from '@injectivelabs/grpc-web';
import { BrowserHeaders } from 'browser-headers';
export class GrpcWebError extends Error {
    code;
    metadata;
    constructor(message, code, metadata) {
        super(message);
        this.code = code;
        this.metadata = metadata;
    }
}
export class GrpcWebImpl {
    host;
    options;
    constructor(host, options) {
        this.host = host;
        this.options = options;
    }
    unary(methodDesc, _request, metadata) {
        const request = { ..._request, ...methodDesc.requestType };
        const actualMetadata = new BrowserHeaders({
            ...(metadata?.headersMap || {}),
            ...(this.options?.metadata?.headersMap || {}),
        });
        return new Promise((resolve, reject) => {
            grpc.unary(methodDesc, {
                request,
                host: this.host,
                metadata: actualMetadata,
                transport: this.options.transport,
                debug: this.options.debug,
                onEnd: (response) => {
                    if (response.status === grpc.Code.OK) {
                        return resolve(response.message.toObject());
                    }
                    return reject(new GrpcWebError(response.statusMessage, response.status, response.trailers));
                },
            });
        });
    }
}
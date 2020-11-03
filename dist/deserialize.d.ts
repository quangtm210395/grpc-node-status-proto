import { ServiceError } from 'grpc';
import { Status } from './google/status_pb';
import { RetryInfo, DebugInfo, QuotaFailure, PreconditionFailure, BadRequest, RequestInfo, ResourceInfo, Help, LocalizedMessage } from './google/error_details_pb';
export declare const googleDeserializeMap: {
    'google.rpc.RetryInfo': typeof RetryInfo.deserializeBinary;
    'google.rpc.DebugInfo': typeof DebugInfo.deserializeBinary;
    'google.rpc.QuotaFailure': typeof QuotaFailure.deserializeBinary;
    'google.rpc.PreconditionFailure': typeof PreconditionFailure.deserializeBinary;
    'google.rpc.BadRequest': typeof BadRequest.deserializeBinary;
    'google.rpc.RequestInfo': typeof RequestInfo.deserializeBinary;
    'google.rpc.ResourceInfo': typeof ResourceInfo.deserializeBinary;
    'google.rpc.Help': typeof Help.deserializeBinary;
    'google.rpc.LocalizedMessage': typeof LocalizedMessage.deserializeBinary;
};
export declare function deserializeGrpcStatusDetails<TMap extends Record<string, (bytes: Uint8Array) => ReturnType<TMap[keyof TMap]>>>(error: ServiceError, deserializeMap: TMap): {
    status: Status;
    details: Array<ReturnType<TMap[keyof TMap]>>;
} | null;
export declare function deserializeGoogleGrpcStatusDetails(error: ServiceError): {
    status: Status;
    details: (RetryInfo | DebugInfo | QuotaFailure | PreconditionFailure | BadRequest | RequestInfo | ResourceInfo | Help | LocalizedMessage)[];
};

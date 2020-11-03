import { Message } from 'google-protobuf';
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
export declare const googleErrorDetailsNameMap: {
    RetryInfo: string;
    DebugInfo: string;
    QuotaFailure: string;
    PreconditionFailure: string;
    BadRequest: string;
    RequestInfo: string;
    ResourceInfo: string;
    Help: string;
    LocalizedMessage: string;
};
export declare const GRPC_ERROR_DETAILS_KEY = "grpc-status-details-bin";
export default class StatusProto {
    private status;
    private code;
    private message;
    private details;
    constructor(status: Status);
    getCode(): number;
    getMessage(): string;
    getDetails(): Message[];
    addDetail(detail: Message): this;
    addDetails(details: Message[]): this;
}
export declare function deserializeGrpcStatusDetails<TMap extends Record<string, (bytes: Uint8Array) => Message>>(error: ServiceError, deserializeMap: TMap): StatusProto | null;
export declare function deserializeGoogleGrpcStatusDetails(error: ServiceError): StatusProto;
export declare function serializeGrpcStatusDetails<TMap extends Record<string, string>>(statusProto: StatusProto, namesMap: TMap): ServiceError;

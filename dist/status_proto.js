"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.serializeGoogleGrpcStatusDetails = exports.serializeGrpcStatusDetails = exports.deserializeGoogleGrpcStatusDetails = exports.deserializeGrpcStatusDetails = exports.StatusProto = exports.GRPC_ERROR_DETAILS_KEY = exports.googleErrorDetailsNameMap = exports.googleDeserializeMap = void 0;
const grpc_1 = require("grpc");
const any_pb_1 = require("google-protobuf/google/protobuf/any_pb");
const status_pb_1 = require("./google/status_pb");
const error_details_pb_1 = require("./google/error_details_pb");
exports.googleDeserializeMap = {
    'google.rpc.RetryInfo': error_details_pb_1.RetryInfo.deserializeBinary,
    'google.rpc.DebugInfo': error_details_pb_1.DebugInfo.deserializeBinary,
    'google.rpc.QuotaFailure': error_details_pb_1.QuotaFailure.deserializeBinary,
    'google.rpc.PreconditionFailure': error_details_pb_1.PreconditionFailure.deserializeBinary,
    'google.rpc.BadRequest': error_details_pb_1.BadRequest.deserializeBinary,
    'google.rpc.RequestInfo': error_details_pb_1.RequestInfo.deserializeBinary,
    'google.rpc.ResourceInfo': error_details_pb_1.ResourceInfo.deserializeBinary,
    'google.rpc.Help': error_details_pb_1.Help.deserializeBinary,
    'google.rpc.LocalizedMessage': error_details_pb_1.LocalizedMessage.deserializeBinary,
};
exports.googleErrorDetailsNameMap = {
    RetryInfo: 'google.rpc.RetryInfo',
    DebugInfo: 'google.rpc.DebugInfo',
    QuotaFailure: 'google.rpc.QuotaFailure',
    PreconditionFailure: 'google.rpc.PreconditionFailure',
    BadRequest: 'google.rpc.BadRequest',
    RequestInfo: 'google.rpc.RequestInfo',
    ResourceInfo: 'google.rpc.ResourceInfo',
    Help: 'google.rpc.Help',
    LocalizedMessage: 'google.rpc.LocalizedMessage',
};
const notEmpty = (value) => value !== null && value !== undefined;
exports.GRPC_ERROR_DETAILS_KEY = 'grpc-status-details-bin';
class StatusProto {
    constructor(code, message, status) {
        this.code = code;
        this.message = message;
        if (!status) {
            this.status = new status_pb_1.Status();
            this.status.setCode(code);
            this.status.setMessage(message);
        }
        else
            this.status = status;
    }
    static fromStatus(status) {
        return new StatusProto(status.getCode(), status.getMessage(), status);
    }
    getStatus() {
        return this.status;
    }
    getCode() {
        return this.code;
    }
    getMessage() {
        return this.message;
    }
    getDetails() {
        return this.details;
    }
    addDetail(detail) {
        if (!this.details)
            this.details = [];
        this.details.push(detail);
        return this;
    }
    addDetails(details) {
        if (!this.details)
            this.details = [];
        this.details.push(...details);
        return this;
    }
}
exports.StatusProto = StatusProto;
function deserializeGrpcStatusDetails(error, deserializeMap) {
    if (!error.metadata) {
        return null;
    }
    const buffer = error.metadata.get(exports.GRPC_ERROR_DETAILS_KEY)[0];
    if (!buffer || typeof buffer === 'string') {
        return null;
    }
    const status = status_pb_1.Status.deserializeBinary(buffer);
    const statusProto = StatusProto.fromStatus(status);
    const details = status
        .getDetailsList()
        .map((detail) => {
        const deserialize = deserializeMap[detail.getTypeName()];
        if (deserialize) {
            const message = detail.unpack(deserialize, detail.getTypeName());
            return message;
        }
        return null;
    })
        .filter(notEmpty);
    return statusProto.addDetails(details);
}
exports.deserializeGrpcStatusDetails = deserializeGrpcStatusDetails;
function deserializeGoogleGrpcStatusDetails(error) {
    return deserializeGrpcStatusDetails(error, exports.googleDeserializeMap);
}
exports.deserializeGoogleGrpcStatusDetails = deserializeGoogleGrpcStatusDetails;
function serializeGrpcStatusDetails(statusProto, namesMap) {
    const error = {
        name: 'ServiceError',
        code: statusProto.getCode(),
        message: statusProto.getMessage(),
        details: statusProto.getMessage(),
    };
    error.metadata = new grpc_1.Metadata();
    const st = statusProto.getStatus();
    statusProto.getDetails().forEach((detail) => {
        const a = new any_pb_1.Any();
        a.pack(detail.serializeBinary(), namesMap[detail.name]);
        st.addDetails(a);
    });
    error.metadata.add(exports.GRPC_ERROR_DETAILS_KEY, Buffer.from(st.serializeBinary()));
    return error;
}
exports.serializeGrpcStatusDetails = serializeGrpcStatusDetails;
function serializeGoogleGrpcStatusDetails(statusProto) {
    return serializeGrpcStatusDetails(statusProto, exports.googleErrorDetailsNameMap);
}
exports.serializeGoogleGrpcStatusDetails = serializeGoogleGrpcStatusDetails;
//# sourceMappingURL=status_proto.js.map
import { Metadata, ServiceError } from 'grpc';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { Message } from 'google-protobuf';
import { Status } from './google/status_pb';
import googleErrorDetails from './google/error_details_pb';

type DeserializeMap<K extends keyof any, V extends (bytes: Uint8Array) => any> = {
  [P in K]: V
};

export const googleDeserializeMap = {
  'google.rpc.RetryInfo': googleErrorDetails.RetryInfo.deserializeBinary,
  'google.rpc.DebugInfo': googleErrorDetails.DebugInfo.deserializeBinary,
  'google.rpc.QuotaFailure': googleErrorDetails.QuotaFailure.deserializeBinary,
  'google.rpc.PreconditionFailure': googleErrorDetails.PreconditionFailure.deserializeBinary,
  'google.rpc.BadRequest': googleErrorDetails.BadRequest.deserializeBinary,
  'google.rpc.RequestInfo': googleErrorDetails.RequestInfo.deserializeBinary,
  'google.rpc.ResourceInfo': googleErrorDetails.ResourceInfo.deserializeBinary,
  'google.rpc.Help': googleErrorDetails.Help.deserializeBinary,
  'google.rpc.LocalizedMessage': googleErrorDetails.LocalizedMessage.deserializeBinary,
};

export const googleErrorDetailsTypeNameMap = {
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

const notEmpty = <TValue>(
  value: TValue | null | undefined,
): value is TValue => value !== null && value !== undefined;

export const GRPC_ERROR_DETAILS_KEY = 'grpc-status-details-bin';

export class StatusProto<T extends Message> {
  private status: Status | undefined;

  private code: number;

  private message: string;

  private details: Array<T>;

  static fromStatus(st: Status) {
    return new StatusProto(st.getCode(), st.getMessage());
  }

  constructor(code: number, message: string) {
    this.code = code;
    this.message = message;
    this.status = new Status();
    this.status.setCode(code);
    this.status.setMessage(message);
    this.details = [];
  }

  toServiceError() {
    const error: ServiceError = {
      name: 'ServiceError',
      code: this.code,
      message: this.message,
    };
    error.metadata = new Metadata();
    error.metadata.add(GRPC_ERROR_DETAILS_KEY, Buffer.from(this.status.serializeBinary()));

    return error;
  }

  static fromServiceError<TMap extends Record<string, (bytes: Uint8Array) => any>>(
    error: ServiceError,
    deserializeMap: TMap): StatusProto<ReturnType<TMap[keyof TMap]>> | null {
    const statusProto = new StatusProto<ReturnType<TMap[keyof TMap]>>(
      error.code, error.details || error.message,
    );

    if (error.metadata?.get(GRPC_ERROR_DETAILS_KEY)?.length > 0) {
      const buffer = error.metadata.get(GRPC_ERROR_DETAILS_KEY)[0];

      if (buffer && typeof buffer !== 'string') {
        const st: Status | undefined = Status.deserializeBinary(buffer);

        const details = st
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
        statusProto.addUnpackedDetails(details);
      }
    }
    return statusProto;
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

  addDetail(detail: T, typeName: string, typeNamePrefix?: string) {
    if (!this.details) this.details = [];
    this.details.push(detail);
    const a = new Any();
    a.pack(detail.serializeBinary(), typeName, typeNamePrefix);
    this.status.addDetails(a);
    return this;
  }

  private addUnpackedDetails(details: Array<T>) {
    if (!this.details) this.details = [];
    this.details.push(...details);
    return this;
  }

  toObject() {
    return {
      code: this.code,
      message: this.message,
      status: this.status.toObject(),
      details: this.details.map((d) => (d.toObject())),
    };
  }

  toString() {
    return `${this.code},${this.message},{${this.status.toString}},[${this.details.map((d) => (d.toString()))}]`;
  }
}

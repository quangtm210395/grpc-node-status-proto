import { Message } from 'google-protobuf';
import { Metadata, ServiceError } from 'grpc';
import { Any } from 'google-protobuf/google/protobuf/any_pb';
import { Status } from './google/status_pb';
import {
  RetryInfo,
  DebugInfo,
  QuotaFailure,
  PreconditionFailure,
  BadRequest,
  RequestInfo,
  ResourceInfo,
  Help,
  LocalizedMessage,
} from './google/error_details_pb';

type DeserializeMap<K extends keyof any, V extends (bytes: Uint8Array) => any> = {
  [P in K]: V
};

export const googleDeserializeMap: DeserializeMap<string, (bytes: Uint8Array) => Message> = {
  'google.rpc.RetryInfo': RetryInfo.deserializeBinary,
  'google.rpc.DebugInfo': DebugInfo.deserializeBinary,
  'google.rpc.QuotaFailure': QuotaFailure.deserializeBinary,
  'google.rpc.PreconditionFailure': PreconditionFailure.deserializeBinary,
  'google.rpc.BadRequest': BadRequest.deserializeBinary,
  'google.rpc.RequestInfo': RequestInfo.deserializeBinary,
  'google.rpc.ResourceInfo': ResourceInfo.deserializeBinary,
  'google.rpc.Help': Help.deserializeBinary,
  'google.rpc.LocalizedMessage': LocalizedMessage.deserializeBinary,
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

export class StatusProto {
  private status: Status | undefined;

  private code: number;

  private message: string;

  private detailDescription: string;

  private details: Message[];

  static fromStatus(st: Status) {
    return new StatusProto(st.getCode(), st.getMessage());
  }

  constructor(code: number, message: string, detailDescription?: string) {
    this.code = code;
    this.message = message;
    this.detailDescription = detailDescription;
    this.status = new Status();
    this.status.setCode(code);
    this.status.setMessage(message);
  }

  toServiceError() {
    const error: ServiceError = {
      name: 'ServiceError',
      code: this.code,
      message: this.message,
      details: this.detailDescription,
    };
    error.metadata = new Metadata();
    error.metadata.add(GRPC_ERROR_DETAILS_KEY, Buffer.from(this.status.serializeBinary()));

    return error;
  }

  static fromServiceError(
    error: ServiceError,
    deserializeMap?: DeserializeMap<string, (bytes: Uint8Array) => Message>,
  ): StatusProto | null {
    const dMap = deserializeMap || googleDeserializeMap;
    const statusProto = new StatusProto(error.code, error.message, error.details);

    if (error.metadata?.get(GRPC_ERROR_DETAILS_KEY)?.length > 0) {
      const buffer = error.metadata.get(GRPC_ERROR_DETAILS_KEY)[0];

      if (buffer && typeof buffer !== 'string') {
        const st: Status | undefined = Status.deserializeBinary(buffer);

        const details = st
          .getDetailsList()
          .map((detail) => {
            const deserialize = dMap[detail.getTypeName()];
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

  getDetailDescription() {
    return this.detailDescription;
  }

  getDetails() {
    return this.details;
  }

  addDetail(detail: Message, typeName: string) {
    if (!this.details) this.details = [];
    this.details.push(detail);
    const a = new Any();
    a.pack(detail.serializeBinary(), typeName);
    this.status.addDetails(a);
    return this;
  }

  private addUnpackedDetails(details: Message[]) {
    if (!this.details) this.details = [];
    this.details.push(...details);
    return this;
  }
}

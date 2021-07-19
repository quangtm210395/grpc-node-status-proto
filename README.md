# grpc-node-status-proto

[![Version](https://img.shields.io/npm/v/@nextpay/grpc-node-status-proto.svg)](https://www.npmjs.com/package/@nextpay/grpc-node-status-proto)
[![License](https://img.shields.io/npm/l/@nextpay/grpc-node-status-proto.svg)](https://github.com/quangtm210395/grpc-node-status-proto/blob/master/LICENSE)
[![Build Status](https://github.com/quangtm210395/grpc-node-status-proto/workflows/NPM%20publish/badge.svg?branch=master)](https://github.com/quangtm210395/grpc-node-status-proto/actions)

Utility function for serializing and deserializing between the `grpc-status-details-bin` metadata value and StatusProto
  when using the [node grpc](https://github.com/grpc/grpc-node/tree/master/packages/grpc-native-core) package. Error details allow sending/receiving additional data along with an error. For instance, if a request sends invalid data, a gRPC server could send back a [BadRequest](https://github.com/googleapis/googleapis/blob/master/google/rpc/error_details.proto#L169) message identifying the field and why it failed validation.

gRPC services that send rich error details place information in the `grpc-status-details-bin` metadata property of the [ServiceError](https://grpc.io/grpc/node/grpc.html#~ServiceError) passed to the callback of a failed gRPC method call. The value of the `grpc-status-details-bin` field is a serialized [Status](./proto/status.proto) message. The Status message's details field is an array of [Any](https://github.com/protocolbuffers/protobuf/blob/master/src/google/protobuf/any.proto#L122) messages, which consist of a type field and the serialized data for that message type.

This library, given an error, returns back the both deserialized Status message and an array of deserialized detail messages as a StatusProto object.

## Install

```bash
# yarn
yarn add @nextpay/grpc-node-status-proto

# npm
npm install @nextpay/grpc-node-status-proto
```

## Usage

This library provide methods to serialize and deserialize `grpc-status-details-bin` metadata value and StatusProto when using the [node grpc](https://github.com/grpc/grpc-node/tree/master/packages/grpc-native-core) package.

Version [1.x](https://www.npmjs.com/package/@nextpay/grpc-node-status-proto/v/1.1.6) using [grpc](https://www.npmjs.com/package/grpc)

Version [2.x](https://www.npmjs.com/package/@nextpay/grpc-node-status-proto/v/latest) using new [@grpc/grpc-js](https://www.npmjs.com/package/@grpc/grpc-js)

```js
export class StatusProto<T extends Message> {
  private status: Status | undefined;

  private code: number;

  private message: string;

  private details: Array<T>;
}
```
 
where:
- `status` is a google defined [Status](https://github.com/googleapis/googleapis/blob/master/google/rpc/status.proto#L35)
- `code` is gRPC status Code
- `message` is error message
- and `details` is the `Status`'s details array with each item deserialized and unpacked from an `Any` message to its actual message type. You can create your own message type or checkout [google's defined message types](https://github.com/googleapis/googleapis/blob/master/google/rpc/error_details.proto)


### StatusProto.fromServiceError(error, deserializeMap)

`StatusProto.fromServiceError` allows passing in the `deserializeMap` argument, where each key is a message type and each value is its corresponding deserialize function.
You can use provided `googleDeserializeMap` captured of Google's rpc error details type's deserialize function to deserialize google's Error Details

Example:

```js
import {
  googleDeserializeMap, StatusProto, BadRequest, Status,
} from "@nextpay/grpc-node-status-proto";

// Make grpc call that fails and returns a Status object with
// details in the `grpc-status-details-bin` Metadata property
function hello(message: string, metadata?: any) {
  return new Promise((resolve, reject) => {
    const meta = new Metadata();
    if (metadata) {
      Object.keys(metadata).map((key: string) => {
        meta.add(key, metadata[key]);
        return null;
      });
    }
    let response = {};
    const call: ClientUnaryCall = stub.hello(
      { message }, meta, async (err: any, res: any): Promise<any> => {
        if (err) {
          const statusProto = StatusProto.fromServiceError(err, googleDeserializeMap);
          const details = statusProto.getDetails();
          for (let i = 0; i < details.length; i += 1) {
            const detail = details[i];
            if (detail instanceof BadRequest) {
              console.info('badrequest: ', detail.toObject());
              // TODO do something with bad request error
            }
          }
          console.error('calling greeter.hello failed: ', err);
          reject(err);
          return;
        }
        response = res;
      },
    );
    call.once('status', (status: StatusObject) => {
      resolve({ data: response, meta: status.metadata.getMap() });
    });
  });
}
```

### statusProto.toServiceError()

`statusProto.toServiceError()` convert a StatusProto to grpc 's [ServiceError](https://github.com/grpc/grpc-node/blob/master/packages/grpc-js/src/call.ts#L31)

Example:

```js
import {
  StatusProto, BadRequest, googleErrorDetailsTypeNameMap,
} from "@stackpath/grpc-node-status-proto";

// import others thing from grpc...

// adding hello rpc function
server.addService(Greeter.Greeter.service, {
  hello(call: ServerUnaryCall<any, any>, callback: any) {
    console.info('greeting: ', call.request.message);
    if (!call.request.message) {
      const metadata: Metadata = new Metadata();
      metadata.add('1', '123');
      const br = new BadRequest();
      const fv = new BadRequest.FieldViolation();
      fv.setField('message');
      fv.setDescription('message is missing');
      br.addFieldViolations(fv);

      const statusProto = new StatusProto(status.INVALID_ARGUMENT, 'Required fields must not be null');
      statusProto.addDetail(br, googleErrorDetailsTypeNameMap.BadRequest);
      const error = statusProto.toServiceError();
      return callback(error);
    }
    return callback(null, { message: `hi there from greeter, response for: ${call.request.message}` });
  },
});
```

For full example, checkout [here](https://github.com/quangtm210395/grpc-node-status-proto/tree/master/examples)
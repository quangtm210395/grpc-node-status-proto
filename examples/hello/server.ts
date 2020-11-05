/* eslint-disable no-console */
import {
  Server, ServerCredentials, loadPackageDefinition, ServerUnaryCall, Metadata, status,
} from 'grpc';

import {
  StatusProto, BadRequest, googleErrorDetailsTypeNameMap,
} from '@nextpay/grpc-node-status-proto';

import { loadSync } from '@grpc/proto-loader';

const packageDefinition = loadSync(
  `${__dirname}/greeter.proto`,
  {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
  },
);

const corePackage: any = loadPackageDefinition(packageDefinition).com;
const Greeter = corePackage.greeter;

const server = new Server();
const port = process.env.GRPC_PORT || 8182;

async function start() {
  return new Promise((resolve, reject) => {
    try {
      server.addService(Greeter.Greeter.service, {
        hello(call: ServerUnaryCall<any>, callback: any) {
          console.info('greeting: ', call.request.message);
          if (!call.request.message) {
            const metadata: Metadata = new Metadata();
            metadata.add('1', '123');
            const br = new BadRequest();
            const fv = new BadRequest.FieldViolation();
            fv.setField('message');
            fv.setDescription('message is missing');
            br.addFieldViolations(fv);

            // eslint-disable-next-line no-spaced-func
            const statusProto = new StatusProto(status.INVALID_ARGUMENT, 'Required fields must not be null');
            statusProto.addDetail(br, googleErrorDetailsTypeNameMap.BadRequest);
            const error = statusProto.toServiceError();
            return callback(error);
          }
          return callback(null, { message: `hi there from greeter, response for: ${call.request.message}` });
        },
      });
      server.bind(`0.0.0.0:${port}`, ServerCredentials.createInsecure());
      server.start();
      resolve(`gRPC server started at : ${port}`);
    } catch (error) {
      console.error('Error occurs: ', error);
      reject(error);
    }
  });
}

export default start;

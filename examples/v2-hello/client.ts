/* eslint-disable no-console */
import {
  credentials, loadPackageDefinition, Metadata, ClientUnaryCall, StatusObject,
} from '@grpc/grpc-js';
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

const port = process.env.GRPC_PORT || 8182;
const stub = new Greeter.Greeter(`localhost:${port}`,
  credentials.createInsecure());

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
      { message }, meta, async (err: any, res: any): Promise<void> => {
        if (err) {
          reject(err);
        } else {
          response = res;
        }
      },
    );
    call.once('status', (status: StatusObject) => {
      resolve({ data: response, meta: status.metadata.getMap() });
    });
  });
}

export default {
  hello,
};

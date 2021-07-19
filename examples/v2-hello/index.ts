/* eslint-disable no-console */
import { EventEmitter } from 'events';

// import local files
// import connectMongoDB from './mongodb';
import { BadRequest, googleDeserializeMap, StatusProto } from '@nextpay/grpc-node-status-proto';
import startGrpcServer from './server';
import greeterClient from './client';

const appEvent = new EventEmitter();

(async () => {
  appEvent.on('grpc_server_started', async (message) => {
    console.info(message);

    setTimeout(async () => {
      // test
      try {
        const response = await greeterClient.hello(null);
        console.info('greeter: ', response);
      } catch (err) {
        console.error('Error calling greeter.hello: ', err);
        const statusProto = StatusProto.fromServiceError(err, googleDeserializeMap);
        const details = statusProto.getDetails();
        for (let i = 0; i < details.length; i += 1) {
          const detail = details[i];
          if (detail instanceof BadRequest) {
            console.info('bad request: ', detail.toObject());
            // TODO do something with bad request error
          }
        }
      }
    }, 5000);
  });

  startGrpcServer().then((message) => {
    appEvent.emit('grpc_server_started', message);
  }).catch(() => {
    console.error('Something went wrong! Exit!');
    process.exit(0);
  });
})();

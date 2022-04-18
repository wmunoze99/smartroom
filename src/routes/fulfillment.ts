import {
  smarthome,
  SmartHomeV1ExecuteResponseCommands,
  Headers
} from 'actions-on-google';

import DeviceController from '../controllers/devicesController';
import Reviwer from '../controllers/devicesWatchDog';

const app = smarthome();
const deviceController = new DeviceController();

app.onSync(async (body, headers) => {
  console.log(body, headers);

  const devices = await deviceController.getDevices();

  return {
    requestId: body.requestId,
    payload: {
      agentUserId: "",
      devices: devices
    }
  }
});

app.onExecute(async (body, headers) => {
  const _ = headers;
  const commands: SmartHomeV1ExecuteResponseCommands[] = [];
  const { devices, execution } = body.inputs[0].payload.commands[0];

  console.log("execute")
  console.log(devices, execution, headers);

  for(let device of devices) {
    for(let exec of execution) {
      const response = await deviceController.sendRequestToDevice(device.id, exec);
    }
  }

  commands.push({
    ids: devices.map(device => device.id),
    status: "SUCCESS"
  })

  return {
    requestId: Math.random().toString(),
    payload: {
      commands: commands,
    }
  };
});

app.onQuery(async (body, headers) => {
  const { devices } = body.inputs[0].payload;
  const reviwer = Reviwer.getInstance();

  console.log("Query")
  console.log(headers, devices, body.inputs);

  let devicesStatus: any = {}

  for (let device of devices) {
    devicesStatus[device.id] = reviwer.searchDevice(device.id);
  }

  return {
    requestId: body.requestId,
    payload: {
      devices: devicesStatus
    }
  }
});

app.onDisconnect((body, headers) => {
  return {}
});

export default app;
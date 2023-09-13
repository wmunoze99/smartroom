const { smarthome } = require("actions-on-google");
const app = smarthome();
const { TBAdapter } = require("../services/tbService");
const logger = require("../util/logger");

const tb = TBAdapter.initTB();

app.onSync(async (body) => {
  const devices = tb.devicesAsArray;
  logger.info(
    "[FULLFILMENT] On sync request recieved with ID " + body.requestId
  );

  //console.log(devices[0].traits.map(trait => trait.name));
  const returnDevices = devices.map((device) => {
    const deviceInfo = {
      id: device.id.id,
      type: "action.devices.types." + device.type,
      traits: device.traits.map((_trait) => _trait.trait),
      name: {
        defaultNames: [device.name],
        name: device.name,
        nicknames: [device.name],
      },
      willReportState: false,
      deviceInfo: {
        manufacturer: "Willinton",
        model: "wmunoze1",
        hwVersion: "2",
        swVersion: "1",
      },
    };

    if (device["gAttributes"]) {
      deviceInfo["attributes"] = device["gAttributes"];
    }

    return deviceInfo;
  });

  return {
    requestId: body.requestId,
    payload: {
      devices: returnDevices,
    },
  };
});

app.onQuery(async (body) => {
  const askedDevices = body.inputs[0].payload.devices;
  logger.info("[FULLFILMENT] Recieved query transaction", {
    devices: askedDevices,
    requestId: body.requestId,
  });
  const response = {
    requestId: body.requestId,
    payload: {
      devices: {},
    },
  };

  await Promise.all(
    askedDevices.forEach(async (device) => {
      device = device.id;
      const deviceInfo = tb.getDevice(device);

      response.payload.devices[device] = {
        status: "SUCCESS",
        online: deviceInfo.attributes.active.value,
      };

      console.log(deviceInfo.states);

      if (deviceInfo.states)
        await Promise.all(
          deviceInfo.states.map(async (state) => {
            if (state.rpcAction) {
              try {
                const rpcResponse = await tb.sendDeviceRPC(deviceInfo.id.id, {
                  method: state.rpcAction,
                  params: {},
                });

                console.log(rpcResponse);

                response.payload.devices[device][state.key] =
                  rpcResponse.data.result;
              } catch (err) {
                response.payload.devices[device][state.key] = 0;
                logger.error(
                  `Device ${device} has been reported as offline on transaction ${body.requestId}`
                );
                console.error(err);
              }
            }
            return state;
          })
        );
    })
  );

  return response;
});

app.onExecute((body, headers) => {});

app.onDisconnect((body, headers) => {});

module.exports = app;

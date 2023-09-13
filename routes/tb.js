const express = require('express');
const router = express.Router();
var { TBAdapter } = require('../services/tbService');

const tb = TBAdapter.initTB();

router.post('/attributes/listener', (req, res, next) => {
  console.log("[TB listener] Message received from Rule Chain");

  try {
    const response = tb.updateAttributes(req.headers.device, req.body);
    res.json(response).status(200);
  } catch (err) {
    console.error(err);
    res.status(500);
  }
});

router.post('/device/listener', (req, res, next) => {
  console.log("[TB listener] Message received from Rule Chain");
  console.log("[TB listener] Device will be proccess by the action", req.body.eventType);

  switch (req.body.eventType) {
    case "ENTITY_CREATED": {
      const response = tb.addNewDevice(req.body);

      res.json(response).status(200);
      break;
    };
    case "ENTITY_UPDATED": {
      const response = tb.updateDevice(req.body);

      res.json(response).status(200);
      break;
    }
    case "ENTITY_DELETED": {
      const response = tb.deleteDevice(req.body);

      res.json(response).status(200);
      break;
    }
    default:
      res.json({
        message: "Unrecognized operation",
        code: -001,
        type: "Fatal Error"
      }).status(500);
      break;
  }
});

router.post('/device/status', (req, res, next) => {
  console.log("[TB listener] Device connection event");
  console.log(`[TB] Device ${req.headers.device} will be procces to ${req.body.msgType}`)
  let connection = -1;

  switch (req.body.msgType) {
    case 'CONNECT_EVENT':
      connection = true;
      break;
    case 'DISCONNECT_EVENT':
      connection = false;
      break;
    default: {
      res.json({
        message: "Unrecognized operation",
        code: -001,
        type: "Fatal Error"
      }).status(500);
    }
  }

  const response = tb.updateDeviceStatus(req.headers.device, connection);

  res.json(response).status(200);
});

module.exports = router;
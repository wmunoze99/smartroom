const express = require('express');
const router = express.Router();
var { TBAdapter } = require('../services/tbService');

const tb = TBAdapter.initTB();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.json({ title: 'Express', date: new Date().toString(), TBState: tb.state, devices: tb.countDevices });
});

router.get('/devices', function (req, res, next) {
  res.json(tb.getDevices);
});

router.get('/credentials', function (req, res, next) {
  res.json(Object.keys(tb.getDevices).map(key => tb.getDevices[key].credential));
});

router.get('/test', function (req, res) {
  const devices = tb.devicesAsArray;
  res.json(devices.map(device => {
    const deviceInfo = {
      id: device.id.id,
      type: "action.devices.types." + device.type,
      traits: device.traits.map((_trait) => _trait.trait),
      name: {
        defaultNames: [device.name],
        name: device.name,
        nicknames: [device.name]
      },
      willReportState: false,
      deviceInfo: {
        manufacturer: "Willinton",
        model: "wwww",
        hwVersion: "2",
        swVersion: "1"
      }
    }
    if (device['gAttributes']) {
      deviceInfo['attributes'] = device['gAttributes'];
    }

    return deviceInfo
  }));

});

module.exports = router;

const express = require('express');
const router = express.Router();
const DB = require('../services/mongo').getInstance();
const logger = require('../util/logger');

router.post('/add', async (req, res) => {
  const data = req.body;
  const Trait = await DB.getModel('Traits');
  const traits = await Trait.find({ name: data.associatedTraits }).exec();

  if (!traits && traits.length === 0)
    res.status(400).json({
      status: "error",
      message: `Trait with name ${data.name} not found`,
      code: '002',
      traceback: null,
      date: Date.now(),
      data
    });
  else {
    const DeviceType = await DB.getModel('DeviceTypes');
    const newDevice = new DeviceType({
      name: data.name.toUpperCase(),
      associatedTraits: traits,
      type: data.type,
      attributes: data.attributes,
      states: data.states,
      commands: data.commands
    });

    try {
      await newDevice.save();
      res.json({
        status: "Ok",
        data: newDevice,
        message: 'Device created',
        date: Date.now()
      });
    } catch (error) {
      logger.error(error);
      res.status(400).json({
        status: "error",
        message: `Error saving the device`,
        code: '004',
        traceback: error,
        date: Date.now(),
        data
      });
    }
  }
});

router.get('/traits', async (req, res) => {
  const Trait = await DB.getModel('Traits');
  try {
    const traits = await Trait.find({}).exec();

    res.json({
      status: "Ok",
      data: traits,
      message: "Traits retrived",
      date: Date.now()
    });
  } catch (error) {
    logger.error(error);
    res.status(400).json({
      status: "error",
      message: 'Error fetching the traits.',
      code: '003',
      traceback: error,
      date: Date.now(),
      data: null
    });
  }
});

router.get('/', async (req, res) => {
  const DeviceType = await DB.getModel('DeviceTypes');

  try {
    const devices = await DeviceType.find({}).exec();

    res.json({
      status: "Ok",
      data: devices,
      message: "Devices retrived",
      date: Date.now()
    });
  } catch (error) {
    logger.error(error);
    res.status(400).json({
      status: "error",
      message: 'Error getting the devices.',
      code: '005',
      traceback: error,
      date: Date.now(),
      data: newTrait
    });
  }
});

router.post('/add/traits', async (req, res) => {
  const data = req.body;
  const Trait = await DB.getModel('Traits');

  const newTrait = new Trait({
    name: data.name,
    params: data.params,
    trait: data.trait
  });

  try {
    await newTrait.save()
    res.json({
      status: "Ok",
      data: newTrait,
      message: 'Trait created',
      date: Date.now()
    });
  } catch (error) {
    logger.error(error);
    res.status(400).json({
      status: "error",
      message: 'Error saving the trait.',
      code: '001',
      traceback: error,
      date: Date.now(),
      data: newTrait
    });
  }
});

module.exports = router;
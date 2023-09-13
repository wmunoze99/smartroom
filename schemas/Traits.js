const mongoose = require('mongoose');

module.exports = new mongoose.Schema({
  name: String,
  params: [new mongoose.Schema({
    type: String,
    key: String
  })],
  trait: String
});
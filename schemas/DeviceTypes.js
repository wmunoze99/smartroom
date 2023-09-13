const { Schema, ObjectId } = require("mongoose");
const Traits = require("./Traits");

module.exports = Schema({
  name: String,
  associatedTraits: [Traits],
  type: String,
  attributes: {},
  states: [new Schema({
    key: String,
    type: String,
    rpcAction: String
  })],
  commands: [new Schema({
    command: String,
    key: String,
    type: String,
    rpcAction: String
  })]
});

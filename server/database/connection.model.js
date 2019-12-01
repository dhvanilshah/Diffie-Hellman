const mongoose = require("mongoose");

//simple schema
const ConnectionSchema = new mongoose.Schema({
  secret_key: {
    type: String,
    required: true
  }
});

const Connection = mongoose.model("Connection", ConnectionSchema);

exports.Connection = Connection;

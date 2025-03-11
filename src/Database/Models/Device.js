// models/device.js
const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceName: {
    type: String,
    required: true,
  },
  deviceCode: {
    type: String,
    required: true,
    unique: true,
    length: 16,
  },
  nickname: {
    type: String,
  },
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);

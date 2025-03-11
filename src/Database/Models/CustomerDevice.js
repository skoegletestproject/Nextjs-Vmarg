import mongoose from 'mongoose';

const customerDeviceSchema = new mongoose.Schema({
  custommerId: { type: String, required: true },
//   deviceCode: { type: String, required: true },
  nickname: { type: String },
  deviceName: { type: String, required: true },
}, { timestamps: true });

const CustomerDevice = mongoose.model('CustomerDevice', customerDeviceSchema);

export default CustomerDevice;

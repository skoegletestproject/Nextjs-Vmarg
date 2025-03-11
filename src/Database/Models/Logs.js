import mongoose from "mongoose";
const logSchema = new mongoose.Schema({
    deviceName: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    date: { type: String, required: true }, 
    time: { type: String, required: true } 
  });
  
const Log = mongoose.model("Logs", logSchema);




export default Log
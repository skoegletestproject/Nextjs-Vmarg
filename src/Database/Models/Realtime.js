import mongoose from "mongoose";

const realtime = new mongoose.Schema({
    deviceName: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    date: { type: String, required: true }, 
    time: { type: String, required: true } 
  });
  
const Realtime = mongoose.model("Realtime", realtime);


export default Realtime
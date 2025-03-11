import mongoose from 'mongoose';

const geoFencingSchema = new mongoose.Schema({
    customerId: {
        type: String,
        required: true
    },
    deviceName: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    radius: { 
         type: Number,
         required: true,
          default: 1 
        },
    lastTriggered: {
         type: String,
          enum: ["inside", "outside", null], 
          default: null 
        }
});

const GeoFencing = mongoose.model('GeoFencing', geoFencingSchema);

export default GeoFencing; 
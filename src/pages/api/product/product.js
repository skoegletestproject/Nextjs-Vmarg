import connectDB from "@/Database/db";
import verifyDevice from "@/Middlewares/verify";
import GeoFencing from "@/Database/Models/GeoFencing";
import Realtime from "@/Database/Models/Realtime";
import Log from "@/Database/Models/Logs";
import haversineDistance from "@/Utils/haversineDistance";

// ✅ Device Logs API
const DeviceLogs = async (req, res) => {
  try {
    const { deviceName, latitude, longitude, date, time, homelat, homelong, rad } = req.body;
    const geoFencings = await GeoFencing.findOneAndUpdate(
      { deviceName },
      { latitude: homelat, longitude: homelong, radius: rad },
      { new: true, upsert: true }
    );

    if (!geoFencings) {
      return res.status(404).json({ message: "Geofencing data not found for device" });
    }

    const { latitude: fixedLat, longitude: fixedLong, radius, lastTriggered } = geoFencings;
    const distance = haversineDistance(fixedLat, fixedLong, latitude, longitude);

    let geofencing = { activated: false, status: lastTriggered, fixedLat, fixedLong };

    if (distance > radius) {
      if (lastTriggered === "inside" || lastTriggered === null) {
        console.log(`🚨 Geofencing Activated: Device ${deviceName} moved out of ${radius} km range!`);
        geofencing = { activated: true, status: "outside" };
        await GeoFencing.findOneAndUpdate({ deviceName }, { lastTriggered: "outside" });
      }
    } else if (lastTriggered === "outside") {
      console.log(`✅ Geofencing Deactivated: Device ${deviceName} is back inside the ${radius} km range.`);
      geofencing = { activated: true, status: "inside", fixedLat, fixedLong };
      await GeoFencing.findOneAndUpdate({ deviceName }, { lastTriggered: "inside" });
    }

    const newLog = new Log({ deviceName, latitude, longitude, date, time });
    await newLog.save();

    await Realtime.findOneAndUpdate(
      { deviceName },
      { latitude, longitude, date, time },
      { new: true, upsert: true }
    );

    const location = { latitude: newLog.latitude, longitude: newLog.longitude, distance };

    res.status(201).json({ message: "Logs Created", geofencing, location });
  } catch (error) {
    res.status(500).json({ message: "Error creating log", error });
  }
};

// ✅ Add Device to Real-time Collection
const addDeviceRealtime = async (req, res) => {
  try {
    const { deviceName, latitude, longitude, date, time } = req.body;

    const checkDevice = await Realtime.findOne({ deviceName });
    if (checkDevice) {
      return res.status(400).json({ message: "Device Exists" });
    }

    const newLog = new Realtime({ deviceName, latitude, longitude, date, time });
    await newLog.save();

    res.status(201).json({ message: "Log created successfully", log: newLog });
  } catch (error) {
    res.status(500).json({ message: "Error creating log", error });
  }
};

// ✅ Update Real-time Device Data
const DeviceRealTime = async (req, res) => {
  try {
    const { deviceName } = req.params;
    const { latitude, longitude, date, time } = req.body;

    const updatedRealtime = await Realtime.findOneAndUpdate(
      { deviceName },
      { latitude, longitude, date, time },
      { new: true, upsert: true }
    );

    res.status(200).json({ message: "Real-time data updated", realtime: updatedRealtime });
  } catch (error) {
    res.status(500).json({ message: "Error updating real-time data", error });
  }
};

// ✅ Get Device Logs
const GetDeviceLogs = async (req, res) => {
  const { deviceName, fromDate, toDate, fromTime, toTime } = req.query;

  try {
    const query = {};
    if (deviceName) query.deviceName = deviceName;

    if (fromDate && toDate) {
      query.date = { $gte: fromDate, $lte: toDate };
    }

    if (fromTime && toTime) {
      query.time = { $gte: fromTime, $lte: toTime };
    }

    const logs = await Log.find(query).sort({ date: 1, time: 1 }).select("deviceName latitude longitude date time");

    if (!logs.length) {
      return res.status(404).json({ message: "No logs found for the specified filters" });
    }

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: "Error fetching logs", error });
  }
};


const GetRealtime = async (req, res) => {
  try {
    const { deviceName } = req.query;
    console.log("deviceName", deviceName);
    const result = await Realtime.findOne({ deviceName });

    if (!result) {
      return res.status(404).json({ message: "Device not found in real-time database" });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: "Error fetching real-time data", error });
  }
};

export default async function handler(req, res) {
  await connectDB();

  return verifyDevice(req, res, async () => {
    const { method, url } = req;
    const action = req.query.action;
    if (method === "GET") {
      if (action==="logs") return GetDeviceLogs(req, res);
      if (action ==="realtime") return GetRealtime(req, res);
    } else if (method === "POST") {
      if (action==="logs") return DeviceLogs(req, res);
      if (action ==="realtime") return addDeviceRealtime(req, res);
    } else if (method === "PUT") {
      if (action ==="realtime") return DeviceRealTime(req, res);
    } else {
      res.setHeader("Allow", ["GET", "POST", "PUT"]);
      return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  });
}

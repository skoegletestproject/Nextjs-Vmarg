import connectDB from "@/Database/db";
import verifyDevice from "@/Middlewares/verify";
import Device from "@/Database/Models/Device";
import User from "@/Database/Models/user";
import CustomerDevice from "@/Database/Models/CustomerDevice";

const generateDeviceCode = () => {
    return Math.random().toString().slice(2, 18);
};

// ✅ Add Device for Registration (Protected)
const AddDeviceforRegister = async (req, res) => {
    try {
        const { deviceName, nickname } = req.body;

        // Check if a device with the same name exists
        const existingDevice = await Device.findOne({ deviceName });
        if (existingDevice) {
            return res.status(400).json({ error: "Device with this name already exists" });
        }

        // Generate unique 16-digit device code
        let deviceCode;
        let isUnique = false;
        while (!isUnique) {
            deviceCode = generateDeviceCode();
            const duplicateCode = await Device.findOne({ deviceCode });
            if (!duplicateCode) isUnique = true;
        }

        const newDevice = new Device({ deviceName, deviceCode, nickname });
        await newDevice.save();
        res.status(201).json(newDevice);
    } catch (error) {
        res.status(500).json({ error: "Failed to create device", details: error.message });
    }
};

// ✅ Get All Registered Devices (Protected)
const GetAddedDevices = async (req, res) => {
    try {
        const devices = await Device.find();
        res.status(200).json(devices);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch devices" });
    }
};

// ✅ Update Registered Device (Protected)
const UpdateRegisteredDevice = async (req, res) => {
    try {
        const { deviceName, nickname } = req.body;
        const device = await Device.findByIdAndUpdate(req.params.id, { deviceName, nickname }, { new: true });
        if (!device) return res.status(404).json({ error: "Device not found" });
        res.status(200).json(device);
    } catch (error) {
        res.status(500).json({ error: "Failed to update device" });
    }
};

// ✅ Delete Device (Protected)
const DeleteDevice = async (req, res) => {
    try {
        const device = await Device.findByIdAndDelete(req.params.id);
        if (!device) return res.status(404).json({ error: "Device not found" });
        res.status(200).json({ message: "Device deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete device" });
    }
};

// ✅ Verify User with Device (Protected)
const VerifyUserWithDevice = async (req, res) => {
    try {
        const { deviceName, deviceCode,  nickname } = req.body;
        const { custommerId } = req.user;
        const device = await Device.findOne({ deviceName, deviceCode });
        if (!device) {
            return res.status(400).json({ error: "Device not found or incorrect details provided" });
        }

        const user = await User.findOne({ custommerId });
        if (!user) {
            return res.status(404).json({ error: "Customer not found" });
        }

        const isDeviceAssigned = user.device.some(d => d.deviceCode === deviceCode);
        if (isDeviceAssigned) {
            return res.status(400).json({ error: "Device is already assigned to this customer" });
        }

        user.device.push({ deviceName, deviceCode, nickname: nickname || device.nickname || "" });
        await user.save();

        const existingCustomerDevice = await CustomerDevice.findOne({ custommerId, deviceCode });
        if (existingCustomerDevice) {
            existingCustomerDevice.nickname = nickname || device.nickname || "";
            await existingCustomerDevice.save();
        } else {
            const customerDevice = new CustomerDevice({ custommerId, deviceCode, deviceName, nickname: nickname || device.nickname || "" });
            await customerDevice.save();
        }

        res.status(200).json({ message: "Device verified and assigned successfully", user });
    } catch (error) {
        res.status(500).json({ error: "Failed to verify and assign device", details: error.message });
    }
};

// ✅ Add Device by Admin (Protected)
const AddDeviceByAdmin = async (req, res) => {
    try {
        const { custommerId, deviceName, nickname } = req.body;

        const existingRecord = await CustomerDevice.findOne({ custommerId });
        if (existingRecord) {
            return res.status(400).json({ error: "Device is already assigned to this customer" });
        }

        const customerDevice = new CustomerDevice({ custommerId, deviceName, nickname: nickname || "" });
        await customerDevice.save();
        res.status(201).json({ message: "Device added to CustomerDevice collection successfully", customerDevice });
    } catch (error) {
        res.status(500).json({ error: "Failed to add device to CustomerDevice collection", details: error.message });
    }
};

// ✅ Delete Device for a User (Protected)
const DeleteDeviceForUser = async (req, res) => {
    try {
        const { deviceName } = req.body;
        const { custommerId } = req.user;

        const user = await User.findOne({ custommerId });
        if (!user) {
            return res.status(404).json({ error: "Customer not found" });
        }

        const deviceIndex = user.device.findIndex(d => d.deviceName === deviceName);
        if (deviceIndex === -1) {
            return res.status(400).json({ error: "Device not found in user device list" });
        }

        user.device.splice(deviceIndex, 1);
        await user.save();

        const customerDevice = await CustomerDevice.findOneAndDelete({ custommerId, deviceName });
        if (!customerDevice) {
            return res.status(400).json({ error: "Device not found in CustomerDevice collection" });
        }

        res.status(200).json({ message: "Device removed successfully from both collections" });
    } catch (error) {
        res.status(500).json({ error: "Failed to remove device", details: error.message });
    }
};


const getDevices = async (req, res) => {
    const { custommerId } =  req.user;

    try {
        const user = await User.findOne({ custommerId });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ devices: user.device });
    } catch (error) {
        console.error(error);
        res
            .status(500)
            .json({ message: "An error occurred while retrieving devices.", error });
    }
};

export default async function handler(req, res) {
    await connectDB();

    return verifyDevice(req, res, async () => {
        const { method ,url} = req;
        const action = req.query.action;

        
        if (method === "GET") {

            if(action === "getdevices"){
                return getDevices(req, res);
            }
            return GetAddedDevices(req, res);
        } else if (method === "POST") {

            if (action === "verify") {
                return VerifyUserWithDevice(req, res);
            } else {
                console.log("action",action)
                return AddDeviceforRegister(req, res);
            }
        } else if (method === "PUT") {
            return UpdateRegisteredDevice(req, res);
        } else if (method === "DELETE") {
            if(action=== "deletedevice"){
                return DeleteDeviceForUser(req, res);
            }else{
            return DeleteDevice(req, res);
            }
        } else {
            res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
            return res.status(405).json({ message: `Method ${method} Not Allowed` });
        }
    });
}

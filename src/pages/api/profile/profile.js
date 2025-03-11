import connectDB from "@/Database/db";
import User from "@/Database/Models/user";
import verifyDevice from "@/Middlewares/verify";
import bcrypt from "bcryptjs";

export default async function handler(req, res) {
    await connectDB();

    return verifyDevice(req, res, async () => {
        const { method } = req;

        switch (method) {
            case "GET":
                return getUserProfile(req, res);
            case "PUT":
                return UpdateUserProfile(req, res); 
            case "POST":
                return verifyPassword(req, res);
            default:
                res.setHeader("Allow", ["GET", "PUT", "POST"]);
                return res.status(405).json({ message: `Method ${method} Not Allowed` });
        }
    });
}


const getUserProfile = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { custommerId } = req.user;

    try {
        const user = await User.findOne({ custommerId }).select("-isAdmin -__v -device -_id -custommerIdVersions");

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error retrieving user details.", error });
    }
};

// 📌 Update User Profile
const UpdateUserProfile = async (req, res) => { // ✅ Fix: Use the same function name everywhere
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const { custommerId } = req.user;
    const updates = req.body;

    // Restrict updates to exclude sensitive fields
    const restrictedFields = ["custommerId", "device", "isAdmin", "__v"];
    const filteredUpdates = Object.keys(updates)
        .filter((key) => !restrictedFields.includes(key))
        .reduce((obj, key) => ({ ...obj, [key]: updates[key] }), {});

    try {
        const user = await User.findOneAndUpdate(
            { custommerId },
            { $set: filteredUpdates },
            { new: true, fields: "-isAdmin -__v -device -custommerId" }
        );

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        res.status(200).json({ message: "User details updated successfully.", user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating user details.", error });
    }
};

// 📌 Verify Password
const verifyPassword = async (req, res) => {
    const { custommerId, password } = req.body;

    if (!custommerId || !password) {
        return res.status(400).json({ message: "Customer ID and Password must be provided." });
    }

    try {
        const user = await User.findOne({ custommerId });

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        res.status(200).json({ matched: isMatch });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error verifying password.", error });
    }
};

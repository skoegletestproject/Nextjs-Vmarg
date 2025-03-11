import jwt from "jsonwebtoken";

import User from "@/Database/Models/user";
import cookie from "cookie";
import DeviceToken from "@/Database/Models/DeviceToken";
import connectDB from "@/Database/db";

const verifyJWTAndDevice = async (req, res) => {

  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed", valid: false });
  }

  try {
       await connectDB()
    const authHeader = req.headers.authorization || "";
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = authHeader.split(" ")[1] || cookies.auth_token; // No query parameters

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided", valid: false });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const { custommerId, deviceString } = decoded;

    // Check if the device exists in the database
    const validDevice = await DeviceToken.findOne({ custommerId, deviceString });
    const userdata = await User.findOne({ custommerId });

    if (!validDevice) {
      res.setHeader("Set-Cookie", "auth_token=; HttpOnly; Secure; Max-Age=0; SameSite=Strict");
      return res.status(401).json({ message: "Unauthorized: Invalid device", valid: false });
    }

    res.json({ message: "User and device verified", valid: true, isAdmin: userdata?.isAdmin });
  } catch (error) {
    console.error("Error in JWT or device verification:", error);
    res.status(401).json({ message: "Unauthorized: Invalid token or device", valid: false });
  }
};

export default verifyJWTAndDevice;

import crypto from "crypto";
import User from "@/Database/Models/user";
import jwt from "jsonwebtoken";
import connectDB from "@/Database/db";
import DeviceToken from "@/Database/Models/DeviceToken";


export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await connectDB(); // Ensure database connection

    const { email, password, devicedetails } = req.body;

    if (!email || !password || !devicedetails) {
      return res.status(400).json({ message: "Email, password, and device details are required", valid: false });
    }

    let user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Please create an account", valid: false });
    }

    if (user.password !== password) {
      return res.status(401).json({ message: "Incorrect email or password", valid: false });
    }

    const deviceString = `DV-${crypto.randomInt(1000000, 9999999)}`;
    const newDevice = new DeviceToken ({
      custommerId: user.custommerId,
      deviceString,
      devicedetails: JSON.stringify(devicedetails),
      email: user.email,
    });

    await newDevice.save();

    const token = jwt.sign(
      { custommerId: user.custommerId, deviceString },
      process.env.JWT_SEC,
      { expiresIn: "2h" }
    );

    const isProduction = process.env.NODE_ENV === "production";
    res.setHeader("Set-Cookie", `auth_token=${token}; HttpOnly; Secure=${isProduction}; Max-Age=${2 * 60 * 60}; SameSite=${isProduction ? "Strict" : "Lax"}`);

    res.status(200).json({ 
      message: "Login successful", 
      valid: true, 
      token, 
      isAdmin: user.isAdmin, 
      custommerId: user.custommerId 
    });
  } catch (error) {
    console.error("Error in Login:", error);
    res.status(500).json({ message: "An error occurred during login", valid: false });
  }
}

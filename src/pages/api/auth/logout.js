import jwt from "jsonwebtoken";
import cookie from "cookie";
import DeviceToken from "@/Database/Models/DeviceToken";

const logout = async (req, res) => {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method Not Allowed", valid: false });
  }

  try {
    const authHeader = req.headers.authorization || "";
    const cookies = cookie.parse(req.headers.cookie || "");
    const token = authHeader.split(" ")[1] || cookies.auth_token; // No query parameters

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No token provided", valid: false });
    }
    const decoded = jwt.verify(token, process.env.JWT_SEC);
    const { custommerId, deviceString } = decoded;

    if (!custommerId || !deviceString) {
      return res.status(400).json({
        message: "Bad Request: Missing customer or device details",
        valid: false,
      });
    }
    const deletedDevice = await DeviceToken.findOneAndDelete({ custommerId, deviceString });

    if (!deletedDevice) {
      return res.status(404).json({
        message: "Device not found or already logged out",
        valid: false,
      });
    }
    res.setHeader("Set-Cookie", "auth_token=; HttpOnly; Secure; Max-Age=0; SameSite=Strict");

    res.status(200).json({ message: "Logout successful", valid: true });
  } catch (error) {
    console.error("Error during logout:", error);
    res.status(500).json({ message: "An error occurred during logout", valid: false });
  }
};

export default logout;

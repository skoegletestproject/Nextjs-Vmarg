import jwt from "jsonwebtoken";
import cookie from "cookie";
import DeviceToken from "@/Database/Models/DeviceToken";
import connectDB from "@/Database/db";

const verifyDevice = async (req, res, next) => {
    await connectDB();

    try {
        const authHeader = req.headers.authorization || "";
        const cookies = cookie.parse(req.headers.cookie || "");
        const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : cookies.auth_token; 
console.log(token);
        if (!token) {
            return res.status(401).json({ message: "Unauthorized: No token provided", valid: false });
        }

        // Verify JWT token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SEC);
            console.log(decoded);
        } catch (err) {
            return res.status(401).json({ message: "Unauthorized: Invalid or expired token", valid: false });
        }

        const { custommerId, deviceString } = decoded;
        const validDevice = await DeviceToken.findOne({ custommerId, deviceString });

        if (!validDevice) {
            res.setHeader("Set-Cookie", `auth_token=; Path=/; HttpOnly; Max-Age=0;`);
            return res.status(401).json({ message: "Unauthorized: Invalid DeviceToken", valid: false });
        }

        req.user = { custommerId, deviceString };
        next();
    } catch (error) {
        console.error("Error in JWT or DeviceToken verification:", error);

        res.setHeader("Set-Cookie", `auth_token=; Path=/; HttpOnly; Max-Age=0;`);
        return res.status(401).json({ message: "Unauthorized: Token verification failed", valid: false });
    }
};

export default verifyDevice;

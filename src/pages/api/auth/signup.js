import crypto from "crypto";
import User from "@/Database/Models/user";
import connectDB from "@/Database/db";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    await connectDB()
    const { firstName, lastName, email, phoneNumber, password, custommerId } =
      req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.send({ message: "User already exists", valid: false });
    }

    let generatedCustomerId =
      custommerId || `CUST-${crypto.randomInt(100000000, 999999999)}`;

    const existingUser = await User.findOne({ custommerId });

    if (existingUser) {
      let versionNumber = 1;
      let newCustommerId = `${generatedCustomerId}_${versionNumber}`;

      while (await User.findOne({ custommerId: newCustommerId })) {
        versionNumber++;
        newCustommerId = `${generatedCustomerId}_${versionNumber}`;
      }

      generatedCustomerId = newCustommerId;
    }

    const newUser = new User({
      firstName,
      lastName,
      email,
      phoneNumber,
      password,
      custommerId: generatedCustomerId,
      custommerIdVersions: [generatedCustomerId],
    });

    await newUser.save();
    res.send({
      message: `User registered successfully with Email ${newUser?.email} and CustommerId ${newUser?.custommerId}`,
      valid: true,
    });
  } catch (error) {
    console.error("Error in SignUp:", error);
    res.status(500).send({ message: "An error occurred during signup", valid: false });
  }
}

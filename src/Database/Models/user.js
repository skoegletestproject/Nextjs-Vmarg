import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  device: { type: Array, default: [] },
  isAdmin: { type: Boolean, default: false },
  custommerId: { type: String },  
  custommerIdVersions: { type: [String], default: [] } 
});

const User = mongoose.model("DraftUser", userSchema);

export default User;
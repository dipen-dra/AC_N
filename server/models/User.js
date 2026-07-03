const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  passwordHash: { type: String, required: true },
  points: { type: Number, default: 0 },
  tier: { type: String, default: "Bronze" },
  initial: { type: String, required: true },
  status: { type: String, default: "Active" },
  role: { type: String, default: "Customer" }, // Customer, Admin, Superadmin
  avatar: { type: String, default: null } // base64 or URL
});

module.exports = mongoose.model("User", userSchema);

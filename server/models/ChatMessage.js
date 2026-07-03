const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  role: { type: String, required: true }, // user, bot
  text: { type: String, required: true },
  time: { type: String, required: true }
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);

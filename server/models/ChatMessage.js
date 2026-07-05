const mongoose = require("mongoose");

const chatMessageSchema = new mongoose.Schema({
  userEmail: { type: String, required: true }, // The customer's email (identifies the thread)
  senderEmail: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true }, // Customer, Admin, bot
  text: { type: String, required: true },
  time: { type: String, required: true },
  read: { type: Boolean, default: false },
  clearedByCustomer: { type: Boolean, default: false }
});

module.exports = mongoose.model("ChatMessage", chatMessageSchema);

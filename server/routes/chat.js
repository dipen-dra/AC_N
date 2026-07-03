const express = require("express");
const ChatMessage = require("../models/ChatMessage");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

// GET SUPPORT CHAT MESSAGES
router.get("/", requireAuth, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userEmail: req.user.email }).sort({ _id: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat." });
  }
});

// SEND MESSAGE
router.post("/", requireAuth, async (req, res) => {
  try {
    const { role, text } = req.body;
    if (!role || !text) {
      return res.status(400).json({ error: "Role and text are required." });
    }

    const newMessage = new ChatMessage({
      userEmail: req.user.email,
      role,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
    await newMessage.save();

    res.json({ success: true, message: newMessage });
  } catch (err) {
    res.status(500).json({ error: "Failed to save chat message." });
  }
});

module.exports = router;

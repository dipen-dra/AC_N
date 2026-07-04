const express = require("express");
const ChatMessage = require("../models/ChatMessage");
const { requireAuth, requireRole } = require("../middleware/auth");

const router = express.Router();

// 1. GET ALL MESSAGES (Admin gets all threads, Customer gets their thread)
router.get("/", requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Admin" || req.user.role === "Superadmin") {
      // Admins get everything to build the threads list
      query = {};
    } else {
      // Customers only get their own thread
      query = { userEmail: req.user.email };
    }
    const messages = await ChatMessage.find(query).sort({ _id: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Failed to load chat." });
  }
});

// 2. SEND CHAT MESSAGE
router.post("/", requireAuth, async (req, res) => {
  try {
    const { text, recipientEmail } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Message text is required." });
    }

    let userEmail, senderRole, senderEmail, senderName;

    if (req.user.role === "Admin" || req.user.role === "Superadmin") {
      if (!recipientEmail) {
        return res.status(400).json({ error: "Recipient email is required for admins." });
      }
      userEmail = recipientEmail;
      senderRole = "Admin";
      senderEmail = req.user.email;
      senderName = req.user.name;
    } else {
      userEmail = req.user.email;
      senderRole = "Customer";
      senderEmail = req.user.email;
      senderName = req.user.name;
    }

    const newMessage = new ChatMessage({
      userEmail,
      senderEmail,
      senderName,
      senderRole,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      read: false
    });
    await newMessage.save();

    // Customer first message auto-response bot simulation if needed
    if (senderRole === "Customer") {
      const msgCount = await ChatMessage.countDocuments({ userEmail: req.user.email });
      if (msgCount === 1) {
        // Trigger automated bot welcome message
        setTimeout(async () => {
          try {
            const botMessage = new ChatMessage({
              userEmail: req.user.email,
              senderEmail: "bot@autocare.np",
              senderName: "AI Assistant",
              senderRole: "bot",
              text: "Hello! 👋 I'm your AutoCare AI Assistant. An agent has been notified and will join shortly. How can I help you today?",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              read: false
            });
            await botMessage.save();
          } catch (err) {
            console.error("Bot auto-reply failed:", err);
          }
        }, 1000);
      }
    }

    res.json({ success: true, message: newMessage });
  } catch (err) {
    res.status(500).json({ error: "Failed to save chat message." });
  }
});

// 3. MARK MESSAGES AS READ/SEEN
router.patch("/read", requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Admin" || req.user.role === "Superadmin") {
      const { userEmail } = req.body;
      if (!userEmail) return res.status(400).json({ error: "userEmail is required." });
      // Admin marks Customer/bot messages as read
      query = { userEmail, senderRole: { $in: ["Customer", "bot"] }, read: false };
    } else {
      // Customer marks Admin messages as read in their thread
      query = { userEmail: req.user.email, senderRole: "Admin", read: false };
    }

    await ChatMessage.updateMany(query, { $set: { read: true } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark messages as read." });
  }
});

module.exports = router;

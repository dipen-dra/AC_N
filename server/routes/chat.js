const express = require("express");
const ChatMessage = require("../models/ChatMessage");
const Settings = require("../models/Settings");
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
      // Customers only get their own thread and exclude messages they have cleared
      query = { userEmail: req.user.email, clearedByCustomer: { $ne: true } };
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
      // Process AI auto-reply asynchronously
      setTimeout(async () => {
        try {
          const settings = await Settings.findOne();
          if (!settings || !settings.aiChatbotAutoReply) {
            return; // Bot is disabled
          }

          // Fetch up to last 10 messages for context
          const history = await ChatMessage.find({ userEmail: req.user.email })
            .sort({ _id: -1 })
            .limit(10);
          
          const apiMessages = [
            { 
              role: "system", 
              content: "You are the AutoCare Nepal AI Assistant. You help customers with vehicle service bookings, tracking, and general inquiries. Be concise, polite, and helpful." 
            }
          ];

          history.reverse().forEach(msg => {
            apiMessages.push({
              role: msg.senderRole === "Customer" ? "user" : "assistant",
              content: msg.text
            });
          });

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
              "HTTP-Referer": "http://localhost:5173",
              "X-Title": "AutoCare Nepal",
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "openai/gpt-4o",
              max_tokens: 1000,
              messages: apiMessages
            })
          });

          if (!response.ok) {
            console.error("OpenRouter API error:", response.statusText);
            return;
          }

          const data = await response.json();
          const replyText = data.choices?.[0]?.message?.content;

          if (replyText) {
            const botMessage = new ChatMessage({
              userEmail: req.user.email,
              senderEmail: "bot@autocare.np",
              senderName: "AI Assistant",
              senderRole: "bot",
              text: replyText,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              read: false
            });
            await botMessage.save();
          }
        } catch (err) {
          console.error("AI auto-reply failed:", err);
        }
      }, 0);
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

// 4. CLEAR CHAT HISTORY
router.delete("/", requireAuth, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "Admin" || req.user.role === "Superadmin") {
      const { userEmail } = req.body;
      if (!userEmail) return res.status(400).json({ error: "userEmail is required." });
      query = { userEmail };
      // Admins permanently delete the thread
      await ChatMessage.deleteMany(query);
    } else {
      query = { userEmail: req.user.email };
      // Customers just hide the thread from their view
      await ChatMessage.updateMany(query, { $set: { clearedByCustomer: true } });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to clear chat history." });
  }
});

module.exports = router;

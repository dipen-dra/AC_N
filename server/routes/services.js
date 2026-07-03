const express = require("express");
const Service = require("../models/Service");

const router = express.Router();

// GET SERVICES
router.get("/", async (req, res) => {
  try {
    const services = await Service.find({});
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch services." });
  }
});

module.exports = router;

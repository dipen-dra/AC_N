const mongoose = require("mongoose");

const serviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  desc: { type: String, required: true },
  price: { type: Number, required: true },
  duration: { type: String, required: true },
  category: { type: String, required: true },
  popular: { type: Boolean, default: false },
  features: [String]
});

module.exports = mongoose.model("Service", serviceSchema);

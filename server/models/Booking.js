const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer: { type: String, required: true },
  customerEmail: { type: String, required: true },
  service: { type: String, required: true },
  vehicle: { type: String, required: true },
  date: { type: String, required: true },
  time: { type: String, required: true },
  location: { type: String, required: true },
  price: { type: Number, required: true },
  status: { type: String, default: "Upcoming" }, // Upcoming, Confirmed, In Progress, Completed, Cancelled
  technician: { type: String, default: "-" },
  eta: { type: String, default: "" }
});

module.exports = mongoose.model("Booking", bookingSchema);

const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, default: null }, // linked user ID
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
  eta: { type: String, default: "" },
  paymentStatus: { type: String, default: "Pending" }, // Pending, Paid, Failed
  paymentMethod: { type: String, default: "Cash on Delivery" },
  esewaTransactionUuid: { type: String, unique: true, sparse: true },
  khaltiPidx: { type: String, unique: true, sparse: true },
  promoCode: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Booking", bookingSchema);

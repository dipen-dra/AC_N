const mongoose = require('mongoose');

const workshopSchema = new mongoose.Schema({
  name: { type: String, default: "AutoCare Service Center" },
  registrationNo: { type: String, default: "AC-NP-2018-1042" },
  owner: { type: String, default: "Rohit Karki" },
  manager: { type: String, default: "Sabin Karki" },
  phone: { type: String, default: "+977 980-1234567" },
  email: { type: String, default: "support@autocare.np" },
  address: { type: String, default: "Pulchowk, Lalitpur, Nepal" },
  city: { type: String, default: "Lalitpur" },
  workingHours: {
    type: Map,
    of: String,
    default: {
      Monday: "8:00 AM - 8:00 PM",
      Tuesday: "8:00 AM - 8:00 PM",
      Wednesday: "8:00 AM - 8:00 PM",
      Thursday: "8:00 AM - 8:00 PM",
      Friday: "8:00 AM - 8:00 PM",
      Saturday: "8:00 AM - 8:00 PM",
      Sunday: "9:00 AM - 4:00 PM"
    }
  },
  team: {
    type: Array,
    default: [
      { n: "Ramesh KC", r: "Senior Technician" },
      { n: "Bijay Shrestha", r: "AC Specialist" },
      { n: "Suman Rai", r: "Lubrication Expert" },
      { n: "Sabin Karki", r: "Manager" }
    ]
  },
  baysCount: { type: Number, default: 12 }
});

module.exports = mongoose.model('Workshop', workshopSchema);

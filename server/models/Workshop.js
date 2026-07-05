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
      { id: "M-1", name: "Ramesh KC", role: "Senior Technician", phone: "9801111111", email: "ramesh@autocare.np" },
      { id: "M-2", name: "Bijay Shrestha", role: "AC Specialist", phone: "9802222222", email: "bijay@autocare.np" },
      { id: "M-3", name: "Suman Rai", role: "Lubrication Expert", phone: "9803333333", email: "suman@autocare.np" },
      { id: "M-4", name: "Sabin Karki", role: "Manager", phone: "9804444444", email: "sabin@autocare.np" }
    ]
  },
  baysCount: { type: Number, default: 12 }
});

module.exports = mongoose.model('Workshop', workshopSchema);

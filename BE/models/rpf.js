const mongoose = require("mongoose");

const rfpSchema = new mongoose.Schema({
  title: String,
  items: [{ name: String, quantity: Number, specs: String }],
  budget: Number,
  currency: String,
  deadline: Date,
  createdBy: { type: String, default: "User" },
  status: { type: String, default: "Active" },
});

module.exports = mongoose.model("RFP", rfpSchema);

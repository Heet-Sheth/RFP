const mongoose = require("mongoose");

const proposalSchema = new mongoose.Schema({
  isBid: { type: Boolean, default: true },
  rfpId: { type: mongoose.Schema.Types.ObjectId, ref: "RFP" },
  vendorEmail: { type: String, required: true },
  rawEmailBody: String,
  parsedData: {
    totalPrice: Number,
    currency: { type: String, default: "INR" },
    deliveryTime: Date,
    warranty: String,
    lineItems: [
      { name: String, price: Number, quantity: Number, specs: String },
    ],
  },
  receivedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Proposal", proposalSchema);

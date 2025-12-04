const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: "local.env" });
const mongoose = require("mongoose");
const { parseRPFRequest } = require("./textToRPF");
const { sendRFPToVendors } = require("./emailDraft");
const rpf = require("./models/rpf");

const app = express();
app.use(express.json());
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

app.get("/", (req, res) => {
  res.send("AI RFP Manager is running.");
});

app.post("/api/rfp/parse", async (req, res) => {
  try {
    const { rfpText } = req.body;
    const structuredRFP = await parseRPFRequest(rfpText);
    res.status(200).send(structuredRFP);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/rfp/create-and-send", async (req, res) => {
  try {
    const { rfpText, vendorEmails } = req.body;

    const newRPF = new rpf(rfpText);
    await newRPF.save();

    await sendRFPToVendors(newRPF, vendorEmails);

    res.status(200).json({ message: "RFP created and emails sent." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

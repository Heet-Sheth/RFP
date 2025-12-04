require("dotenv").config();
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const generateEmailHTML = (rfp, vendorName) => {
  return `
    <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; max-width: 600px;">
      <h2 style="color: #2c5282;">Request for Proposal: ${rfp.title}</h2>
      <p style="color: #718096; font-size: 12px;">REF: ${rfp._id}</p>
      <hr />
      <p>Hello <strong>${vendorName}</strong>,</p>
      <p>We invite you to bid on the following requirements:</p>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr style="background: #f7fafc; text-align: left;">
          <th style="padding: 10px; border-bottom: 2px solid #ddd;">Item</th>
          <th style="padding: 10px; border-bottom: 2px solid #ddd;">Qty</th>
          <th style="padding: 10px; border-bottom: 2px solid #ddd;">Specs</th>
        </tr>
        ${rfp.items
          .map(
            (item) => `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.specs}</td>
          </tr>
        `
          )
          .join("")}
      </table>
      
      <div style="background: #ebf8ff; padding: 15px; border-radius: 5px; color: #2b6cb0;">
        <strong>Instructions:</strong> Please reply to this email with your quote attached or in the body.
      </div>
    </div>
  `;
};

const sendRFPToVendors = async (rfp, vendorEmails) => {
  const sendPromises = vendorEmails.map((email) => {
    return transporter.sendMail({
      from: `"RFP Manager" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `[RFP-${rfp._id}] Request for Proposal: ${rfp.title}`, // Subject Tagging
      html: generateEmailHTML(rfp, "Vendor"),
    });
  });

  return Promise.all(sendPromises);
};

module.exports = { sendRFPToVendors };

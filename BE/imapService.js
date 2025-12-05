// services/gmailService.js
const fs = require("fs").promises;
const path = require("path");
const { google } = require("googleapis");
const { authenticate } = require("@google-cloud/local-auth");
const Proposal = require("./models/proposal");
const { parseVendorResponse } = require("./textToRPF");

// Scopes: We need to Read emails and Modify them (to mark as read)
const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];
const TOKEN_PATH = path.join(process.cwd(), "token.json");
const CREDENTIALS_PATH = path.join(process.cwd(), "credentials.json");

// 1. AUTHENTICATION HELPER
async function authorize() {
  let client = await loadSavedCredentialsIfExist();
  if (client) {
    return client;
  }
  // First time login: Opens a browser/terminal link for the user to click "Allow"
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await saveCredentials(client);
  }
  return client;
}

// 2. HELPER: Load Token from disk
async function loadSavedCredentialsIfExist() {
  try {
    const content = await fs.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

// 3. HELPER: Save Token to disk (so we don't login every time)
async function saveCredentials(client) {
  const content = await fs.readFile(CREDENTIALS_PATH);
  const keys = JSON.parse(content);
  const key = keys.installed || keys.web;
  const payload = JSON.stringify({
    type: "authorized_user",
    client_id: key.client_id,
    client_secret: key.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fs.writeFile(TOKEN_PATH, payload);
}

// 4. HELPER: Decode Gmail's Base64 Body
function extractBody(payload) {
  // Gmail API returns nested parts. We need to find the text/plain part.
  let textPart = "";

  // Recursive function to find text/plain
  const findText = (parts) => {
    for (const part of parts) {
      if (part.mimeType === "text/plain" && part.body.data) {
        textPart = part.body.data;
        return;
      }
      if (part.parts) findText(part.parts);
    }
  };

  if (payload.body.data) {
    // Simple email (no attachments/parts)
    textPart = payload.body.data;
  } else if (payload.parts) {
    findText(payload.parts);
  }

  // Decode Base64URL to String
  if (textPart) {
    return Buffer.from(textPart, "base64").toString("utf-8");
  }
  return "";
}

// --- MAIN FUNCTION ---
const checkEmails = async () => {
  try {
    const auth = await authorize();
    const gmail = google.gmail({ version: "v1", auth });

    // A. LIST Unread Messages
    const res = await gmail.users.messages.list({
      userId: "me",
      q: "is:unread subject:RFP-", // Google Search Query (Very efficient)
    });

    const messages = res.data.messages;
    if (!messages || messages.length === 0) {
      console.log("No new RFP emails.");
      return;
    }

    console.log(`🔍 Found ${messages.length} new emails. Processing...`);

    // B. PROCESS Each Message
    for (const msg of messages) {
      // Fetch full details
      const email = await gmail.users.messages.get({
        userId: "me",
        id: msg.id,
      });

      const headers = email.data.payload.headers;
      const subject = headers.find((h) => h.name === "Subject")?.value;
      const from = headers.find((h) => h.name === "From")?.value;

      // Extract Body (Safe decoding, no external parser needed)
      const bodyText = extractBody(email.data.payload);

      console.log(`📩 Processing: ${subject}`);

      // C. EXTRACT ID & AI PARSE
      const match = subject.match(/RFP-([a-zA-Z0-9]+)/);
      if (match) {
        const rfpId = match[1];

        // Call AI
        const aiData = await parseVendorResponse(bodyText);

        // Save to DB
        const newProposal = new Proposal({
          rfpId: rfpId,
          vendorEmail: from,
          rawEmailBody: bodyText,
          parsedData: aiData,
          receivedAt: new Date(),
        });

        await newProposal.save();
        console.log(`   ✅ Saved Proposal for ${rfpId}`);

        // D. MARK AS READ (Remove 'UNREAD' label)
        await gmail.users.messages.modify({
          userId: "me",
          id: msg.id,
          requestBody: {
            removeLabelIds: ["UNREAD"],
          },
        });
      }
    }
  } catch (error) {
    console.error("❌ Gmail API Error:", error.message);
    // If token expired or invalid, you might want to delete token.json
  }
};

module.exports = { checkEmails };

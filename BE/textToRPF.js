const { GoogleGenAI } = require("@google/genai");
const { json } = require("express");

require("dotenv").config();
const genAi = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const parseRPFRequest = async (rfpText) => {
  const prompt = `
    You are a procurement expert. 
    Convert the following natural language request into a structured JSON RFP object. 
    Do not assume any details by yourself, only extract what is explicitly mentioned.
    Assume the date of today is ${new Date().toISOString().split("T")[0]}.
    
    User Request: "${rfpText}"

    Output Format (JSON Only):
    {
      "title": "Short descriptive title",
      "budget": Number (or null),
      "currency": "INR",
      "deadline": "ISO Date String (calculate based on 'in 30 days' etc, or default to 14 days from now)",
      "items": [
        { "name": "Item Name", "quantity": Number, "specs": "Key specifications" }
      ]
    }
    
    Do not include markdown formatting like \`\`\`json. Return pure JSON string.
  `;

  const response = await genAi.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  try {
    return response.text;
  } catch (error) {
    console.error("Error parsing JSON response:", error);
    throw new Error("Failed to parse RFP details from response.");
  }
};

const parseVendorResponse = async (responseText) => {
  const prompt = `
  You are a procurement AI. Extract structured data from this vendor email.
  
  CONTEXT:
  - Today's Date: ${new Date().toISOString().split("T")[0]}
  - System Currency: INR (All monetary values must be treated as INR)

  EMAIL CONTENT: "${responseText}"

  INSTRUCTIONS:
  1. DATES: 
     - If a specific time frame is given ("in 3 days"), calculate the exact YYYY-MM-DD.
     - If vague ("ASAP", "Immediate"), set "deliveryDate" to null.
  2. MONEY: 
     - Remove commas from numbers (e.g., "1,00,000" becomes 100000).
     - Ignore "$" or other symbols; treat the raw number as INR.
  3. ITEMS: 
     - Extract "unitPrice" for a single item.
  4. FAILURES:
     - If the vendor declines the bid (e.g. "We cannot quote"), set "isBid" to false.

  OUTPUT JSON SCHEMA (Return ONLY this raw JSON, no markdown):
  {
    "isBid": Boolean, 
    "totalPrice": Number, // null if not found
    "currency": "INR",    // Hardcoded per requirements
    "deliveryDate": "YYYY-MM-DD", // null if "ASAP" or vague
    "deliveryTerm": "String", // e.g. "3-4 weeks", "Immediately"
    "warranty": "String", 
    "lineItems": [
      { 
        "name": "String", 
        "unitPrice": Number, 
        "quantity": Number, 
        "totalLinePrice": Number, 
        "specs": "String" 
      }
    ]
  }
`;

  const response = await genAi.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error parsing bid:", error);
    return {};
  }
};

module.exports = { parseRPFRequest, parseVendorResponse };

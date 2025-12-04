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

module.exports = { parseRPFRequest };

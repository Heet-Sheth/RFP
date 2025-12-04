const inquirer = require("inquirer");
const fs = require("fs");
const path = require("path");

const envPath = "local.env";

async function setup() {
  console.log("🚀 Starting AI RFP Manager Setup...");

  if (fs.existsSync(envPath)) {
    console.log("✅ Configuration (.env) already exists. Skipping setup.");
    return;
  }

  const answers = await inquirer.createPromptModule([
    {
      type: "input",
      name: "PORT",
      message: "Server Port:",
      default: 5000,
    },
    {
      type: "input",
      name: "MONGO_URI",
      message: "MongoDB Connection String:",
      validate: (input) => (input ? true : "Required"),
    },
    {
      type: "input",
      name: "GEMINI_API_KEY",
      message: "Google Gemini API Key:",
      validate: (input) => (input ? true : "Required"),
    },
    {
      type: "input",
      name: "EMAIL_USER",
      message: "Your Gmail Address (for sending):",
      validate: (input) => (input.includes("@") ? true : "Invalid Email"),
    },
    {
      type: "password",
      name: "EMAIL_PASS",
      message: "Your Gmail App Password:",
      mask: "*",
    },
  ]);

  const envContent = Object.entries(answers)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  fs.writeFileSync(envPath, envContent);
  console.log("✅ Setup Complete! .env file created.");
}

setup();

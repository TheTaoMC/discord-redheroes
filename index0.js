// Import required libraries
const { Client, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const express = require("express"); // เพิ่ม Express.js

// Load environment variables from .env file
dotenv.config();

// Initialize Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize Express server
const app = express();
const PORT = process.env.PORT || 3000; // Use the port provided by the hosting platform or 3000 as default

// Define a global variable to track bot status
let botStatus = "off"; // Default status is "off"

// Event: When the bot is ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  botStatus = "on"; // Update status to "on" when the bot is ready
});

// Load database and commands here (same as your original code)
const { db, initializeDatabase } = require("./utils/database");
initializeDatabase();

client.commands = new Map();
const commandsPath = path.join(__dirname, "commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.name, command);
}

// API Endpoint: Check bot status
app.get("/status", (req, res) => {
  res.json({
    status: botStatus, // Return the current bot status
    message: botStatus === "on" ? "Bot is online" : "Bot is offline",
  });
});

// Start the Express server
app.listen(PORT, () => {
  console.log(`🌐 API Server is running on port ${PORT}`);
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

// Import required libraries
const { Client, GatewayIntentBits } = require("discord.js");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");

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

// Load database
const { db, initializeDatabase } = require("./utils/database");

// Initialize database tables
initializeDatabase();

// Load commands dynamically
client.commands = new Map(); // Store commands in a Map for easy access
const commandsPath = path.join(__dirname, "commands"); // Path to the commands folder
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.name, command); // Add command to the Map
}

// Event: When the bot is ready
client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// Event: Handle incoming messages
client.on("messageCreate", async (message) => {
  // Ignore messages from bots or without prefix
  if (message.author.bot || !message.content.startsWith(process.env.PREFIX))
    return;

  // Split command and arguments
  const args = message.content
    .slice(process.env.PREFIX.length)
    .trim()
    .split(/ +/);
  const commandName = args.shift().toLowerCase();

  // Check if the command exists
  const command = client.commands.get(commandName);
  if (!command) return;

  // Fetch all rooms from the database
  db.all("SELECT room_id FROM rooms", [], (err, rows) => {
    if (err) {
      console.error("❌ Error fetching rooms:", err.message);
      return message.reply("❌ เกิดข้อผิดพลาดขณะตรวจสอบห้อง!");
    }

    // Get the current room ID
    const currentRoomId = message.channel.id;

    // If no rooms are set, allow commands in all rooms
    if (rows.length === 0) {
      try {
        command.execute(message, args, { client, db });
      } catch (error) {
        console.error("❌ Error executing command:", error.message);
        message.reply("❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง!");
      }
      return;
    }

    // Check if the current room is in the list of allowed rooms
    const isAllowedRoom = rows.some((row) => row.room_id === currentRoomId);
    if (!isAllowedRoom) return;

    try {
      // Execute the command
      command.execute(message, args, { client, db });
    } catch (error) {
      console.error("❌ Error executing command:", error.message);
      message.reply("❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง!");
    }
  });
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

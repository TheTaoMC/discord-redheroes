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
client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    // Move event initializations here
    const botComplains = require("./events/botComplains");
    botComplains.start(client, db);
    //await botComplains.testBotComplains(client, db); // Added await since it's async
    console.log("✅ Bot complains event initialized");

    const moneyEvent = require("./events/moneyEvent");
    moneyEvent.start(client, db);
    console.log("✅ Bot moneyEvent event initialized");
  } catch (error) {
    console.error("❌ Error during initialization:", error);
  }
});

// Load events
require("./events/lotteryDraw")(client, db);
require("./events/autoWork")(client, db);

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

  // Special case for .setroom (Admin-only command)
  if (commandName === "setroom") {
    // Check if the user has Administrator permissions
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("❌ คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้!");
    }

    try {
      // Execute the .setroom command without room checks
      command.execute(message, args, { client, db });
    } catch (error) {
      console.error("❌ Error executing .setroom command:", error.message);
      message.reply("❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง!");
    }
    return;
  }

  // Fetch all rooms from the database with guild_id check
  const guildId = message.guild?.id; // Get the current guild ID
  db.all(
    "SELECT room_id FROM rooms WHERE guild_id = ?",
    [guildId],
    (err, rows) => {
      if (err) {
        console.error("❌ Error fetching rooms:", err.message);
        return message.reply("❌ เกิดข้อผิดพลาดขณะตรวจสอบห้อง!");
      }

      // Get the current room ID
      const currentRoomId = message.channel.id;

      // If no rooms are set for this guild, prevent commands from working
      if (rows.length === 0) {
        return message.reply(
          "❌ ยังไม่มีห้องที่ถูกตั้งค่าไว้ในเซิร์ฟเวอร์นี้! กรุณาตั้งค่าห้องด้วยคำสั่ง `.setroom`"
        );
      }

      // Check if the current room is in the list of allowed rooms
      const isAllowedRoom = rows.some((row) => row.room_id === currentRoomId);
      if (!isAllowedRoom) {
        return message.reply(
          "❌ คำสั่งนี้สามารถใช้งานได้เฉพาะในห้องที่ถูกตั้งค่าไว้เท่านั้น!"
        );
      }

      try {
        // Execute the command
        command.execute(message, args, { client, db });
      } catch (error) {
        console.error("❌ Error executing command:", error.message);
        message.reply("❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง!");
      }
    }
  );
});

// Login to Discord
client.login(process.env.DISCORD_TOKEN);

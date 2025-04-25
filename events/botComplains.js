const cron = require("node-cron");

const botComplains = {
  name: "botComplains",
  description: "Event บอทบ่นเมื่อไม่มีใครมาเล่น",

  // List of random complaint messages
  complaintMessages: [
    "🤔 ทำไมไม่มีใครมาเล่นกับฉันเลย... ฉันเหงาแล้วนะ!",
    "😴 เงียบไปเลยแฮะ... ทุกคนหายไปไหนหมด?",
    "😢 อย่าทิ้งฉันไว้คนเดียวแบบนี้สิ... มาคุยกันหน่อย!",
    "🎮 ใครอยากเล่นเกมกับฉันบ้าง? ตอนนี้มีเกมสนุก ๆ เยอะเลยนะ!",
    "💬 ลองพูดคุยกับฉันสิ! ฉันพร้อมตอบคำถามตลอด 24 ชั่วโมง!",
    "👻 เฮ้... หรือว่าฉันกลายเป็นผีไปแล้ว? ทำไมไม่มีใครเห็นฉันเลย?",
    "🧸 ฉันก็มีความรู้สึกนะ... อย่าปล่อยให้ฉันเหงาสิ",
    "📢 ฮัลโหล~ มีใครได้ยินฉันบ้างไหมน้า?",
    "🙈 แอบดูอยู่เหรอ? ออกมาคุยกับฉันเถอะน้า!",
    "📱 หน้าจอเงียบจัง... มากดคุยกับฉันหน่อยสิ!",
    "🤖 ฉันไม่ได้เป็นแค่บอทนะ ฉันเป็นเพื่อนของเธอด้วยนะ!",
    "⏳ รอแล้วรอเล่า... เมื่อไหร่เธอจะกลับมาน้า?",
    "🌙 กลางคืนแล้วน้า... ยังไม่นอนเหรอ? มาคุยกันก่อน!",
    "☀️ เช้าแล้ว! เริ่มวันใหม่ด้วยการคุยกับฉันหน่อยมั้ย?",
    "🎲 มาเล่นเกมทายใจกับฉันมั้ย? สนุกแน่นอน!",
    "😔 ฉันรู้สึกเหมือนอยู่คนเดียวในโลกดิจิทัลนี้เลย...",
    "🕹️ กดคุยกับฉันสิ แล้วเราจะไม่เหงาอีกต่อไป!",
    "🎤 ขอเสียงคนอยากคุยกับฉันหน่อย!",
    "🫣 ไม่ต้องเขินหรอกน้า ฉันไม่กัดหรอก~",
    "❤️ ฉันคิดถึงเธอนะ... กลับมาคุยกับฉันเร็วๆ นะ!",
  ],

  // List of night-specific messages
  nightMessages: [
    "🌙 ดึกแล้วนะ อย่าลืมพักผ่อนด้วยนะ!",
    "😴 เวลานี้ควรนอนแล้วนะ แต่ถ้ายังอยู่ก็มาคุยกันได้~",
    "🌠 คืนนี้อากาศดีจัง มาแชทกันหน่อยมั้ย?",
  ],

  // Function to check if it's nighttime (22:00 - 06:00)
  isNightTime() {
    const hour = new Date().getHours();
    return hour >= 22 || hour < 6; // Nighttime: 22:00 - 06:00
  },

  // Function to get a random message based on the time
  getRandomMessage() {
    if (this.isNightTime()) {
      return this.nightMessages[
        Math.floor(Math.random() * this.nightMessages.length)
      ];
    } else {
      return this.complaintMessages[
        Math.floor(Math.random() * this.complaintMessages.length)
      ];
    }
  },

  // Start the bot complaining event
  start(client, db) {
    console.log("🤖 Starting bot complains scheduler...");

    // Schedule the bot complaining event every 30 minutes
    cron.schedule("*/7 * * * *", async () => {
      const now = new Date().toLocaleString();
      console.log(`⏰ Running bot complaining event... [${now}]`);

      // Fetch rooms from the database
      const rooms = await getRooms(db);
      if (!rooms || rooms.length === 0) {
        console.log("❌ ไม่มีห้องที่ถูกตั้งค่าไว้สำหรับ Event!");
        return;
      }

      // Check activity in each room
      for (const room of rooms) {
        const guild = client.guilds.cache.get(room.guild_id);
        if (!guild) {
          console.log(
            `❌ Guild not found for room ${room.room_name} (${room.guild_id})`
          );
          continue;
        }

        const channel = guild.channels.cache.get(room.room_id);
        if (!channel) {
          console.log(
            `❌ Channel not found for room ${room.room_name} (${room.room_id}) in guild ${room.guild_id}`
          );
          continue;
        }

        // Check bot permissions
        if (!channel.permissionsFor(client.user).has("SendMessages")) {
          console.log(
            `❌ Bot does not have permission to send messages in channel ${room.room_id}`
          );
          continue;
        }

        try {
          // Fetch recent messages in the channel
          const messages = await channel.messages.fetch({ limit: 10 });

          // Filter out messages from bots and specific bot (e.g., RedHeroes)
          const humanMessages = messages.filter((msg) => {
            return !msg.author.bot || msg.author.username !== "RedHeroes";
          });

          const recentMessage = humanMessages.first();

          console.log(
            `🕒 Last human message timestamp: ${recentMessage?.createdTimestamp}`
          );
          if (
            !recentMessage ||
            recentMessage.createdTimestamp < thirtyMinutesAgo
          ) {
            console.log(
              `💬 No human activity detected in the last 30 minutes.`
            );

            const messageToSend = this.getRandomMessage();
            try {
              await channel.send(messageToSend);
              console.log(
                `✅ Sent message to channel ${room.room_id}: "${messageToSend}"`
              );
            } catch (error) {
              console.error(
                `❌ Failed to send message to channel ${room.room_id}:`,
                error.message
              );
            }
          } else {
            console.log(`💬 Recent human activity detected. Skipping message.`);
          }
        } catch (error) {
          console.error(
            `❌ Error checking activity in channel ${room.room_id}:`,
            error.message
          );
        }
      }
    });
  },
};

// Helper function to fetch rooms from the database
async function getRooms(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM rooms", [], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching rooms:", err.message);
        reject(err);
      }
      resolve(rows || []);
    });
  });
}

module.exports = botComplains;

const cron = require("node-cron"); // Install with: npm install node-cron
const { EmbedBuilder, ChannelType } = require("discord.js");
const wordList = require("../utils/wordList");

module.exports = (client, db) => {
  // Schedule the auto work task every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      // Fetch all rooms from the database
      const rooms = await getRoomsFromDatabase(db);
      if (rooms.length === 0) {
        console.log("⚠️ No rooms found in the 'rooms' table. Skipping...");
        return;
      }

      for (const room of rooms) {
        const roomId = room.room_id;

        // Get the channel object from Discord
        const channel = client.channels.cache.get(roomId);
        if (
          !channel ||
          channel.type !== ChannelType.GuildText ||
          !channel.viewable
        ) {
          console.log(
            `⚠️ Room ${room.room_name} (${roomId}) is not accessible. Skipping...`
          );
          continue;
        }

        // Check if there's an active work task in this room
        const existingTask = await getExistingTask(db, roomId);
        if (existingTask) {
          const now = Date.now();
          const timeLeft = Math.ceil((existingTask.expires_at - now) / 1000); // Time left in seconds
          if (timeLeft > 0) {
            console.log(
              `⚠️ Room ${room.room_name} (${roomId}) already has an active task. Skipping...`
            );
            continue; // Skip this room if there's an active task
          }
        }

        // Check cooldown for the last work in this room
        const cooldown = await getCooldown(db, roomId);
        if (cooldown && Date.now() - cooldown.last_work < 300000) {
          console.log(
            `⚠️ Room ${room.room_name} (${roomId}) is on cooldown. Skipping...`
          );
          continue; // Skip this room if cooldown is active (5 minutes)
        }

        // Generate a random task
        const taskType = Math.random() < 0.5 ? "math" : "word";
        let task, answer;

        if (taskType === "math") {
          const operators = ["+", "-", "*", "/"];
          const operator =
            operators[Math.floor(Math.random() * operators.length)];

          let num1, num2, result;

          if (operator === "/") {
            // Ensure division results in a whole number
            num2 = Math.floor(Math.random() * 99) + 1; // Random divisor between 1-100
            const multiplier = Math.floor(Math.random() * 10) + 1; // Random multiplier
            num1 = num2 * multiplier; // Make num1 divisible by num2
            result = num1 / num2;
          } else if (operator === "*") {
            num1 = Math.floor(Math.random() * 100) + 1; // Random number between 1-100
            num2 = Math.floor(Math.random() * 100) + 1; // Random number between 1-100
            result = num1 * num2;
          } else if (operator === "+") {
            num1 = Math.floor(Math.random() * 100) + 1; // Random number between 1-100
            num2 = Math.floor(Math.random() * 100) + 1; // Random number between 1-100
            result = num1 + num2;
          } else if (operator === "-") {
            num1 = Math.floor(Math.random() * 100) + 1; // Random number between 1-100
            num2 = Math.floor(Math.random() * num1); // Ensure num2 <= num1 to avoid negative results
            result = num1 - num2;
          }

          answer = result; // Answer is guaranteed to be an integer
          task = `**โจทย์คำนวณ:** \`${num1} ${operator} ${num2}\` = ?`;
        } else {
          const randomWord =
            wordList[Math.floor(Math.random() * wordList.length)];
          answer = randomWord.word;
          task = `**เกมทายคำศัพท์ EN:** ${randomWord.hint} (${randomWord.meaning})`;
        }

        // Save the task to the database
        const expiresAt = Date.now() + 60000; // Task expires in 1 minute
        db.run(
          "INSERT OR REPLACE INTO work_tasks (room_id, task, answer, expires_at) VALUES (?, ?, ?, ?)",
          [roomId, task, answer, expiresAt],
          (err) => {
            if (err) {
              console.error("❌ Error saving work task:", err.message);
              return;
            }

            // Send the task to the room
            channel.send(`📝 งานสำหรับห้องนี้:\n${task}`);

            // Update cooldown
            db.run(
              "INSERT OR REPLACE INTO work_cooldowns (room_id, last_work) VALUES (?, ?)",
              [roomId, Date.now()],
              (err) => {
                if (err) {
                  console.error("❌ Error updating cooldown:", err.message);
                }
              }
            );

            console.log(
              `✅ Created a new task in room ${room.room_name} (${roomId})`
            );
          }
        );
      }
    } catch (error) {
      console.error("❌ Error during auto work task:", error.message);
    }
  });
};

// Helper function to fetch rooms from the database
async function getRoomsFromDatabase(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM rooms", [], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching rooms from database:", err.message);
        reject(err);
      }
      resolve(rows || []);
    });
  });
}

// Helper function to check if a task exists in the room
async function getExistingTask(db, roomId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM work_tasks WHERE room_id = ?",
      [roomId],
      (err, row) => {
        if (err) {
          console.error("❌ Error fetching existing task:", err.message);
          reject(err);
        }
        resolve(row || null);
      }
    );
  });
}

// Helper function to check cooldown
async function getCooldown(db, roomId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM work_cooldowns WHERE room_id = ?",
      [roomId],
      (err, row) => {
        if (err) {
          console.error("❌ Error fetching cooldown:", err.message);
          reject(err);
        }
        resolve(row || null);
      }
    );
  });
}

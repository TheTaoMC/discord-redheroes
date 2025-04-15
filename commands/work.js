const { EmbedBuilder } = require("discord.js");
const wordList = require("../utils/wordList");

module.exports = {
  name: "work",
  description: "ทำงานเพื่อรับเงินรางวัล (ห้องละ 1 งาน)",
  async execute(message, args, { client, db }) {
    const roomId = message.channel.id;

    // Check if there's an active work task in this room
    db.get(
      "SELECT * FROM work_tasks WHERE room_id = ?",
      [roomId],
      (err, row) => {
        if (err) {
          console.error("❌ Error checking work tasks:", err.message);
          return message.reply("❌ เกิดข้อผิดพลาดขณะตรวจสอบงาน!");
        }

        if (row) {
          const now = Date.now();
          const timeLeft = Math.ceil((row.expires_at - now) / 1000); // Time left in seconds
          if (timeLeft > 0) {
            return message.reply(
              `❌ มีงานเก่าอยู่ในห้องนี้แล้ว! กรุณาตอบคำถามด้วย \`!answer\` หรือรออีก ${timeLeft} วินาที`
            );
          }
        }

        // Check cooldown for the last work in this room
        db.get(
          "SELECT * FROM work_cooldowns WHERE room_id = ?",
          [roomId],
          (err, cooldownRow) => {
            if (err) {
              console.error("❌ Error checking cooldown:", err.message);
              return message.reply("❌ เกิดข้อผิดพลาดขณะตรวจสอบ cooldown!");
            }

            if (cooldownRow && Date.now() - cooldownRow.last_work < 15000) {
              return message.reply(
                "❌ มีการเริ่มงานถี่เกินไปในห้องนี้! กรุณารออย่างน้อย 15 วินาที"
              );
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
                  return message.reply("❌ เกิดข้อผิดพลาดขณะบันทึกงาน!");
                }

                // Send the task to the room
                message.channel.send(`📝 งานสำหรับห้องนี้:\n${task}`);

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
              }
            );
          }
        );
      }
    );
  },
};

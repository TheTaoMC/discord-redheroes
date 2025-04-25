const { EmbedBuilder } = require("discord.js");
const wordList = require("../utils/wordList");

module.exports = {
  name: "work",
  description: "ทำงานเพื่อรับเงินรางวัล (ห้องละ 1 งาน)",
  async execute(message, args, { client, db }) {
    const roomId = message.channel.id;
    let originalMessage = null;

    // Try to delete the command message but keep a reference to it
    try {
      originalMessage = message;
      await message.delete();
    } catch (error) {
      console.error("❌ Error deleting the input message:", error.message);
    }

    const sendResponse = async (content) => {
      try {
        await message.channel.send(content);
      } catch (error) {
        console.error("❌ Error sending message:", error.message);
        // Fallback to channel send without reply
        try {
          await message.channel.send(content);
        } catch (secondError) {
          console.error("❌ Fatal error sending message:", secondError.message);
        }
      }
    };

    // Wrap the database operations in a Promise for better control
    try {
      // Check both active task and cooldown in a single transaction
      const result = await new Promise((resolve, reject) => {
        db.serialize(() => {
          db.run("BEGIN TRANSACTION");

          // Check active tasks first
          db.get(
            "SELECT * FROM work_tasks WHERE room_id = ? AND expires_at > ?",
            [roomId, Date.now()],
            (err, taskRow) => {
              if (err) {
                db.run("ROLLBACK");
                return reject(err);
              }

              if (taskRow) {
                db.run("ROLLBACK");
                const timeLeft = Math.ceil(
                  (taskRow.expires_at - Date.now()) / 1000
                );
                return resolve({
                  error: `❌ มีงานเก่าอยู่ในห้องนี้แล้ว! กรุณาตอบคำถามด้วย \`.answer\` หรือรออีก ${timeLeft} วินาที`,
                });
              }

              // Then check cooldown
              db.get(
                "SELECT * FROM work_cooldowns WHERE room_id = ? AND last_work > ?",
                [roomId, Date.now() - 15000],
                (err, cooldownRow) => {
                  if (err) {
                    db.run("ROLLBACK");
                    return reject(err);
                  }

                  if (cooldownRow) {
                    db.run("ROLLBACK");
                    return resolve({
                      error:
                        "❌ มีการเริ่มงานถี่เกินไปในห้องนี้! กรุณารออย่างน้อย 15 วินาที",
                    });
                  }

                  // If we reach here, it's safe to create a new task
                  db.run("COMMIT");
                  resolve({ success: true });
                }
              );
            }
          );
        });
      });

      if (result.error) {
        return sendResponse(result.error);
      }

      // Continue with task creation only if checks passed
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
            return sendResponse("❌ เกิดข้อผิดพลาดขณะบันทึกงาน!");
          }

          // Send the task to the room
          sendResponse(`📝 งานสำหรับห้องนี้:\n${task}`);

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
    } catch (error) {
      console.error("❌ Error in work command:", error);
      return sendResponse("❌ เกิดข้อผิดพลาดในการทำงาน กรุณาลองใหม่อีกครั้ง");
    }
  },
};

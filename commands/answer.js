const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "answer",
  description: "ตอบคำถามจากงานในห้อง",
  async execute(message, args, { client, db }) {
    const roomId = message.channel.id;
    const userId = message.author.id;
    const userAnswer = args.join(" ");

    // Check if there's an active work task in this room
    db.get(
      "SELECT * FROM work_tasks WHERE room_id = ?",
      [roomId],
      (err, row) => {
        if (err) {
          console.error("❌ Error checking work tasks:", err.message);
          return message.reply("❌ เกิดข้อผิดพลาดขณะตรวจสอบงาน!");
        }

        if (!row) {
          return message.reply("❌ ไม่มีงานที่ต้องตอบในห้องนี้!");
        }

        const now = Date.now();
        if (now > row.expires_at) {
          db.run("DELETE FROM work_tasks WHERE room_id = ?", [roomId]);
          return message.reply(
            "❌ งานในห้องนี้หมดอายุแล้ว! กรุณาเริ่มงานใหม่ด้วย `!work`"
          );
        }

        // Check the answer
        const userAnswer = args.join(" ").trim().toLowerCase(); // Trim and convert to lowercase
        const correctAnswer = row.answer.toLowerCase(); // Convert the correct answer to lowercase

        if (userAnswer !== correctAnswer) {
          return message.reply("❌ คำตอบไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง");
        }

        // Calculate reward
        const reward = calculateReward();

        // Update user's balance and karma in the database
        db.run(
          "INSERT OR IGNORE INTO users (user_id, username, balance, karma) VALUES (?, ?, 0, 0)",
          [userId, message.author.username]
        );

        db.run(
          "UPDATE users SET balance = balance + ?, karma = karma + 1 WHERE user_id = ?",
          [reward, userId],
          (err) => {
            if (err) {
              console.error("❌ Error updating user data:", err.message);
              return message.reply("❌ เกิดข้อผิดพลาดขณะอัพเดทข้อมูลผู้ใช้!");
            }

            // Notify the user about the reward
            let rewardMessage = `🎉 ยินดีด้วย! ${message.author.username} ตอบถูกและได้รับ ${reward} บาท`;
            if (reward >= 80) {
              rewardMessage +=
                "\n🎉 รางวัลใหญ่! 🎉 https://i.imgur.com/xyz123.gif"; // Add GIF URL here
            }

            message.channel.send(rewardMessage);

            // Remove the task from the database
            db.run("DELETE FROM work_tasks WHERE room_id = ?", [roomId]);
          }
        );
      }
    );
  },
};

// Function to calculate random rewards
function calculateReward() {
  const rand = Math.random();
  if (rand < 0.8) return Math.floor(Math.random() * 10) + 1; // 1-10
  if (rand < 0.9) return Math.floor(Math.random() * 20) + 11; // 11-30
  if (rand < 0.95) return Math.floor(Math.random() * 20) + 31; // 31-50
  if (rand < 0.97) return Math.floor(Math.random() * 30) + 51; // 51-80
  if (rand < 0.99) return Math.floor(Math.random() * 20) + 81; // 81-100
  return Math.floor(Math.random() * 50) + 101; // 101-150
}

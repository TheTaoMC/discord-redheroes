const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "lotto888",
  description:
    "เดิมพันเลข 2 ตัว 10 ชุด (เช่น .lotto888 10,20,30,40,50,60,70,80,90,22)",
  async execute(message, args, { client, db }) {
    const userId = message.author.id;
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    // Validate input
    if (!args[0]) {
      return message.reply(
        "❌ กรุณาใส่เลข 2 ตัว 10 ชุด เช่น `.lotto888 10,20,30,40,50,60,70,80,90,22`"
      );
    }

    const numbers = args[0].split(",").map((num) => num.trim());
    if (numbers.length !== 10 || !numbers.every((num) => /^\d{2}$/.test(num))) {
      return message.reply(
        "❌ กรุณาใส่เลข 2 ตัว 10 ชุดที่ถูกต้อง (เช่น 10,20,30,...)"
      );
    }

    // Check if the user has already bet today
    const existingBet = await getExistingBet(db, userId, today);
    if (existingBet) {
      // Update the existing bet
      db.run(
        "UPDATE lotto888 SET numbers = ? WHERE user_id = ? AND date = ?",
        [numbers.join(","), userId, today],
        (err) => {
          if (err) {
            console.error("❌ Error updating bet:", err.message);
            return message.reply("❌ เกิดข้อผิดพลาดขณะอัปเดตข้อมูล!");
          }
          message.reply(
            `✅ คุณได้อัปเดตเลขเดิมพันเป็น \`${numbers.join(", ")}\` สำเร็จ!`
          );
        }
      );
    } else {
      // Insert a new bet
      db.run(
        "INSERT INTO lotto888 (user_id, numbers, date) VALUES (?, ?, ?)",
        [userId, numbers.join(","), today],
        (err) => {
          if (err) {
            console.error("❌ Error saving bet:", err.message);
            return message.reply("❌ เกิดข้อผิดพลาดขณะบันทึกข้อมูล!");
          }
          message.reply(
            `✅ คุณได้เดิมพันเลข \`${numbers.join(", ")}\` สำเร็จ!`
          );
        }
      );
    }
  },
};

// Helper function to check if a user has already bet today
async function getExistingBet(db, userId, date) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM lotto888 WHERE user_id = ? AND date = ?",
      [userId, date],
      (err, row) => {
        if (err) {
          console.error("❌ Error fetching existing bet:", err.message);
          reject(err);
        }
        resolve(row || null);
      }
    );
  });
}

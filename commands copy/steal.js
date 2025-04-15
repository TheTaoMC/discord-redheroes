const { addBalance, updateKarma, getBalance } = require("../utils/wallet");
const db = require("../db");
const eventHandler = require("../utils/eventHandler");

module.exports = {
  name: "steal",
  execute(message, args, { stealAttempts }) {
    try {
      const target = message.mentions.users.first();
      if (!target || target.id === message.author.id) {
        return message.reply(
          "❌ คุณต้องเลือกคนอื่นเพื่อขโมย และห้ามขโมยตัวเอง!"
        );
      }

      const today = new Date().toISOString().slice(0, 10);
      const key = `${message.author.id}-${today}`;
      const attempts = stealAttempts.get(key) || 0;

      if (attempts >= 5) {
        return message.reply("❌ คุณขโมยครบ 5 ครั้งแล้ว ลองใหม่พรุ่งนี้!");
      }

      // Step 1: Check if the target has a defensive item (e.g., lockbag)
      const beforeStealResult = eventHandler.handleEvent(
        "beforeSteal",
        null,
        target.id,
        { updateKarma }
      );
      if (beforeStealResult.success === false) {
        message.reply(
          beforeStealResult.message ||
            "🔒 เป้าหมายล็อกกระเป๋าอยู่! ขโมยไม่สำเร็จ..."
        );
        updateKarma(message.author.id, -5); // Deduct Karma for attempting to steal

        // Step 2: Check if the user has an offensive item (e.g., stealx2)
        const duringStealResult = eventHandler.handleEvent(
          "duringSteal",
          message.author.id,
          null,
          {}
        );
        if (duringStealResult.usedItem) {
          message.reply("🦹 คุณได้ใช้ไอเท็ม 'ขโมย x2' แต่การขโมยไม่สำเร็จ");
        }

        return;
      }

      // Step 3: Check if the user has an offensive item (e.g., stealx2)
      let multiplier = 1;
      const duringStealResult = eventHandler.handleEvent(
        "duringSteal",
        message.author.id,
        null,
        {}
      );
      if (duringStealResult.success && duringStealResult.multiplier) {
        multiplier = duringStealResult.multiplier; // Use the multiplier from the result
        message.reply(
          duringStealResult.message || "🦹 โอกาสขโมย x2 ถูกเปิดใช้งาน!"
        );
      }

      // Step 4: Proceed with the steal logic
      const targetBalance = getBalance(target.id);
      if (targetBalance > 0) {
        const successRate = multiplier === 2 ? 0.7 : 0.5; // 70% if stealx2, else 50%
        const isSuccess = Math.random() < successRate;

        if (isSuccess) {
          const stolenAmount =
            Math.floor(Math.random() * (targetBalance * 0.5)) * multiplier;
          addBalance(target.id, -stolenAmount);
          addBalance(message.author.id, stolenAmount);
          updateKarma(message.author.id, -5);
          message.reply(
            `🦹 คุณขโมย ${stolenAmount} บาท จาก ${target.username} สำเร็จ! แต่ Karma ลดลง 5`
          );
        } else {
          updateKarma(message.author.id, -5);
          message.reply(`😓 การขโมยล้มเหลว... Karma ลดลง 5`);
        }
      } else {
        updateKarma(message.author.id, -5);
        message.reply(`💸 เป้าหมายไม่มีเงินในกระเป๋า... Karma ลดลง 5`);
      }

      // Update steal attempts
      stealAttempts.set(key, attempts + 1);
    } catch (error) {
      console.error("❌ Error processing steal command:", error);
      message.reply("❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง กรุณาลองใหม่อีกครั้ง");
    }
  },
};

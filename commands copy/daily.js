const { addBalance, addLog } = require("../utils/wallet");
const { hasClaimedDaily, setClaimedDaily } = require("../utils/dailyReward");
const { getDailyReward } = require("../utils/rewards");

module.exports = {
  name: "daily",
  execute(message) {
    const userId = message.author.id;

    try {
      // Check if the user has already claimed their daily reward today
      if (hasClaimedDaily(userId)) {
        return message.reply(
          "❌ วันนี้คุณรับรางวัลรายวันไปแล้ว กรุณามารับใหม่พรุ่งนี้!"
        );
      }

      // Get the daily reward amount
      const reward = getDailyReward();

      // Add balance and log the transaction
      addBalance(userId, reward);
      setClaimedDaily(userId);
      addLog(userId, "daily", `Claimed ${reward} coins`);

      // Prepare the reward message
      let rewardMessage = `✅ คุณได้รับรางวัลรายวัน ${reward} บาท!`;

      // Add special messages for high rewards
      if (reward > 700) {
        rewardMessage += "\n🎉 โชคดีมาก! คุณได้รับรางวัลพิเศษ!";
      } else if (reward > 500) {
        rewardMessage += "\n🎈 โชคดี! คุณได้รับรางวัลสูง!";
      }

      // Optional: Add a random bonus for extra fun
      const randomBonus =
        Math.random() < 0.1 ? Math.floor(Math.random() * 100) + 50 : 0;
      if (randomBonus > 0) {
        addBalance(userId, randomBonus);
        rewardMessage += `\n🎁 โบนัสพิเศษ! คุณได้รับเพิ่มอีก ${randomBonus} บาท!`;
      }

      return message.reply(rewardMessage);
    } catch (error) {
      console.error("❌ Error processing daily reward:", error);
      return message.reply(
        "❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง กรุณาลองใหม่อีกครั้ง"
      );
    }
  },
};

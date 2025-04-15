const { addBalance, updateKarma, getKarma } = require("../utils/wallet");
const { getWorkReward } = require("../utils/rewards");

const KARMA_REWARD = 1;
const BONUS_THRESHOLD = 80;
const LOW_KARMA_THRESHOLD = 20; // กำหนดค่า threshold สำหรับ karma ต่ำ
const LOW_KARMA_FAIL_CHANCE = 0.7; // โอกาสที่จะไม่ได้รับรางวัลหาก karma ต่ำ

module.exports = {
  name: "answer",
  execute(message, args, { commands }) {
    const workCommand = commands.get("work");
    if (!workCommand || !workCommand.globalMathChallengeRef) {
      return message.reply("⚠️ ไม่มีคำถามให้ตอบในขณะนี้");
    }

    const challenge = workCommand.globalMathChallengeRef.value;
    if (!challenge) {
      return message.reply("⚠️ ไม่มีคำถามให้ตอบในขณะนี้");
    }

    // Debug command for admins to simulate a correct answer
    if (args[0] === "dev") {
      // Check if the user has admin permissions
      if (!message.member.permissions.has("Administrator")) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้");
      }

      // Simulate a correct answer and award the reward
      const reward = getWorkReward();
      const karma = getKarma(message.author.id);

      // Award the user with balance and karma
      addBalance(message.author.id, reward);
      updateKarma(message.author.id, KARMA_REWARD);

      // Clear the global challenge and timeout
      workCommand.globalMathChallengeRef.value = null;
      if (workCommand.challengeTimeout) {
        clearTimeout(workCommand.challengeTimeout); // Cancel the timeout
        workCommand.challengeTimeout = null; // Reset the timeout variable
      }

      let bonusMessage = `✅ [DEBUG] คุณได้รับ ${reward} บาท`;
      if (reward >= BONUS_THRESHOLD) {
        bonusMessage += ` 🎉 โบนัสใหญ่! ยินดีด้วย!\nhttps://media.giphy.com/media/111ebonMs90YLu/giphy.gif`;
      }

      return message.reply(bonusMessage);
    }

    // Normal answer handling
    if (!args.length) {
      return message.reply("❌ ใส่คำตอบด้วย (.answer คำตอบ)");
    }

    const userAnswer = args.join(" ").toLowerCase();
    if (userAnswer === challenge.answer) {
      const reward = getWorkReward();
      const karma = getKarma(message.author.id);

      // Check if the user's karma is too low to receive a reward
      if (
        karma < LOW_KARMA_THRESHOLD &&
        Math.random() < LOW_KARMA_FAIL_CHANCE
      ) {
        updateKarma(message.author.id, KARMA_REWARD); // เพิ่ม karma แต่ไม่ให้รางวัล
        workCommand.globalMathChallengeRef.value = null; // Clear the global challenge
        if (workCommand.challengeTimeout) {
          clearTimeout(workCommand.challengeTimeout); // Cancel the timeout
          workCommand.challengeTimeout = null; // Reset the timeout variable
        }
        return message.reply(
          `❌ ถูกต้อง! แต่ Karma ของคุณ (${karma}) ต่ำเกินไป ไม่สามารถรับรางวัลได้ในครั้งนี้`
        );
      }

      // Award the user with balance and karma
      addBalance(message.author.id, reward);
      updateKarma(message.author.id, KARMA_REWARD);

      // Clear the global challenge and timeout
      workCommand.globalMathChallengeRef.value = null;
      if (workCommand.challengeTimeout) {
        clearTimeout(workCommand.challengeTimeout); // Cancel the timeout
        workCommand.challengeTimeout = null; // Reset the timeout variable
      }

      let bonusMessage = `✅ ถูกต้อง! คุณได้รับ ${reward} บาท`;
      if (reward >= BONUS_THRESHOLD) {
        bonusMessage += ` 🎉 โบนัสใหญ่! ยินดีด้วย!\nhttps://media.giphy.com/media/111ebonMs90YLu/giphy.gif`;
      }

      return message.reply(bonusMessage);
    }

    return message.reply("❌ คำตอบผิด! ลองใหม่ได้");
  },
};

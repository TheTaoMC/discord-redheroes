const { getKarma } = require("../utils/wallet");
const {
  generateHardMathQuestion,
  generateWordGuessChallenge,
} = require("../utils/generators");

const WORK_COOLDOWN = 10 * 1000; // 10 seconds
const CHALLENGE_TIMEOUT = 60 * 1000; // 60 seconds
const LOW_KARMA_THRESHOLD = 20;

const workCooldowns = new Map();

module.exports = {
  name: "1work",
  globalMathChallengeRef: { value: null }, // Global challenge reference
  challengeTimeout: null, // Timeout for clearing the challenge

  execute(message) {
    const userId = message.author.id;
    const now = Date.now();
    const lastUsed = workCooldowns.get(userId) || 0;

    // Check cooldown
    if (now - lastUsed < WORK_COOLDOWN) {
      const remainingTime = Math.ceil(
        (WORK_COOLDOWN - (now - lastUsed)) / 1000
      );
      return message.reply(`⏳ โปรดรออีก ${remainingTime} วินาที`);
    }
    workCooldowns.set(userId, now);

    // Check if there's an existing global challenge
    if (this.globalMathChallengeRef.value) {
      return message.reply(
        "🧠 มีคำถามอยู่แล้ว! ตอบคำถามให้เสร็จก่อนโดยใช้ .answer คำตอบ"
      );
    }

    // Check karma and notify user about low karma chance
    const karma = getKarma(userId);
    let warningMessage = "";
    if (karma < LOW_KARMA_THRESHOLD) {
      //warningMessage = `\n⚠️ Karma ของคุณ (${karma}) ต่ำเกินไป คุณมีโอกาสต่ำที่จะได้รับรางวัล`;
    }

    // Generate challenge
    let question, answer, challengeType;
    try {
      challengeType = Math.random() < 0.5 ? "math" : "word";
      ({ question, answer } =
        challengeType === "math"
          ? generateHardMathQuestion()
          : generateWordGuessChallenge());
    } catch (error) {
      console.error("❌ Error generating challenge:", error);
      return message.reply(
        "❌ เกิดข้อผิดพลาดในการสร้างคำถาม กรุณาลองใหม่อีกครั้ง"
      );
    }

    // Store global challenge
    this.globalMathChallengeRef.value = {
      answer: answer.toString().toLowerCase(),
      type: challengeType,
      askedBy: userId,
      createdAt: now,
    };

    // Set timeout to clear the challenge
    if (this.challengeTimeout) clearTimeout(this.challengeTimeout); // Clear any existing timeout
    this.challengeTimeout = setTimeout(() => {
      if (this.globalMathChallengeRef.value) {
        this.globalMathChallengeRef.value = null;
        message.channel.send(
          `⏳ หมดเวลาตอบคำถามแล้ว! คุณสามารถเริ่มงานใหม่โดยใช้คำสั่ง \`.work\``
        );
      }
    }, CHALLENGE_TIMEOUT);

    // Notify user about the challenge and karma warning
    return message.channel.send(
      `🎮 คำถามประเภท: ${
        challengeType === "math" ? "คณิตศาสตร์" : "เติมคำ"
      }\n${question}\nใช้คำสั่ง: .answer คำตอบ${warningMessage}`
    );
  },
};

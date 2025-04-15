const db = require("../../db");

function doubleKarmaEffect(userId, itemId, { updateKarma }) {
  try {
    // Add 20 Karma to the user
    updateKarma(userId, 20);

    return {
      success: true,
      reaction: "✅", // ส่งกลับ Emoji Reaction
    };
  } catch (error) {
    console.error("❌ Error processing double karma effect:", error);
    return {
      success: false,
      message: "❌ เกิดข้อผิดพลาดขณะใช้งานไอเทมเพิ่ม Double Karma",
    };
  }
}

module.exports = doubleKarmaEffect;

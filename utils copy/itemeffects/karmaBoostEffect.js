const db = require("../../db");

function karmaBoostEffect(userId, itemId, { updateKarma }) {
  try {
    // Add 10 Karma to the user
    updateKarma(userId, 10);

    return {
      success: true,
      reaction: "✅", // ส่งกลับ Emoji Reaction
    };
  } catch (error) {
    console.error("❌ Error processing karma boost effect:", error);
    return {
      success: false,
      message: "❌ เกิดข้อผิดพลาดขณะใช้งานไอเทมเพิ่ม Karma",
    };
  }
}

module.exports = karmaBoostEffect;

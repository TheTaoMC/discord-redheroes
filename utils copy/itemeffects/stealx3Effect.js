const db = require("../../db");

function stealx3Effect(userId, itemId) {
  try {
    // Deduct the stealx3 item from the user's inventory
    db.prepare(
      "UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0"
    ).run(userId, itemId);

    return {
      success: true,
      multiplier: 3,
      message: "🦹‍♂️ โอกาสขโมย x3 ถูกเปิดใช้งาน!",
    };
  } catch (error) {
    console.error("❌ Error processing stealx3 effect:", error);
    return {
      success: false,
      message: "❌ เกิดข้อผิดพลาดขณะใช้งานไอเทมขโมย x3",
    };
  }
}

module.exports = stealx3Effect;

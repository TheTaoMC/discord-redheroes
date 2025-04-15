const db = require("../../db");

function stealx2Effect(userId, itemId) {
  try {
    // Deduct the stealx2 item from the user's inventory
    db.prepare(
      "UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0"
    ).run(userId, itemId);

    return {
      success: true,
      multiplier: 2,
      message: "🦹 โอกาสขโมย x2 ถูกเปิดใช้งาน!",
    };
  } catch (error) {
    console.error("❌ Error processing stealx2 effect:", error);
    return {
      success: false,
      message: "❌ เกิดข้อผิดพลาดขณะใช้งานไอเทมขโมย x2",
    };
  }
}

module.exports = stealx2Effect;

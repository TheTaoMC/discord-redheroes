const db = require("../../db");

function lockEffect(userId, itemId) {
  try {
    // Deduct the lock item from the user's inventory
    db.prepare(
      "UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0"
    ).run(userId, itemId);

    return {
      success: false,
      message: "🔒 เป้าหมายล็อกกระเป๋าอยู่! ขโมยไม่สำเร็จ...",
    };
  } catch (error) {
    console.error("❌ Error processing lock effect:", error);
    return {
      success: false,
      message: "❌ เกิดข้อผิดพลาดขณะใช้งานไอเทมล็อคกระเป๋า",
    };
  }
}

module.exports = lockEffect;

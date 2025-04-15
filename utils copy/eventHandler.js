const db = require("../db");
const itemEffects = require("./itemeffect");

function handleEvent(eventName, userId, targetId, { updateKarma }) {
  try {
    const items = db
      .prepare("SELECT id FROM items WHERE event = ?")
      .all(eventName);

    for (const item of items) {
      const inventory = db
        .prepare(
          "SELECT quantity FROM user_inventory WHERE user_id = ? AND item_id = ?"
        )
        .get(userId || targetId, item.id);

      if (inventory?.quantity > 0) {
        const result = itemEffects.useItem(item.id, userId || targetId, {
          updateKarma,
        });

        if (result.success === false && eventName === "beforeSteal") {
          return result;
        }

        // Add a flag to indicate that an item was used
        result.usedItem = true;
        return result;
      }
    }

    // No item was used
    return {
      success: true,
      usedItem: false,
      message: "✅ ไม่มีไอเท็มที่ตอบสนองกับเหตุการณ์นี้",
    };
  } catch (error) {
    console.error(`❌ Error handling ${eventName} event:`, error);
    return {
      success: false,
      usedItem: false,
      message: "❌ เกิดข้อผิดพลาดขณะประมวลผลเหตุการณ์",
    };
  }
}

module.exports = {
  handleEvent,
};

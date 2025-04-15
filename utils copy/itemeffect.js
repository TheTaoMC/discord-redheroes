const db = require("../db");
const lockEffect = require("./itemeffects/lockEffect");
const stealx2Effect = require("./itemeffects/stealx2Effect");
const karmaBoostEffect = require("./itemeffects/karmaBoostEffect");
const doubleKarmaEffect = require("./itemeffects/doubleKarmaEffect");
const stealx3Effect = require("./itemeffects/stealx3Effect");

// Create a mapping of item types to their effect functions
const itemEffectsMap = {
  lock: lockEffect,
  stealx2: stealx2Effect,
  stealx3: stealx3Effect,
  karma_boost: karmaBoostEffect,
  double_karma: doubleKarmaEffect,
  // เพิ่มไอเทมใหม่ได้ง่ายโดยเพิ่ม key-value ใน Object นี้
};

// Main function to use an item
function useItem(itemId, userId, { updateKarma }) {
  try {
    const item = db.prepare("SELECT * FROM items WHERE id = ?").get(itemId);
    if (!item) {
      return { success: false, message: "❌ ไม่พบไอเทมนี้ในระบบ" };
    }

    const effectFunction = itemEffectsMap[item.type];
    if (!effectFunction) {
      return {
        success: false,
        message: `❌ ไอเทม ${item.name} ยังไม่รองรับการใช้งาน`,
      };
    }

    return effectFunction(userId, itemId, { updateKarma });
  } catch (error) {
    console.error("❌ Error processing item usage:", error);
    return { success: false, message: "❌ เกิดข้อผิดพลาดขณะใช้งานไอเทม" };
  }
}

module.exports = {
  useItem,
};

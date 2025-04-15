const db = require("../db");

module.exports = {
  name: "shop",
  execute(message) {
    try {
      // Get all items from the database
      const items = db.prepare("SELECT * FROM items").all();

      if (items.length === 0) {
        return message.reply("❌ ไม่มีไอเทมในร้านค้าขณะนี้");
      }

      // Format the list of items
      const itemList = items
        .map((item, index) => {
          return `${index + 1}. ${item.description} - ${item.price} บาท`;
        })
        .join("\n");

      // Send the shop list to the user
      return message.reply(`🛒 รายการไอเทมในร้านค้า:\n${itemList}`);
    } catch (error) {
      console.error("❌ Error processing shop command:", error);
      return message.reply(
        "❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง กรุณาลองใหม่อีกครั้ง"
      );
    }
  },
};

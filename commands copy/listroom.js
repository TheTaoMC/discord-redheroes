const db = require("../db");

module.exports = {
  name: "listroom",
  execute(message) {
    try {
      // Get the list of allowed rooms
      const allowedRooms = db.getAllowedRooms();

      if (allowedRooms.length === 0) {
        return message.reply("❌ ยังไม่มีห้องที่อนุญาตในระบบ");
      }

      // Create a formatted list of rooms
      const roomList = allowedRooms
        .map((roomId, index) => `${index + 1}. <#${roomId}>`)
        .join("\n");

      // Send the list to the user
      return message.reply(`📋 รายการห้องที่อนุญาต:\n${roomList}`);
    } catch (error) {
      console.error("❌ Error processing listroom command:", error);
      return message.reply(
        "❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง กรุณาลองใหม่อีกครั้ง"
      );
    }
  },
};

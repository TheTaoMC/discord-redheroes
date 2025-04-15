const db = require("../db");

module.exports = {
  name: "delroom",
  execute(message, args) {
    try {
      // Get the index from arguments
      const index = parseInt(args[0], 10);
      if (isNaN(index) || index <= 0) {
        return message.reply(
          "โปรดระบุลำดับห้องที่ต้องการลบ เช่น `.del 1`"
        );
      }

      // Remove the room from the allowed rooms list
      const success = db.removeAllowedRoom(index - 1); // Convert to zero-based index
      if (!success) {
        return message.reply("❌ ลำดับห้องที่ระบุไม่ถูกต้อง");
      }

      // Notify the user of success
      return message.reply("✅ ลบห้องออกจากลิสต์เรียบร้อยแล้ว");
    } catch (error) {
      console.error("❌ Error processing delroom command:", error);
      return message.reply(
        "❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง กรุณาลองใหม่อีกครั้ง"
      );
    }
  },
};
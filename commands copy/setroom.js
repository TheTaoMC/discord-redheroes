const db = require("../db");

module.exports = {
  name: "setroom",
  execute(message, args) {
    try {
      // Check if the user has administrator permissions
      if (!message.member.permissions.has("Administrator")) {
        return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้ (ต้องเป็นแอดมิน)");
      }

      // Get the new channel ID from arguments
      const newId = args[0];
      if (!newId || !/^\d+$/.test(newId)) {
        return message.reply(
          "โปรดระบุ ID ห้องที่ถูกต้อง เช่น `.setroom 123456789012345678`"
        );
      }

      // Verify that the channel exists in the server
      const channel = message.guild.channels.cache.get(newId);
      if (!channel) {
        return message.reply(
          "❌ ไม่พบห้องที่ระบุในเซิร์ฟเวอร์ กรุณาตรวจสอบ ID ห้อง"
        );
      }

      // Check if the channel is a text channel
      if (channel.type !== 0) {
        // 0 = GUILD_TEXT (Text Channel)
        return message.reply(
          "❌ ห้องที่ระบุไม่ใช่ Text Channel กรุณาตรวจสอบ ID ห้อง"
        );
      }

      // Add the room to the allowed rooms list
      db.addAllowedRoom(newId);

      // Notify the user of success
      return message.reply(`✅ เพิ่มห้องสำหรับบอทเรียบร้อย: <#${newId}>`);
    } catch (error) {
      console.error("❌ Error processing setroom command:", error);
      return message.reply(
        "❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง กรุณาลองใหม่อีกครั้ง"
      );
    }
  },
};

const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "setroom",
  description: "ตั้งค่าห้องที่บอทจะทำงาน",
  async execute(message, args, { client, db }) {
    // ตรวจสอบว่าผู้ใช้งานเป็น Admin หรือไม่
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("❌ คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้!");
    }

    // รับ room_id จากข้อความ
    const roomId = args[0]?.replace(/[<#>]/g, ""); // ลบ <#> ออกจาก ID
    if (!roomId) {
      return message.reply("❌ กรุณาระบุ ID ของห้อง!");
    }

    // ตรวจสอบว่าห้องนี้เป็น Text Channel หรือไม่
    const room = message.guild.channels.cache.get(roomId);
    if (!room || room.type !== 0) {
      // type === 0 หมายถึง Text Channel
      return message.reply("❌ ห้องนี้ไม่ใช่ Text Channel!");
    }

    // ตรวจสอบว่า room_id มีอยู่ในฐานข้อมูลแล้วหรือไม่
    db.get(
      "SELECT * FROM rooms WHERE room_id = ?",
      [roomId],
      async (err, row) => {
        if (err) {
          console.error("❌ Error checking room:", err.message);
          return message.reply("❌ เกิดข้อผิดพลาดขณะตรวจสอบห้อง!");
        }

        try {
          if (row) {
            // อัพเดทข้อมูลห้องในฐานข้อมูล
            await db.run(
              "UPDATE rooms SET room_name = ?, updated_at = CURRENT_TIMESTAMP WHERE room_id = ?",
              [room.name, roomId]
            );
            message.reply(`✅ อัพเดทห้อง ${room.name} (${roomId}) สำเร็จ!`);
          } else {
            // เพิ่มห้องใหม่ในฐานข้อมูล
            await db.run(
              "INSERT INTO rooms (room_id, room_name, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)",
              [roomId, room.name]
            );
            message.reply(
              `✅ เพิ่มห้อง ${room.name} (${roomId}) ลงในฐานข้อมูลสำเร็จ!`
            );
          }
        } catch (error) {
          console.error("❌ Error saving room:", error.message);
          message.reply("❌ เกิดข้อผิดพลาดขณะบันทึกห้อง!");
        }
      }
    );
  },
};

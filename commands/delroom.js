module.exports = {
  name: "delroom",
  description: "ลบห้องที่บอทจะทำงานออกจากฐานข้อมูล",
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

    // ตรวจสอบว่าห้องนี้มีอยู่ในฐานข้อมูลหรือไม่
    db.get("SELECT * FROM rooms WHERE room_id = ?", [roomId], (err, row) => {
      if (err) {
        console.error("❌ Error checking room:", err.message);
        return message.reply("❌ เกิดข้อผิดพลาดขณะตรวจสอบห้อง!");
      }

      if (!row) {
        return message.reply("❌ ไม่มีห้องนี้ในระบบ!");
      }

      // ลบห้องออกจากฐานข้อมูล
      db.run("DELETE FROM rooms WHERE room_id = ?", [roomId], (err) => {
        if (err) {
          console.error("❌ Error deleting room:", err.message);
          return message.reply("❌ เกิดข้อผิดพลาดขณะลบห้อง!");
        }

        message.reply(
          `✅ ลบห้อง ${row.room_name} (${roomId}) ออกจากระบบสำเร็จ!`
        );
      });
    });
  },
};

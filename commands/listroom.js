const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "listroom",
  description: "แสดงรายชื่อห้องที่บอทจะทำงาน",
  async execute(message, args, { client, db }) {
    // Fetch all rooms from the database
    db.all("SELECT room_id, room_name FROM rooms", [], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching rooms:", err.message);
        return message.reply("❌ เกิดข้อผิดพลาดขณะดึงข้อมูลห้อง!");
      }

      // If no rooms are set
      if (rows.length === 0) {
        return message.reply("❌ ยังไม่มีห้องที่ถูกตั้งค่าไว้!");
      }

      // Create an embed to display the list of rooms
      const embed = new EmbedBuilder()
        .setTitle("📝 รายชื่อห้องที่บอทจะทำงาน")
        .setDescription("รายการห้องที่ถูกตั้งค่าด้วยคำสั่ง `.setroom`")
        .addFields(
          rows.map((row, index) => ({
            name: `#${index + 1}`,
            value: `Room ID: \`${row.room_id}\`\nRoom Name: **${row.room_name}**`,
            inline: false,
          }))
        )
        .setColor("#FFA500") // Orange color
        .setTimestamp();

      // Send the embed message
      message.channel.send({ embeds: [embed] });
    });
  },
};

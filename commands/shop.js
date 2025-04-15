const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "shop",
  description: "แสดงรายการไอเท็มในร้านค้า",
  async execute(message, args, { client, db }) {
    // Fetch all items from the database
    db.all("SELECT * FROM items", [], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching shop items:", err.message);
        return message.reply("❌ เกิดข้อผิดพลาดขณะดึงข้อมูล!");
      }

      // If no items in the shop
      if (!rows || rows.length === 0) {
        return message.reply("❌ ร้านค้าไม่มีไอเท็ม!");
      }

      // Build the embed for displaying shop items
      const embed = new EmbedBuilder()
        .setTitle("🏪 รายการไอเท็มในร้านค้า")
        .setDescription("ใช้คำสั่ง `.buy <หมายเลข>` เพื่อซื้อไอเท็ม")
        .setColor("#FFD700") // Gold color
        .setTimestamp();

      // Add each item to the embed
      rows.forEach((item, index) => {
        embed.addFields({
          name: `#${index + 1} ${item.name}`,
          value: `💰 ราคา: \`${item.price}\` บาท\n📝 คำอธิบาย: ${item.description}`,
          inline: false,
        });
      });

      // Send the embed message
      message.channel.send({ embeds: [embed] });
    });
  },
};

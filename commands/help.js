const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  description: "แสดงรายการคำสั่งทั้งหมด",
  execute(message, args) {
    // List of commands categorized
    const categories = {
      economy: [
        { name: ".work", description: "หางาน" },
        {
          name: ".daily",
          description: "รับรางวัลประจำชั่วโมง (Cooldown: 1 ชั่วโมง)",
        },
        {
          name: ".balance",
          description: "ตรวจสอบยอดเงิน, Karma และไอเท็มของคุณใน DM",
        },
        {
          name: ".transfer @user <amount>",
          description: "โอนเงินให้ผู้เล่นอื่น",
        },
        {
          name: ".steal @user",
          description: "พยายามขโมยเงินจากผู้ใช้งานคนอื่น (จำกัด 5 ครั้งต่อวัน)",
        },
      ],
      auctionHouse: [
        {
          name: ".buybox",
          description: "ซื้อกล่องสุ่มไอเท็ม (Cooldown: 1 ชั่วโมง)",
        },
        { name: ".ach", description: "แสดงรายการไอเท็มใน Auction House" },
        {
          name: ".ach sell <item_id> <price>",
          description: "นำไอเท็มมาขายใน Auction House",
        },
        {
          name: ".ach buy <item_id>",
          description: "ซื้อไอเท็มจาก Auction House",
        },
      ],
      games: [
        {
          name: ".coinflip <h/t> <amount>",
          description: "เล่นเกมหัวก้อยโดยเดิมพันจำนวนเงิน",
        },
        {
          name: ".trivia",
          description: "เล่นเกมตอบคำถาม Trivia เพื่อรับรางวัล",
        },
        {
          name: ".rps <rock/paper/scissors> <amount>",
          description: "เล่นเกมเป่ายิ้งฉุบโดยเดิมพันจำนวนเงิน",
        },
      ],
      other: [
        { name: ".top", description: "ดูอันดับผู้ใช้งานตามยอดเงินหรือ Karma" },
        { name: ".help", description: "แสดงรายการคำสั่งที่พร้อมใช้งาน" },
        { name: ".setroom #room", description: "กำหนดห้อง สำหรับ Admin" },
        { name: ".listroom #room", description: "รายชื่อห้อง สำหรับ Admin" },
        { name: ".delroom #room", description: "ลบห้อง สำหรับ Admin" },
      ],
    };

    // Build the embed
    const embed = new EmbedBuilder()
      .setTitle("📚 รายการคำสั่ง")
      .setDescription("คำสั่งทั้งหมดที่สามารถใช้งานได้:")
      .setColor("#00FFFF");

    // Add fields for each category
    for (const [category, cmds] of Object.entries(categories)) {
      embed.addFields({
        name: `📝 หมวดหมู่: ${category.toUpperCase()}`,
        value: cmds
          .map((cmd) => `**${cmd.name}**: ${cmd.description}`)
          .join("\n"),
        inline: false,
      });
    }

    // Send the embed
    message.channel.send({ embeds: [embed] });
  },
};

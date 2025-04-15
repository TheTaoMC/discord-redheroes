const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "help",
  description: "แสดงรายการคำสั่งที่พร้อมใช้งาน",
  async execute(message, args, { client }) {
    // List of commands
    const commands = [
      {
        name: ".work",
        description: "หางาน",
      },
      {
        name: ".answer <answer>",
        description: "ตอบคำถาม",
      },
      {
        name: ".transfer @user <amount>",
        description: "โอนเงินให่ผู้เล่นอื่น",
      },
      {
        name: ".balance",
        description: "ตรวจสอบยอดเงิน, Karma และไอเท็มของคุณใน DM",
      },
      {
        name: ".steal @user",
        description: "พยายามขโมยเงินจากผู้ใช้งานคนอื่น (จำกัด 5 ครั้งต่อวัน)",
      },
      {
        name: ".shop",
        description: "ร้านขายของ",
      },
      {
        name: ".buy <item_no>",
        description: "ซื้อไอเท็มจากร้านค้าโดยใช้หมายเลขไอเท็ม",
      },
      {
        name: ".top",
        description: "ดูลำดับคนดีและรวยมาก",
      },
      {
        name: ".help",
        description: "แสดงรายการคำสั่งที่พร้อมใช้งาน",
      },
    ];

    // Build the embed for displaying commands
    const embed = new EmbedBuilder()
      .setTitle("📚 รายการคำสั่ง")
      .setDescription("นี่คือคำสั่งทั้งหมดที่คุณสามารถใช้งานได้:")
      .addFields(
        ...commands.map((cmd) => ({
          name: cmd.name,
          value: cmd.description,
          inline: false,
        }))
      )
      .setColor("#0099FF") // Blue color
      .setTimestamp();

    // Send the embed in the channel
    message.channel.send({ embeds: [embed] });
  },
};

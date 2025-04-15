const { transferBalance } = require("../utils/wallet");
const db = require("../db");

module.exports = {
  name: "transfer",
  async execute(message, args) {
    try {
      // Parse arguments
      const target = message.mentions.users.first();
      const amount = parseInt(args[1]);

      // Validate input
      if (!target || isNaN(amount)) {
        return message.reply(
          "❌ รูปแบบคำสั่งไม่ถูกต้อง: `.transfer @user จำนวน`"
        );
      }

      if (amount <= 0) {
        return message.reply("❌ กรุณาระบุจำนวนเงินที่มากกว่า 0");
      }

      // Get sender and receiver IDs
      const senderId = message.author.id;
      const receiverId = target.id;

      // Get the GuildMember object for the target user
      const targetMember = message.guild.members.cache.get(target.id);
      const displayName = targetMember
        ? targetMember.displayName
        : target.username;

      // Transfer balance
      const success = transferBalance(senderId, receiverId, amount);
      if (success) {
        // Add log entry for the transaction
        db.addLog(
          senderId,
          "transfer",
          `Transferred ${amount} coins to ${target.tag}`
        );

        // Notify both sender and receiver
        message.reply(`✅ โอน ${amount} บาทให้ ${displayName} เรียบร้อยแล้ว`);
        target
          .send(`💸 คุณได้รับ ${amount} บาท จาก ${message.author.tag}`)
          .catch((error) => {
            console.error(`❌ Failed to send DM to user ${target.tag}:`, error);
          });
      } else {
        message.reply(`💸 เงินในบัญชีของคุณไม่พอจะโอน!`);
      }
    } catch (error) {
      console.error("❌ Error processing transfer command:", error);
      message.reply("❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง กรุณาลองใหม่อีกครั้ง");
    }
  },
};

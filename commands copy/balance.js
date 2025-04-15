const db = require("../db");
const { getBalance, getKarma } = require("../utils/wallet");

module.exports = {
  name: "balance",
  execute(message, args) {
    // Block checking other users' balance
    if (args.length > 0 && message.mentions.users.size > 0) {
      return message.reply("❌ คุณสามารถดูข้อมูลของตัวเองได้เท่านั้น");
    }

    try {
      // Fetch balance and karma for the command user
      const userId = message.author.id;
      const balance = getBalance(userId);
      const karma = getKarma(userId);

      // Fetch inventory items from the database
      const inventory = db
        .prepare(
          `
        SELECT i.name, ui.quantity
        FROM user_inventory ui
        JOIN items i ON ui.item_id = i.id
        WHERE ui.user_id = ? and auto_use = 'N'
      `
        )
        .all(userId);

      // Format the inventory list
      const inventoryList =
        inventory.length > 0
          ? inventory
              .map((item) => `• ${item.name} x${item.quantity}`)
              .join("\n")
          : "🎒 กระเป๋า: ว่างเปล่า";

      // Get the user's display name (nickname if available, otherwise username)
      const displayName = message.member.nickname || message.author.username;

      // Prepare the response message with the display name
      const responseMessage = `👤 ${displayName}\n💰 ${balance} บาท | 🧭 Karma: ${karma}\n\n📦 ไอเทมในกระเป๋า:\n${inventoryList}`;

      // Send the response as a Direct Message (DM)
      message.author
        .send(responseMessage)
        .then(() => {
          // Add a reaction to confirm the DM was sent successfully
          message.react("✅").catch((error) => {
            console.error("❌ Error adding reaction:", error);
          });
        })
        .catch((error) => {
          console.error("❌ Error sending DM:", error);
          return message.reply(
            "❌ ไม่สามารถส่งข้อมูลทาง DM ได้ กรุณาตรวจสอบการตั้งค่าบัญชีของคุณ"
          );
        });
    } catch (error) {
      console.error("❌ Error fetching balance:", error);
      return message.reply(
        "❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง กรุณาลองใหม่อีกครั้ง"
      );
    }
  },
};

const db = require("../db");
const { getBalance, addBalance, updateKarma } = require("../utils/wallet");
const itemEffects = require("../utils/itemeffect");

module.exports = {
  name: "buy",
  async execute(message, args) {
    try {
      // Step 1: Parse the item ID from the command arguments
      const itemId = parseInt(args[0]);

      if (!itemId || isNaN(itemId)) {
        return message.reply(
          "❌ โปรดระบุลำดับไอเทมที่ต้องการซื้อ เช่น `.buy 1`"
        );
      }

      // Step 2: Fetch the item details from the database
      const item = db.prepare("SELECT * FROM items WHERE id = ?").get(itemId);

      if (!item) {
        return message.reply("❌ ไม่พบไอเทมนี้ในร้านค้า");
      }

      // Step 3: Check if the user has enough balance to buy the item
      const userId = message.author.id;
      const userBalance = getBalance(userId);

      if (userBalance < item.price) {
        return message.reply(`❌ เงินของคุณไม่พอสำหรับซื้อ ${item.name}`);
      }

      // Step 4: Deduct the money from the user's wallet
      addBalance(userId, -item.price);

      // Notify the user of success
      let responseMessage = `✅ คุณได้ซื้อ ${
        item.name
      } สำเร็จ! เงินคงเหลือ: ${getBalance(userId)} บาท`;

      // Step 5: Check if the item should be used immediately (auto_use = 'Y')
      if (item.auto_use === "Y") {
        const useResult = itemEffects.useItem(item.id, userId, { updateKarma });

        if (useResult.success) {
          if (useResult.reaction) {
            // Add a reaction to the message
            await message.react(useResult.reaction);
          } else {
            responseMessage += `\n${useResult.message}`;
          }
        } else {
          responseMessage += `\n⚠️ ไม่สามารถใช้งานไอเทมนี้ได้: ${useResult.message}`;
        }
      } else {
        // If auto_use = 'N', add the item to the inventory
        db.prepare(
          "INSERT OR REPLACE INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, COALESCE((SELECT quantity FROM user_inventory WHERE user_id = ? AND item_id = ?), 0) + 1)"
        ).run(userId, item.id, userId, item.id);

        responseMessage += `\n📦 ไอเทม ${item.name} ถูกเก็บไว้ในกระเป๋าของคุณ`;
      }

      // Step 6: Send the final response message to the user
      return message.reply(responseMessage);
    } catch (error) {
      console.error("❌ Error processing buy command:", error);
      return message.reply(
        "❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง กรุณาลองใหม่อีกครั้ง"
      );
    }
  },
};

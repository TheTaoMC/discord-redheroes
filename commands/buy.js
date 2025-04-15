const path = require("path");

module.exports = {
  name: "buy",
  description: "ซื้อไอเท็มจากร้านค้า",
  async execute(message, args, { client, db }) {
    const userId = message.author.id;
    const itemNo = parseInt(args[0]);

    if (!itemNo || isNaN(itemNo)) {
      return message.reply("❌ กรุณาใส่หมายเลขไอเท็มที่ต้องการซื้อ!");
    }

    // Fetch the item from the database
    db.get("SELECT * FROM items WHERE id = ?", [itemNo], async (err, item) => {
      if (err) {
        console.error("❌ Error fetching item:", err.message);
        return message.reply("❌ เกิดข้อผิดพลาดขณะดึงข้อมูล!");
      }

      if (!item) {
        return message.reply("❌ ไม่มีไอเท็มนี้ในร้านค้า!");
      }

      // Fetch user data
      const userRow = await getUserData(db, userId);

      // Check if the user has enough balance
      if (userRow.balance < item.price) {
        return message.reply("❌ เงินไม่พอ!");
      }

      // Deduct money from the user's balance
      db.run("UPDATE users SET balance = balance - ? WHERE user_id = ?", [
        item.price,
        userId,
      ]);

      // Handle item based on its type and auto_use
      if (item.auto_use === "N") {
        // Apply immediate effect for items with auto_use = N
        try {
          const effectPath = path.join(
            __dirname,
            `../utils/itemeffects/${item.effect_file}`
          );
          const effectModule = require(effectPath);
          await effectModule.execute(userId, db); // Pass userId and db
          message.reply(`🎉 ไอเท็ม \`${item.name}\` ถูกใช้งานทันที!`);
        } catch (err) {
          console.error(
            `❌ Error applying effect for item ${item.name}:`,
            err.message
          );
          return message.reply("❌ เกิดข้อผิดพลาดขณะใช้งานไอเท็ม!");
        }
      } else {
        // Add the item to the user's inventory
        db.run(
          "INSERT INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, 1) ON CONFLICT(user_id, item_id) DO UPDATE SET quantity = quantity + 1",
          [userId, item.id],
          (err) => {
            if (err) {
              console.error("❌ Error adding item to inventory:", err.message);
              return message.reply(
                "❌ เกิดข้อผิดพลาดขณะเพิ่มไอเท็มเข้ากระเป๋า!"
              );
            }
            message.reply(`✅ คุณซื้อไอเท็ม \`${item.name}\` เรียบร้อยแล้ว!`);
          }
        );
      }
    });
  },
};

// Helper function to fetch user data
async function getUserData(db, userId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, row) => {
      if (err) {
        console.error("❌ Error fetching user data:", err.message);
        reject(err);
      }
      resolve(row || { balance: 0 });
    });
  });
}

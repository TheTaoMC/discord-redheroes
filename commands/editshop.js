const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "editshop",
  description: "แก้ไขราคาไอเท็มในร้านค้า (เฉพาะแอดมิน)",
  async execute(message, args, { client, db }) {
    // Check if the user is an admin
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("❌ คุณไม่มีสิทธิ์ใช้คำสั่งนี้!");
    }

    const itemNo = parseInt(args[0]);
    const newPrice = parseInt(args[1]);

    // Validate inputs
    if (isNaN(itemNo) || isNaN(newPrice) || newPrice <= 0) {
      return message.reply("❌ กรุณาใส่หมายเลขไอเท็มและราคาใหม่ที่ถูกต้อง");
    }

    // Fetch the item from the database
    const item = await getShopItem(db, itemNo);
    if (!item) {
      return message.reply("❌ ไม่พบไอเท็มหมายเลขนี้ในร้านค้า!");
    }

    // Update the item's price in the database
    db.run("UPDATE items SET price = ? WHERE id = ?", [newPrice, itemNo]);

    // Delete the command input message
    message.delete();

    // Notify the admin by sending a hidden message
/*     message.channel
      .send("✅ แก้ไขราคาไอเท็มสำเร็จ! โปรดใช้คำสั่ง `.shop` เพื่อตรวจสอบ")
      .then((msg) => {
        setTimeout(() => msg.delete(), 5000); // Delete the notification after 5 seconds
      }); */
  },
};

// Helper function to fetch shop item by ID
async function getShopItem(db, itemId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM items WHERE id = ?", [itemId], (err, row) => {
      if (err) {
        console.error("❌ Error fetching shop item:", err.message);
        reject(err);
      }
      resolve(row || null);
    });
  });
}

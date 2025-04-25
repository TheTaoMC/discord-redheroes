const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "addwall",
  description: "เพิ่มเงินหรือ Karma ให้กับผู้ใช้งาน (เฉพาะ Admin)",
  async execute(message, args, { client, db }) {
    // ตรวจสอบว่าผู้ใช้งานเป็น Admin หรือไม่
    if (!message.member.permissions.has("ADMINISTRATOR")) {
      return message.reply("❌ คุณไม่มีสิทธิ์ในการใช้คำสั่งนี้!");
    }

    // รับประเภทการเพิ่ม (b = Balance, k = Karma)
    const type = args[0]?.toLowerCase();
    if (!["b", "k"].includes(type)) {
      return message.reply(
        "❌ กรุณาระบุประเภทการเพิ่ม: `b` (Balance) หรือ `k` (Karma)"
      );
    }

    // รับ user_id และ amount จากข้อความ
    let targetUser;
    const userIdOrMention = args[1];

    // Check if the input is a mention or a user ID
    if (userIdOrMention.startsWith("<@") && userIdOrMention.endsWith(">")) {
      // Extract user ID from mention
      const userId = userIdOrMention.replace(/[<@!>]/g, "");
      targetUser = await client.users.fetch(userId).catch(() => null);
    } else {
      // Use the provided user ID directly
      targetUser = await client.users.fetch(userIdOrMention).catch(() => null);
    }

    if (!targetUser) {
      return message.reply("❌ ไม่พบผู้ใช้งานที่ระบุ!");
    }

    const amount = parseInt(args[2]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply("❌ กรุณาระบุจำนวนที่ถูกต้อง!");
    }

    // Fetch user data from the database
    const userId = targetUser.id;
    const userData = await getUserData(db, userId);

    try {
      // Update balance or karma based on type
      if (type === "b") {
        // Add to balance
        db.run("UPDATE users SET balance = balance + ? WHERE user_id = ?", [
          amount,
          userId,
        ]);

        // Send DM to the user
        await targetUser.send(
          `✅ ระบบได้โอนเงินจำนวน \`${amount}\` บาท เข้าสู่บัญชีของคุณแล้ว!`
        );

        // Notify in the channel
        message.reply(
          `✅ เพิ่มเงินจำนวน \`${amount}\` บาท ให้ <@${userId}> สำเร็จ!`
        );
      } else if (type === "k") {
        // Add to karma
        db.run("UPDATE users SET karma = karma + ? WHERE user_id = ?", [
          amount,
          userId,
        ]);

        // Send DM to the user
        await targetUser.send(
          `✅ ระบบได้เพิ่ม Karma จำนวน \`${amount}\` ให้กับคุณแล้ว!`
        );

        // Notify in the channel
        message.reply(
          `✅ เพิ่ม Karma จำนวน \`${amount}\` ให้ <@${userId}> สำเร็จ!`
        );
      }
    } catch (error) {
      console.error("❌ Error sending DM:", error.message);
      message.reply("❌ เกิดข้อผิดพลาดขณะส่งข้อความแจ้งเตือน!");
    }
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
      resolve(row || { balance: 0, karma: 0 });
    });
  });
}

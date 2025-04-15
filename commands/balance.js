const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "balance",
  description: "แสดงจำนวนเงิน, Karma และไอเท็มในกระเป๋าของคุณใน DM",
  async execute(message, args, { client, db }) {
    const userId = message.author.id;

    // Fetch user data from the database
    db.get(
      "SELECT balance, karma FROM users WHERE user_id = ?",
      [userId],
      async (err, row) => {
        if (err) {
          console.error("❌ Error fetching user data:", err.message);
          return message.reply("❌ เกิดข้อผิดพลาดขณะดึงข้อมูล!");
        }

        // If user data doesn't exist, create a new record
        if (!row) {
          db.run(
            "INSERT INTO users (user_id, username, balance, karma) VALUES (?, ?, 0, 0)",
            [userId, message.author.username],
            (err) => {
              if (err) {
                console.error("❌ Error creating user data:", err.message);
                return message.reply("❌ เกิดข้อผิดพลาดขณะสร้างข้อมูลผู้ใช้!");
              }
            }
          );

          // Send initial balance and karma
          message.author.send(
            `📝 ข้อมูลของคุณ:\n💰 เงิน: \`0 บาท\`\n✨ Karma: \`0\`\n📦 ไอเท็ม: ไม่มี`
          );
        } else {
          // Fetch items with auto_use = Y (Offensive and Defensive)
          const activeItems = await getUserActiveItems(db, userId);

          // Build the embed for displaying balance, karma, and active items
          const embed = new EmbedBuilder()
            .setTitle("📝 ข้อมูลของคุณ")
            .setDescription("รายละเอียดยอดเงิน, Karma และไอเท็มที่พร้อมใช้งาน")
            .addFields(
              {
                name: "💰 เงิน",
                value: `\`${row.balance} บาท\``,
                inline: true,
              },
              {
                name: "✨ Karma",
                value: `\`${row.karma}\``,
                inline: true,
              },
              {
                name: "📦 ไอเท็มที่พร้อมใช้งาน (auto_use = Y)",
                value:
                  activeItems.length > 0
                    ? activeItems
                        .map(
                          (item) =>
                            `- \`${item.name}\` (${item.type}) x${item.quantity}`
                        )
                        .join("\n")
                    : "ไม่มีไอเท็มที่พร้อมใช้งาน",
                inline: false,
              }
            )
            .setColor("#FFD700") // Gold color
            .setTimestamp();

          // Send the embed in DM
          message.author.send({ embeds: [embed] });
        }

        // React with ✅ to the original message
        message.react("✅").catch((err) => {
          console.error("❌ Error reacting to message:", err.message);
        });
      }
    );
  },
};

// Helper function to fetch active items (auto_use = Y)
async function getUserActiveItems(db, userId) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT i.*, ui.quantity
      FROM user_inventory ui
      JOIN items i ON ui.item_id = i.id
      WHERE ui.user_id = ? AND i.auto_use = 'Y' AND (i.type = 'offensive' OR i.type = 'defensive')
    `,
      [userId],
      (err, rows) => {
        if (err) {
          console.error("❌ Error fetching active items:", err.message);
          reject(err);
        }
        resolve(rows || []);
      }
    );
  });
}

const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "balance",
  description: "แสดงจำนวนเงิน, Karma และไอเท็มในกระเป๋าของคุณใน DM",
  async execute(message, args, { client, db }) {
    const userId = message.author.id;
    let replyMessage = null;

    try {
      // Send initial "กำลังตรวจสอบ..." message and store reference
      replyMessage = await message.channel.send("💭 กำลังตรวจสอบข้อมูล...");

      // Fetch user data from the database
      db.get(
        "SELECT balance, karma FROM users WHERE user_id = ?",
        [userId],
        async (err, row) => {
          if (err) {
            console.error("❌ Error fetching user data:", err.message);
            if (replyMessage) {
              await replyMessage.edit("❌ เกิดข้อผิดพลาดขณะดึงข้อมูล!");
            }
            return;
          }

          // If user data doesn't exist, create a new record
          if (!row) {
            db.run(
              "INSERT INTO users (user_id, username, balance, karma) VALUES (?, ?, 0, 0)",
              [userId, message.author.username],
              (err) => {
                if (err) {
                  console.error("❌ Error creating user data:", err.message);
                  if (replyMessage) {
                    replyMessage.edit("❌ เกิดข้อผิดพลาดขณะสร้างข้อมูลผู้ใช้!");
                  }
                  return;
                }
              }
            );

            // Send initial balance and karma
            try {
              await message.author.send(
                `📝 ข้อมูลของคุณ:\n💰 เงิน: \`0 บาท\`\n✨ Karma: \`0\`\n📦 ไอเท็ม: ไม่มี`
              );
              if (replyMessage) {
                await replyMessage.edit("✅ ส่งข้อมูลไปยัง DM แล้ว!");
              }
            } catch (dmError) {
              console.error("❌ Error sending DM:", dmError.message);
              if (replyMessage) {
                await replyMessage.edit(
                  "❌ ไม่สามารถส่ง DM ได้ กรุณาเปิดการรับ DM ก่อน!"
                );
              }
            }
          } else {
            // Fetch items with auto_use = Y (Offensive and Defensive)
            const activeItems = await getUserActiveItems(db, userId);

            // Build the embed for displaying balance, karma, and active items
            const embed = new EmbedBuilder()
              .setTitle("📝 ข้อมูลของคุณ")
              .setDescription(
                "รายละเอียดยอดเงิน, Karma และไอเท็มที่พร้อมใช้งาน"
              )
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

            try {
              // Send DM with embed
              await message.author.send({ embeds: [embed] });

              // Update the reply message instead of reacting
              if (replyMessage) {
                await replyMessage.edit("✅ ส่งข้อมูลไปยัง DM แล้ว!");
              }
            } catch (dmError) {
              console.error("❌ Error sending DM:", dmError.message);
              if (replyMessage) {
                await replyMessage.edit(
                  "❌ ไม่สามารถส่ง DM ได้ กรุณาเปิดการรับ DM ก่อน!"
                );
              }
            }
          }
        }
      );
    } catch (error) {
      console.error("❌ Error in balance command:", error);
      if (replyMessage) {
        await replyMessage.edit("❌ เกิดข้อผิดพลาดในการทำงาน!");
      }
    }
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

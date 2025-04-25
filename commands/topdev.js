const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "topdev",
  description: "แสดงรายชื่อผู้มีเงินและ Karma สูงสุด 3 อันดับแรก",
  async execute(message, args, { client, db }) {
    // Fetch top 3 users by balance
    db.all(
      "SELECT user_id, username, balance FROM users ORDER BY balance DESC LIMIT 3",
      [],
      async (err, balanceRows) => {
        if (err) {
          console.error("❌ Error fetching top balance users:", err.message);
          return message.reply("❌ เกิดข้อผิดพลาดขณะดึงข้อมูล!");
        }

        // Get Discord user info for balance rows
        for (const row of balanceRows) {
          try {
            const user = await client.users.fetch(row.user_id);
            row.nickname =
              message.guild.members.cache.get(row.user_id)?.nickname ||
              "ไม่มีชื่อในเซิร์ฟเวอร์";
            row.displayName = user.displayName || "ไม่มีชื่อที่แสดง";
            row.globalName = user.globalName || "ไม่มีชื่อสากล";
            row.username = user.username || "ไม่มี username";
            row.tag = user.tag || "ไม่มีแท็ก";
          } catch (error) {
            console.error(`Error fetching user ${row.user_id}:`, error);
            row.displayName = row.username;
          }
        }

        // Fetch top 3 users by karma
        db.all(
          "SELECT user_id, username, karma FROM users ORDER BY karma DESC LIMIT 3",
          [],
          async (err, karmaRows) => {
            if (err) {
              console.error("❌ Error fetching top karma users:", err.message);
              return message.reply("❌ เกิดข้อผิดพลาดขณะดึงข้อมูล!");
            }

            // Get Discord user info for karma rows
            for (const row of karmaRows) {
              try {
                const user = await client.users.fetch(row.user_id);
                row.nickname =
                  message.guild.members.cache.get(row.user_id)?.nickname ||
                  "ไม่มีชื่อในเซิร์ฟเวอร์";
                row.displayName = user.displayName || "ไม่มีชื่อที่แสดง";
                row.globalName = user.globalName || "ไม่มีชื่อสากล";
                row.username = user.username || "ไม่มี username";
                row.tag = user.tag || "ไม่มีแท็ก";
              } catch (error) {
                console.error(`Error fetching user ${row.user_id}:`, error);
                row.displayName = row.username;
              }
            }

            // Build the embed for displaying top users
            const embed = new EmbedBuilder()
              .setTitle("🏆 อันดับคนดี และ รวยมาก")
              .setDescription("รายชื่อผู้มีเงินและ Karma สูงสุด 3 อันดับแรก")
              .addFields(
                {
                  name: "💰 อันดับผู้มีเงินสูงสุด",
                  value:
                    balanceRows.length > 0
                      ? balanceRows
                          .map(
                            (row, index) =>
                              `#${index + 1}\n` +
                              `👤 ชื่อในเซิร์ฟเวอร์: ${row.nickname}\n` +
                              `📝 ชื่อที่แสดง: ${row.displayName}\n` +
                              `🌐 ชื่อสากล: ${row.globalName}\n` +
                              `🏷️ Username: ${row.username}\n` +
                              `🔖 แท็ก: ${row.tag}\n` +
                              `💵 เงิน: ${row.balance.toLocaleString()} บาท`
                          )
                          .join("\n\n")
                      : "ไม่มีข้อมูลผู้ใช้งาน",
                  inline: false,
                },
                {
                  name: "✨ อันดับผู้มี Karma สูงสุด",
                  value:
                    karmaRows.length > 0
                      ? karmaRows
                          .map(
                            (row, index) =>
                              `#${index + 1}\n` +
                              `👤 ชื่อในเซิร์ฟเวอร์: ${row.nickname}\n` +
                              `📝 ชื่อที่แสดง: ${row.displayName}\n` +
                              `🌐 ชื่อสากล: ${row.globalName}\n` +
                              `🏷️ Username: ${row.username}\n` +
                              `🔖 แท็ก: ${row.tag}\n` +
                              `🌟 Karma: ${row.karma}`
                          )
                          .join("\n\n")
                      : "ไม่มีข้อมูลผู้ใช้งาน",
                  inline: false,
                }
              )
              .setColor("#FFD700")
              .setTimestamp();

            message.channel.send({ embeds: [embed] });
          }
        );
      }
    );
  },
};

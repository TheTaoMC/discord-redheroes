const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "top",
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

        // Fetch user data for balance rows
        for (const row of balanceRows) {
          try {
            const user = await client.users.fetch(row.user_id);
            row.displayName = user.globalName || user.username;
          } catch (error) {
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

            // Fetch user data for karma rows
            for (const row of karmaRows) {
              try {
                const user = await client.users.fetch(row.user_id);
                row.displayName = user.globalName || user.username;
              } catch (error) {
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
                            (row, index) => `#${index + 1} ${row.displayName}`
                          )
                          .join("\n")
                      : "ไม่มีข้อมูลผู้ใช้งาน",
                  inline: false,
                },
                {
                  name: "✨ อันดับผู้มี Karma สูงสุด",
                  value:
                    karmaRows.length > 0
                      ? karmaRows
                          .map(
                            (row, index) => `#${index + 1} ${row.displayName}`
                          )
                          .join("\n")
                      : "ไม่มีข้อมูลผู้ใช้งาน",
                  inline: false,
                }
              )
              .setColor("#FFD700")
              .setTimestamp();

            // Send the embed message
            message.channel.send({ embeds: [embed] });
          }
        );
      }
    );
  },
};

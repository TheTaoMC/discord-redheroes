const cron = require("node-cron");
const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "moneyEvent",
  description: "Event สุ่มเงินหายและแจกเงินพร้อมเรื่องราว",

  // Function to start the cron job
  start(client, db) {
    // Schedule the money event to run every hour using node-cron
    cron.schedule("0 * * * *", async () => {
      console.log("⏰ Running money event...");
      await this.execute(client, db);
    });
  },

  // Main execution function for the event
  async execute(client, db) {
    // Get the room from the database
    const room = await getRoom(db);
    if (!room) {
      console.log("❌ ไม่พบห้องสำหรับแจ้ง Event!");
      return;
    }

    const channel = client.channels.cache.get(room.room_id); // Get the channel by room_id
    if (!channel) {
      console.log(
        `❌ ไม่พบแชแนลสำหรับห้อง ${room.room_name} (${room.room_id})!`
      );
      return;
    }

    // Get the top 3 users with the highest balance
    const topUsers = await getTopUsers(db, 3);
    if (topUsers.length === 0) {
      console.log("❌ ไม่มีผู้ใช้งานเพียงพอสำหรับ Event สุ่มเงิน!");
      return;
    }

    // Randomly select one user from the top 3
    const randomIndex = Math.floor(Math.random() * topUsers.length);
    const selectedUser = topUsers[randomIndex];

    // Calculate money loss (1-30% of balance)
    const percentageLoss = Math.floor(Math.random() * 2) + 1; // 1-30%
    const moneyLost = Math.floor((selectedUser.balance * percentageLoss) / 100);

    if (moneyLost <= 0) {
      console.log(
        `❌ เงินที่หายของผู้ใช้งาน ${selectedUser.user_id} น้อยเกินไป!`
      );
      return;
    }

    // Notify the first message in the channel
    const embed1 = new EmbedBuilder()
      .setTitle("🚨 เกิดเหตุการณ์!")
      .setDescription(
        `<@${selectedUser.user_id}> ได้แจ้งตำรวจว่าทำเงินจำนวน \`${moneyLost}\` บาท หาย...`
      )
      .setColor("#FF4500")
      .setImage("https://media.giphy.com/media/eiGVH5B6QtRbWKyZy4/giphy.gif") // Add direct GIF URL here
      .setTimestamp();

    channel.send({ embeds: [embed1] });

    // Deduct money from the selected user
    db.run("UPDATE users SET balance = balance - ? WHERE user_id = ?", [
      moneyLost,
      selectedUser.user_id,
    ]);

    // Get other users (rank 4 and below)
    const otherUsers = await getOtherUsers(
      db,
      topUsers.map((user) => user.user_id)
    );
    if (otherUsers.length === 0) {
      console.log("❌ ไม่มีผู้ใช้งานอื่นที่สามารถรับเงินได้!");
      return;
    }

    // Randomly select one user to receive the lost money
    const randomRecipientIndex = Math.floor(Math.random() * otherUsers.length);
    const recipientUser = otherUsers[randomRecipientIndex];

    // Add money to the recipient's balance
    db.run("UPDATE users SET balance = balance + ? WHERE user_id = ?", [
      moneyLost,
      recipientUser.user_id,
    ]);

    // Notify the second message in the channel
    const embed2 = new EmbedBuilder()
      .setTitle("🍜 เจอเงิน!")
      .setDescription(
        `???: "กำลังหิวข้าวพอดีเลย เงินใครก็ไม่รู้ \`${moneyLost}\` บาท สบายเลยวันนี้!"\n\n*เงินมาจากไหนกันนะ?*`
      )
      .setColor("#32CD32")
      .setImage(
        "https://giphy.com/gifs/MindblowonUniverse-mindblown-mindblowon-mindblowonuniverse-Ip6U2lm8FeSs4zPht3/giphy.gif"
      ) // Add direct GIF URL here
      .setTimestamp();

    channel.send({ embeds: [embed2] });
  },
};

// Helper function to fetch the room from the database
async function getRoom(db) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM rooms LIMIT 1", [], (err, row) => {
      if (err) {
        console.error("❌ Error fetching room:", err.message);
        reject(err);
      }
      resolve(row || null);
    });
  });
}

// Helper function to fetch top users by balance
async function getTopUsers(db, limit) {
  return new Promise((resolve, reject) => {
    db.all(
      "SELECT * FROM users ORDER BY balance DESC LIMIT ?",
      [limit],
      (err, rows) => {
        if (err) {
          console.error("❌ Error fetching top users:", err.message);
          reject(err);
        }
        resolve(rows || []);
      }
    );
  });
}

// Helper function to fetch other users (excluding top users)
async function getOtherUsers(db, excludedUserIds) {
  return new Promise((resolve, reject) => {
    const placeholders = excludedUserIds.map(() => "?").join(",");
    const query = `SELECT * FROM users WHERE user_id NOT IN (${placeholders}) AND balance > 0`;
    db.all(query, excludedUserIds, (err, rows) => {
      if (err) {
        console.error("❌ Error fetching other users:", err.message);
        reject(err);
      }
      resolve(rows || []);
    });
  });
}

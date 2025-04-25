const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "daily",
  description: "รับรางวัลประจำวันพร้อมโอกาสสุ่มรางวัล",
  async execute(message, args, { client, db }) {
    const userId = message.author.id;

    // Ensure user data exists in the database
    await ensureUserData(db, userId);

    // Fetch user data from the database
    const userRow = await getUserData(db, userId);

    // Calculate cooldown (1 hour = 3600000 milliseconds)
    const now = Date.now();
    const lastDaily = userRow.last_daily || 0;
    const timeLeft = 3600000 - (now - lastDaily);

    if (timeLeft > 0) {
      const minutes = Math.ceil(timeLeft / 60000);
      return message.reply(
        `❌ คุณต้องรออีก ${minutes} นาที ก่อนรับรางวัลอีกครั้ง`
      );
    }

    // Randomize reward based on probability
    const reward = getRandomReward();

    // Award daily reward
    db.run(
      "UPDATE users SET balance = balance + ?, last_daily = ? WHERE user_id = ?",
      [reward, now, userId]
    );

    // Notify the result
    const embed = new EmbedBuilder()
      .setTitle("🎁 รางวัลประชั่วโมง")
      .setDescription(`🎉 คุณได้รับรางวัลจำนวน \`${reward}\` บาท!`)
      .setColor("#FFD700")
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};

// Helper function to ensure user data exists in the database
async function ensureUserData(db, userId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, row) => {
      if (err) {
        console.error("❌ Error fetching user data:", err.message);
        return reject(err);
      }

      if (!row) {
        db.run(
          "INSERT INTO users (user_id, username, balance, karma, last_daily) VALUES (?, ?, ?, ?, ?)",
          [userId, "Unknown", 0, 0, 0],
          (insertErr) => {
            if (insertErr) {
              console.error("❌ Error inserting user data:", insertErr.message);
              return reject(insertErr);
            }
            resolve();
          }
        );
      } else {
        resolve();
      }
    });
  });
}

// Helper function to fetch user data
async function getUserData(db, userId) {
  return new Promise((resolve, reject) => {
    db.get("SELECT * FROM users WHERE user_id = ?", [userId], (err, row) => {
      if (err) {
        console.error("❌ Error fetching user data:", err.message);
        reject(err);
      }
      resolve(row || { balance: 0, karma: 0, last_daily: 0 });
    });
  });
}

// Helper function to randomize reward based on probability
function getRandomReward() {
  const random = Math.random(); // Generate a random number between 0 and 1

  if (random < 0.8) {
    return Math.floor(Math.random() * 50) + 1; // 1-50 (80% chance)
  } else if (random < 0.9) {
    return Math.floor(Math.random() * 50) + 51; // 51-100 (10% chance)
  } else if (random < 0.95) {
    return Math.floor(Math.random() * 50) + 101; // 101-150 (5% chance)
  } else if (random < 0.98) {
    return Math.floor(Math.random() * 50) + 151; // 151-200 (3% chance)
  } else if (random < 0.99) {
    return Math.floor(Math.random() * 50) + 201; // 201-250 (2% chance)
  } else {
    return Math.floor(Math.random() * 50) + 251; // 251-300 (1% chance)
  }
}

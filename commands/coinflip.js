const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "coinflip",
  description: "เล่นเกมหัวก้อย (Heads or Tails)",
  async execute(message, args, { client, db }) {
    const userId = message.author.id;

    // Validate the bet choice
    const betChoice = args[0]?.toLowerCase();
    if (!["h", "t"].includes(betChoice)) {
      return message.reply("❌ กรุณาเลือก 'h' (หัว) หรือ 't' (ก้อย)");
    }

    // Validate the amount
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply(
        "❌ กรุณาใส่จำนวนเงินที่ถูกต้อง (จำนวนเต็มมากกว่า 0)"
      );
    }

    // Ensure user data exists in the database
    await ensureUserData(db, userId);

    // Fetch user data from the database
    const userRow = await getUserData(db, userId);

    // Check if the sender has enough balance
    if (userRow.balance < amount) {
      return message.reply("❌ คุณมีเงินไม่เพียงพอสำหรับการเดิมพัน!");
    }

    // Randomly generate the result
    const outcomes = ["h", "t"];
    const result = outcomes[Math.floor(Math.random() * outcomes.length)];

    let newBalance;
    if (betChoice === result) {
      // Win
      newBalance = userRow.balance + amount;
      db.run("UPDATE users SET balance = balance + ? WHERE user_id = ?", [
        amount,
        userId,
      ]);
    } else {
      // Lose
      newBalance = userRow.balance - amount;
      db.run("UPDATE users SET balance = balance - ? WHERE user_id = ?", [
        amount,
        userId,
      ]);
    }

    // Deduct karma (-1 for playing)
    db.run("UPDATE users SET karma = karma - 1 WHERE user_id = ?", [userId]);

    // Notify the result
    const embed = new EmbedBuilder()
      .setTitle("🎲 เกมหัวก้อย")
      .setDescription(`ผลลัพธ์: \`${result === "h" ? "หัว" : "ก้อย"}\``)
      .addFields(
        {
          name: "การเดิมพันของคุณ",
          value: `\`${betChoice === "h" ? "หัว" : "ก้อย"} (${amount} บาท)\``,
          inline: true,
        },
        {
          name: "ผลลัพธ์",
          value: betChoice === result ? "🎉 คุณชนะ!" : "❌ คุณแพ้!",
          inline: true,
        },
        {
          name: "คะแนน Karma",
          value: `ลดลง \`-1\` (ปัจจุบัน: ${userRow.karma - 1})`,
          inline: false,
        }
      )
      .setColor(betChoice === result ? "#2ECC71" : "#E74C3C")
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
          "INSERT INTO users (user_id, username, balance, karma) VALUES (?, ?, ?, ?)",
          [userId, "Unknown", 0, 0],
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
      resolve(row || { balance: 0, karma: 0 });
    });
  });
}

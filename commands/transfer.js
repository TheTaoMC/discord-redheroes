const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "transfer",
  description: "โอนเงินให้ผู้เล่นอื่น",
  async execute(message, args, { client, db }) {
    const userId = message.author.id;
    const targetUser = message.mentions.users.first();

    // Check if a user is mentioned
    if (!targetUser) {
      return message.reply("❌ กรุณาแท็กผู้ใช้งานที่คุณต้องการโอนเงิน!");
    }

    const targetUserId = targetUser.id;

    // Prevent transferring to yourself
    if (userId === targetUserId) {
      return message.reply("❌ คุณไม่สามารถโอนเงินให้ตัวเองได้!");
    }

    // Validate the amount
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) {
      return message.reply(
        "❌ กรุณาใส่จำนวนเงินที่ถูกต้อง (จำนวนเต็มมากกว่า 0)"
      );
    }

    // Ensure both users exist in the database
    await ensureUserData(db, userId);
    await ensureUserData(db, targetUserId);

    // Fetch user data from the database
    const userRow = await getUserData(db, userId);
    const targetRow = await getUserData(db, targetUserId);

    // Check if the sender has enough balance
    if (userRow.balance < amount) {
      return message.reply("❌ คุณมีเงินไม่เพียงพอสำหรับการโอน!");
    }

    // Perform the transfer
    db.run("UPDATE users SET balance = balance - ? WHERE user_id = ?", [
      amount,
      userId,
    ]);
    db.run("UPDATE users SET balance = balance + ? WHERE user_id = ?", [
      amount,
      targetUserId,
    ]);

    // Notify via DM
    try {
      const sender = await client.users.fetch(userId);
      const receiver = await client.users.fetch(targetUserId);

      // Send DM to the sender
      sender.send(
        `💸 คุณได้โอนเงินจำนวน \`${amount}\` บาท ให้กับ ${receiver.username}`
      );

      // Send DM to the receiver
      receiver.send(
        `💸 ${sender.username} ได้โอนเงินจำนวน \`${amount}\` บาท ให้คุณ`
      );
    } catch (error) {
      console.error("❌ Error sending DM:", error.message);
    }

    // Notify in the channel
    const embed = new EmbedBuilder()
      .setTitle("💸 การโอนเงินสำเร็จ!")
      .setDescription(
        `คุณได้โอนเงินจำนวน \`${amount}\` บาท ให้กับ ${targetUser.username}`
      )
      .addFields(
        {
          name: "ยอดเงินคงเหลือของคุณ",
          value: `\`${userRow.balance - amount}\` บาท`,
          inline: true,
        },
        {
          name: "ยอดเงินของผู้รับ",
          value: `\`${targetRow.balance + amount}\` บาท`,
          inline: true,
        }
      )
      .setColor("#2ECC71")
      .setTimestamp();

    // Delete the original command message
    try {
      await message.delete(); // Delete the input message
    } catch (error) {
      console.error("❌ Error deleting the input message:", error.message);
    }

    // Send the result as an embed
    //message.channel.send({ embeds: [embed] });
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
        // Insert default user data if not exists
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

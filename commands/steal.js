const { EmbedBuilder } = require("discord.js");
const path = require("path");

module.exports = {
  name: "steal",
  description: "ขโมยเงินจากผู้ใช้งานคนอื่น",
  async execute(message, args, { client, db }) {
    const userId = message.author.id;
    const targetUser = message.mentions.users.first();

    // Check if a user is mentioned
    if (!targetUser) {
      return message.reply("❌ กรุณาแท็กผู้ใช้งานที่คุณต้องการขโมย!");
    }

    const targetUserId = targetUser.id;

    // Prevent stealing from yourself
    if (userId === targetUserId) {
      return message.reply("❌ คุณไม่สามารถขโมยจากตัวเองได้!");
    }

    // Fetch user data from the database
    const userRow = await getUserData(db, userId);
    const targetRow = await getUserData(db, targetUserId);

    // Check daily steal limit
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
    const dailyStealKey = `daily_steal_${userId}_${today}`;
    const dailyStealCount = await getDailyStealCount(db, dailyStealKey);

    if (dailyStealCount >= 10) {
      return message.reply("❌ คุณขโมยครบ 5 ครั้งแล้ววันนี้!");
    }

    // Apply offensive item effects and deduct items
    let stealChance = 0.5; // Base chance to steal
    let stealMultiplier = 1; // Base multiplier
    const hasOffensiveEffect = await applyOffensiveEffectsAndDeduct(
      db,
      userId,
      message,
      {
        onBoostChance: (value) => (stealChance += value),
        onStealMultiplier: (value) => (stealMultiplier *= value),
      }
    );

    // Apply defensive item effects
    const hasDefensiveEffect = await applyItemEffectsAndDeduct(
      db,
      targetUserId,
      "defensive",
      message
    );
    if (hasDefensiveEffect) {
      return;
    }

    // Clamp steal chance between 0 and 1
    stealChance = Math.max(0, Math.min(1, stealChance));

    // Steal process
    const isSuccess = Math.random() < stealChance; // Chance to steal
    let stolenAmount = 0;

    if (isSuccess) {
      const maxSteal = Math.floor(targetRow.balance * 0.3); // Max 30% of target's balance
      stolenAmount = Math.floor(Math.random() * maxSteal) + 1; // Random 1-30%
      stolenAmount = Math.floor(stolenAmount * stealMultiplier); // Apply multiplier
      db.run("UPDATE users SET balance = balance + ? WHERE user_id = ?", [
        stolenAmount,
        userId,
      ]);
      db.run("UPDATE users SET balance = balance - ? WHERE user_id = ?", [
        stolenAmount,
        targetUserId,
      ]);
    }

    // Deduct karma for attempting to steal
    db.run("UPDATE users SET karma = karma - 5 WHERE user_id = ?", [userId]);

    // Update daily steal count
    updateDailyStealCount(db, dailyStealKey);

    // Notify the result
    const embed = new EmbedBuilder()
      .setTitle("💰 ผลการขโมย")
      .setDescription(isSuccess ? "🎉 คุณขโมยสำเร็จ!" : "❌ คุณขโมยไม่สำเร็จ!")
      .addFields(
        {
          name: "เป้าหมาย",
          value: `${targetUser.username}`,
          inline: true,
        },
        {
          name: "ผลลัพธ์",
          value: isSuccess
            ? `คุณขโมยได้ \`${stolenAmount}\` บาท`
            : "คุณไม่ได้อะไรเลย!",
          inline: true,
        },
        {
          name: "Karma",
          value: `คะแนน Karma ของคุณลดลง \`-5\``,
          inline: false,
        }
      )
      .setColor(isSuccess ? "#2ECC71" : "#E74C3C") // Green for success, Red for failure
      .setTimestamp();

    message.channel.send({ embeds: [embed] });
  },
};

// Helper function to apply offensive item effects and deduct items
async function applyOffensiveEffectsAndDeduct(
  db,
  userId,
  message,
  handlers = {}
) {
  const items = await getUserItems(db, userId, "offensive");
  let hasEffect = false;

  for (const item of items) {
    if (item.auto_use === "Y" && item.effect_file && item.quantity > 0) {
      try {
        const effectPath = path.join(
          __dirname,
          `../utils/itemeffects/${item.effect_file}`
        );
        const effectModule = require(effectPath);

        // Execute the effect with parameters
        if (item.name_system === "boost_karma") {
          await effectModule.execute(userId, db); // Pass userId and db
          hasEffect = true;
        } else {
          await effectModule.execute(handlers); // For other effects
          hasEffect = true;
        }

        // Deduct the item from the user's inventory (always deduct offensive items)
        db.run(
          "UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0",
          [userId, item.id],
          (err) => {
            if (err) {
              console.error("❌ Error deducting item:", err.message);
            }
          }
        );

        // Notify the user about the effect
        //message.reply(`⚠️ ${message.author.username} ใช้ไอเท็ม \`${item.name}\` และหักออกจากกระเป๋าแล้ว`);
      } catch (err) {
        console.error(
          `❌ Error loading effect for item ${item.name}:`,
          err.message
        );
      }
    } else if (item.quantity <= 0) {
      // Notify if the item is out of stock
      //message.reply(`❌ ${message.author.username} ไม่มีไอเท็ม \`${item.name}\` เหลือแล้ว!`);
    }
  }

  return hasEffect;
}

// Helper function to apply defensive item effects and deduct items
async function applyItemEffectsAndDeduct(
  db,
  userId,
  type,
  message,
  handlers = {}
) {
  const items = await getUserItems(db, userId, type);
  let hasEffect = false;

  for (const item of items) {
    if (item.auto_use === "Y" && item.effect_file && item.quantity > 0) {
      try {
        const effectPath = path.join(
          __dirname,
          `../utils/itemeffects/${item.effect_file}`
        );
        const effectModule = require(effectPath);

        // Execute the effect with parameters
        if (item.name_system === "boost_karma") {
          await effectModule.execute(userId, db); // Pass userId and db
          hasEffect = true;
        } else {
          await effectModule.execute(handlers); // For other effects
          hasEffect = true;
        }

        // Deduct the item from the user's inventory
        db.run(
          "UPDATE user_inventory SET quantity = quantity - 1 WHERE user_id = ? AND item_id = ? AND quantity > 0",
          [userId, item.id],
          (err) => {
            if (err) {
              console.error("❌ Error deducting item:", err.message);
            }
          }
        );

        // Notify the user about the effect
        if (type === "defensive") {
          //message.reply(`🔒 ${message.author.username} มีไอเท็มป้องกันการขโมย!`);
          message.reply(`🔒 กระเป๋าล็อค !!!`);
        }
      } catch (err) {
        console.error(
          `❌ Error loading effect for item ${item.name}:`,
          err.message
        );
      }
    } else if (item.quantity <= 0) {
      // Notify if the item is out of stock
      if (type === "defensive") {
        //message.reply(`❌ ${message.author.username} ไม่มีไอเท็มป้องกันการขโมยเหลือแล้ว!`);
      }
    }
  }

  return hasEffect;
}

// Helper functions
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

async function getUserItems(db, userId, type) {
  return new Promise((resolve, reject) => {
    db.all(
      `
      SELECT i.*, ui.quantity
      FROM user_inventory ui
      JOIN items i ON ui.item_id = i.id
      WHERE ui.user_id = ? AND i.type = ? AND i.auto_use = 'Y'
    `,
      [userId, type],
      (err, rows) => {
        if (err) {
          console.error("❌ Error fetching user items:", err.message);
          reject(err);
        }
        resolve(rows || []);
      }
    );
  });
}

function getDailyStealCount(db, key) {
  return new Promise((resolve, reject) => {
    db.get("SELECT value FROM daily_steal WHERE key = ?", [key], (err, row) => {
      if (err) {
        console.error("❌ Error fetching daily steal count:", err.message);
        reject(err);
      }
      resolve(row ? parseInt(row.value) : 0);
    });
  });
}

function updateDailyStealCount(db, key) {
  db.run(
    "INSERT OR REPLACE INTO daily_steal (key, value) VALUES (?, COALESCE((SELECT value FROM daily_steal WHERE key = ?), 0) + 1)",
    [key, key],
    (err) => {
      if (err) {
        console.error("❌ Error updating daily steal count:", err.message);
      }
    }
  );
}

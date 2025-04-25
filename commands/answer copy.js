const { EmbedBuilder } = require("discord.js");

module.exports = {
  name: "answer",
  description: "ตอบคำถามจากงานในห้อง",
  async execute(message, args, { client, db }) {
    const roomId = message.channel.id;
    const userId = message.author.id;
    const userAnswer = args.join(" ").trim().toLowerCase();

    // Check if there's an active work task in this room
    const workTask = await getWorkTask(db, roomId);
    if (!workTask) {
      return message.reply("❌ ไม่มีงานที่ต้องตอบในห้องนี้!");
    }

    const now = Date.now();
    if (now > workTask.expires_at) {
      db.run("DELETE FROM work_tasks WHERE room_id = ?", [roomId]);
      return message.reply(
        "❌ งานในห้องนี้หมดอายุแล้ว! กรุณาเริ่มงานใหม่ด้วย `!work`"
      );
    }

    // Fetch user data from the database
    const userRow = await getUserData(db, userId);

    // Check Karma penalties
    const karma = userRow.karma || 0;
    let isCorrect = false;
    let reward = 0;

    /*     if (karma < -25) {
      return message.reply(
        "❌ คุณมี Karma ต่ำเกินไป! ไม่สามารถตอบคำถามได้ https://giphy.com/gifs/checklistviajes-7KPLXKFIcgaIC6C4FK"
      );
    } */

    const correctAnswer = workTask.answer.toLowerCase();
    const answerMatch = userAnswer === correctAnswer;

    if (karma < -20) {
      // Always correct but no reward, 80% chance to lose 30% of balance
      isCorrect = true;
      if (Math.random() < 0.8) {
        const penalty = Math.floor(userRow.balance * 0.3);
        db.run("UPDATE users SET balance = balance - ? WHERE user_id = ?", [
          penalty,
          userId,
        ]);
        return message.reply(
          `❌ คุณเสียเงิน \`30%\` (${penalty} บาท) จากการตอบคำถาม https://giphy.com/gifs/cartoon-evil-tom-and-jerry-lZc51u0xLpPlm`
        );
      }
    } else if (karma < -15) {
      // 90% chance to be correct but no reward, 50% chance to lose 20% of balance
      isCorrect = Math.random() < 0.9;
      if (isCorrect && Math.random() < 0.5) {
        const penalty = Math.floor(userRow.balance * 0.2);
        db.run("UPDATE users SET balance = balance - ? WHERE user_id = ?", [
          penalty,
          userId,
        ]);
        return message.reply(
          `❌ คุณเสียเงิน \`20%\` (${penalty} บาท) จากการตอบคำถาม https://giphy.com/gifs/bad-6BZaFXBVPBtok`
        );
      }
    } else if (karma < -10) {
      // 90% chance to be correct but no reward
      isCorrect = Math.random() < 0.9;
    } else if (karma < -5) {
      // 70% chance to be correct but no reward
      isCorrect = Math.random() < 0.7;
    } else if (karma < 0) {
      // 50% chance to be correct but no reward
      isCorrect = Math.random() < 0.5;
    } else {
      // Normal behavior
      isCorrect = answerMatch;
    }

    if (!isCorrect) {
      return message.reply(
        "❌ คำตอบไม่ถูกต้อง! กรุณาลองใหม่อีกครั้ง https://giphy.com/gifs/sunnyfxx-always-sunny-iasip-its-Atc9QCyWLGHgLZhHDp"
      );
    }

    // Calculate reward only if karma >= 0
    if (karma >= 0) {
      reward = calculateReward();

      // Apply bonus based on Karma
      if (karma > 10 && Math.random() < 0.3) {
        reward *= 2; // 30% chance for *2
      } else if (karma > 20 && Math.random() < 0.3) {
        reward *= 2; // 30% chance for *2
      } else if (karma > 30 && Math.random() < 0.3) {
        reward *= 2; // 30% chance for *2
      } else if (karma > 40 && Math.random() < 0.4) {
        reward *= 2; // 40% chance for *2
      } else if (karma > 50 && Math.random() < 0.5) {
        reward *= 2; // 50% chance for *2
      } else if (karma > 60 && Math.random() < 0.6) {
        reward *= 2; // 60% chance for *2
      } else if (karma > 70 && Math.random() < 0.7) {
        reward *= Math.random() < 0.6 ? 3 : 2; // 70% for *2 or 60% for *3
      } else if (karma > 80 && Math.random() < 0.7) {
        reward *= Math.random() < 0.6 ? 3 : 2; // 70% for *2 or 60% for *3
      } else if (karma > 90 && Math.random() < 0.7) {
        reward *= Math.random() < 0.6 ? 3 : 2; // 70% for *2 or 60% for *3
      }

      db.run(
        "UPDATE users SET balance = balance + ?, karma = karma + 1 WHERE user_id = ?",
        [reward, userId]
      );
    }

    // Notify the result
    let rewardMessage = "";
    if (karma >= 0) {
      rewardMessage = `🎉 ยินดีด้วย! ${message.author.username} ตอบถูกและได้รับ ${reward} บาท`;
      if (reward >= 80) {
        rewardMessage +=
          "\n🎉 รางวัลใหญ่! 🎉 https://giphy.com/gifs/the-young-pope-candidimg18521-fDbzXb6Cv5L56"; // Add GIF URL here
      }
    } else {
      rewardMessage = `⚠️ ${message.author.username} ตอบถูก แต่ไม่ได้รับรางวัลเนื่องจาก Karma ต่ำ https://giphy.com/gifs/buschbeer-beer-d1E1msx7Yw5Ne1Fe`;
    }

    message.channel.send(rewardMessage);

    // Remove the task from the database
    db.run("DELETE FROM work_tasks WHERE room_id = ?", [roomId]);
  },
};

// Helper function to fetch work task
async function getWorkTask(db, roomId) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM work_tasks WHERE room_id = ?",
      [roomId],
      (err, row) => {
        if (err) {
          console.error("❌ Error fetching work task:", err.message);
          reject(err);
        }
        resolve(row || null);
      }
    );
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

// Function to calculate random rewards
function calculateReward() {
  const rand = Math.random();
  //if (rand < 0.8) return Math.floor(Math.random() * 10) + 1; // 1-10
  if (rand < 0.9) return Math.floor(Math.random() * 20) + 1; // 11-30
  if (rand < 0.95) return Math.floor(Math.random() * 20) + 31; // 31-50
  if (rand < 0.97) return Math.floor(Math.random() * 30) + 51; // 51-80
  if (rand < 0.99) return Math.floor(Math.random() * 20) + 81; // 81-100
  return Math.floor(Math.random() * 50) + 101; // 101-150
}

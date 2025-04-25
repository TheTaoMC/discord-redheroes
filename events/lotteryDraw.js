const cron = require("node-cron"); // Install with: npm install node-cron
const { ChannelType } = require("discord.js");

module.exports = (client, db) => {
  // Schedule the lottery draw at 16:00 every day
  cron.schedule("0 16 * * *", async () => {
    try {
      // Fetch all rooms from the database
      const rooms = await getRoomsFromDatabase(db);
      if (rooms.length === 0) {
        console.log("⚠️ No rooms found in the 'rooms' table. Skipping...");
        return;
      }

      // Get the current date
      const today = new Date().toISOString().split("T")[0];

      // Get all bets for today
      const bets = await getAllBetsForToday(db, today);

      // Get the current prize pool
      const prizePool = await getPrizePool(db);

      // Randomly generate a 2-digit number (00-99)
      const winningNumber = String(Math.floor(Math.random() * 100)).padStart(
        2,
        "0"
      );

      let winnerFound = false;

      // Check if any user has the winning number
      for (const bet of bets) {
        const userNumbers = bet.numbers.split(",");
        if (userNumbers.includes(winningNumber)) {
          // Award the prize to the winner
          db.run("UPDATE users SET balance = balance + ? WHERE user_id = ?", [
            prizePool,
            bet.user_id,
          ]);

          // Notify the winner
          const winner = await client.users.fetch(bet.user_id);
          winner.send(
            `🎉 ยินดีด้วย! คุณถูกรางวัลลอตเตอรี่หมายเลข \`${winningNumber}\` และได้รับเงินรางวัล \`${prizePool} บาท\``
          );

          // Reset the prize pool
          db.run("UPDATE lotto_prize SET prize = 200");
          winnerFound = true;
          break;
        }
      }

      // If no winner, increase the prize pool
      if (!winnerFound) {
        db.run("UPDATE lotto_prize SET prize = prize + 200");
      }

      // Notify in the specified rooms
      for (const room of rooms) {
        const roomId = room.room_id;

        // Get the channel object from Discord
        const channel = client.channels.cache.get(roomId);
        if (
          !channel ||
          channel.type !== ChannelType.GuildText ||
          !channel.viewable
        ) {
          console.log(
            `⚠️ Room ${room.room_name} (${roomId}) is not accessible. Skipping...`
          );
          continue;
        }

        // Send the lottery result to the room
        channel.send(
          `🎲 ผลการออกรางวัลลอตเตอรี่วันนี้: \`${winningNumber}\`\n${
            winnerFound
              ? "มีผู้ถูกรางวัล!"
              : "ไม่มีผู้ถูกรางวัล รางวัลสะสมเพิ่มขึ้น!"
          }`
        );
      }
    } catch (error) {
      console.error("❌ Error during lottery draw:", error.message);
    }
  });
};

// Helper function to fetch rooms from the database
async function getRoomsFromDatabase(db) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM rooms", [], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching rooms from database:", err.message);
        reject(err);
      }
      resolve(rows || []);
    });
  });
}

// Helper function to get all bets for today
async function getAllBetsForToday(db, date) {
  return new Promise((resolve, reject) => {
    db.all("SELECT * FROM lotto888 WHERE date = ?", [date], (err, rows) => {
      if (err) {
        console.error("❌ Error fetching bets for today:", err.message);
        reject(err);
      }
      resolve(rows || []);
    });
  });
}

// Helper function to get the current prize pool
async function getPrizePool(db) {
  return new Promise((resolve, reject) => {
    db.get("SELECT prize FROM lotto_prize LIMIT 1", [], (err, row) => {
      if (err) {
        console.error("❌ Error fetching prize pool:", err.message);
        reject(err);
      }
      resolve(row ? row.prize : 200); // Default to 200 if no prize pool exists
    });
  });
}

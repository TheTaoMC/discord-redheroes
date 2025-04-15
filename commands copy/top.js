const db = require("../db");

module.exports = {
  name: "top",
  execute(message) {
    try {
      // Fetch top users for balance
      const topBalanceUsers = db
        .prepare("SELECT user_id FROM wallets ORDER BY balance DESC LIMIT 10")
        .all();

      // Fetch top users for karma
      const topKarmaUsers = db
        .prepare("SELECT user_id FROM wallets ORDER BY karma DESC LIMIT 10")
        .all();

      // Helper function to format the leaderboard
      const formatLeaderboard = (users, title) => {
        if (users.length === 0) return `${title}\nยังไม่มีใครอยู่ในอันดับนี้!`;

        const lines = users.map((user, i) => {
          const member = message.guild.members.cache.get(user.user_id);
          const displayName = member
            ? member.nickname || member.user.username // Use nickname if available, otherwise use username
            : "ผู้ใช้งานที่ไม่พบ";
          return `#${i + 1} ${displayName}`;
        });

        return `${title}\n${lines.join("\n")}`;
      };

      // Format the balance leaderboard
      const balanceLeaderboard = formatLeaderboard(
        topBalanceUsers,
        "📊 อันดับผู้มีเงินมากที่สุด:"
      );

      // Format the karma leaderboard
      const karmaLeaderboard = formatLeaderboard(
        topKarmaUsers,
        "📊 อันดับผู้มี Karma มากที่สุด:"
      );

      // Send the combined leaderboard as a reply
      return message.reply(`${balanceLeaderboard}\n\n${karmaLeaderboard}`);
    } catch (error) {
      console.error("❌ Error fetching leaderboard:", error);
      return message.reply(
        "❌ เกิดข้อผิดพลาดขณะประมวลผลคำสั่ง กรุณาลองใหม่อีกครั้ง"
      );
    }
  },
};

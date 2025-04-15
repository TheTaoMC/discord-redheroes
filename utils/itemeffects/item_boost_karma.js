/*
karma boost +10 
+karma boost +10 ใน ตาราง users.karma
*/
module.exports = {
  execute(userId, db) {
    return new Promise((resolve, reject) => {
      // Update karma in the users table
      db.run(
        "UPDATE users SET karma = karma + 10 WHERE user_id = ?",
        [userId],
        (err) => {
          if (err) {
            console.error("❌ Error boosting karma:", err.message);
            return reject(err);
          }
          resolve();
        }
      );
    });
  },
};

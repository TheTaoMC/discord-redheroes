const db = require('../db');

function hasClaimedDaily(userId) {
  const today = new Date().toISOString().slice(0, 10);
  const row = db
    .prepare("SELECT last_claim_date FROM daily_reward WHERE user_id = ?")
    .get(userId);
  return row && row.last_claim_date === today;
}

function setClaimedDaily(userId) {
  const today = new Date().toISOString().slice(0, 10);
  db.prepare(
    "INSERT OR REPLACE INTO daily_reward (user_id, last_claim_date) VALUES (?, ?)"
  ).run(userId, today);
}

module.exports = {
  hasClaimedDaily,
  setClaimedDaily
};
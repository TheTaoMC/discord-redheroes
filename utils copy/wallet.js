const db = require("../db");

// Get the user's balance
function getBalance(userId) {
  try {
    const row = db
      .prepare("SELECT balance FROM wallets WHERE user_id = ?")
      .get(userId);
    return row ? row.balance : 0;
  } catch (error) {
    console.error(`❌ Error fetching balance for user "${userId}":`, error);
    return 0;
  }
}

// Get the user's karma
function getKarma(userId) {
  try {
    const row = db
      .prepare("SELECT karma FROM wallets WHERE user_id = ?")
      .get(userId);
    return row && typeof row.karma !== "undefined" ? row.karma : 50;
  } catch (error) {
    console.error(`❌ Error fetching karma for user "${userId}":`, error);
    return 50;
  }
}

// Add or subtract balance for a user
function addBalance(userId, amount) {
  try {
    // Fetch current data
    const current = getBalance(userId);
    const karma = getKarma(userId);

    // Update only the balance column
    db.prepare("UPDATE wallets SET balance = ? WHERE user_id = ?").run(
      current + amount,
      userId
    );

    // Insert new record if the user doesn't exist
    if (!db.prepare("SELECT 1 FROM wallets WHERE user_id = ?").get(userId)) {
      db.prepare(
        "INSERT INTO wallets (user_id, balance, karma) VALUES (?, ?, ?)"
      ).run(userId, current + amount, karma);
    }
  } catch (error) {
    console.error(`❌ Error updating balance for user "${userId}":`, error);
  }
}

// Update karma for a user
function updateKarma(userId, delta) {
  try {
    // Fetch current data
    const balance = getBalance(userId);
    const currentKarma = getKarma(userId);

    // Update only the karma column
    db.prepare("UPDATE wallets SET karma = ? WHERE user_id = ?").run(
      currentKarma + delta,
      userId
    );

    // Insert new record if the user doesn't exist
    if (!db.prepare("SELECT 1 FROM wallets WHERE user_id = ?").get(userId)) {
      db.prepare(
        "INSERT INTO wallets (user_id, balance, karma) VALUES (?, ?, ?)"
      ).run(userId, balance, currentKarma + delta);
    }
  } catch (error) {
    console.error(`❌ Error updating karma for user "${userId}":`, error);
  }
}

// Transfer balance between two users
function transferBalance(fromId, toId, amount) {
  try {
    // Validate amount
    if (amount <= 0) {
      console.error("❌ Invalid transfer amount:", amount);
      return false;
    }

    // Check sender's balance
    const fromBal = getBalance(fromId);
    if (fromBal < amount) {
      console.error(`❌ Insufficient balance for user "${fromId}"`);
      return false;
    }

    // Perform the transfer
    addBalance(fromId, -amount);
    addBalance(toId, amount);
    return true;
  } catch (error) {
    console.error(
      `❌ Error transferring balance from "${fromId}" to "${toId}":`,
      error
    );
    return false;
  }
}

// Add a log entry for the user
function addLog(userId, type, description) {
  try {
    db.prepare(
      "INSERT INTO logs (user_id, type, description, timestamp) VALUES (?, ?, ?, ?)"
    ).run(userId, type, description, Date.now());
  } catch (error) {
    console.error("❌ Error adding log:", error);
  }
}

module.exports = {
  getBalance,
  getKarma,
  addBalance,
  updateKarma,
  transferBalance,
  addLog,
};

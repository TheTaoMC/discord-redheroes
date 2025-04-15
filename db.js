const Database = require("better-sqlite3");
const db = new Database("wallets.db", { verbose: console.log });

// Initialize the database schema
function initializeDatabase() {
  try {
    // Create wallets table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS wallets (
        user_id TEXT PRIMARY KEY,
        balance INTEGER DEFAULT 0,
        karma INTEGER DEFAULT 50
      )
    `
    ).run();

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);`
    ).run();

    // Create settings table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT
      )
    `
    ).run();

    // Create inventory table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS user_inventory (
        user_id TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, item_id),
        FOREIGN KEY (item_id) REFERENCES items(id)
  )
    `
    ).run();

    // Create items table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS items (
id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  price INTEGER DEFAULT 0, -- ราคาของไอเทม
  max_per_day INTEGER DEFAULT NULL, -- จำนวนครั้งสูงสุดที่สามารถซื้อได้ต่อวัน
  type TEXT NOT NULL -- ประเภทของไอเทม เช่น "lock", "stealx2"
      )
        `
    ).run();

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_inventory_user_id ON inventory(user_id);`
    ).run();

    // Create daily_purchases table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS daily_purchases (
        user_id TEXT,
        date TEXT,
        item TEXT,
        count INTEGER DEFAULT 0,
        PRIMARY KEY (user_id, date, item)
      )
    `
    ).run();

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_daily_purchases_user_id_date ON daily_purchases(user_id, date);`
    ).run();

    // Create logs table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        action TEXT,
        detail TEXT,
        timestamp TEXT
      )
    `
    ).run();

    db.prepare(
      `CREATE INDEX IF NOT EXISTS idx_logs_timestamp ON logs(timestamp);`
    ).run();

    // Create daily_reward table
    db.prepare(
      `
      CREATE TABLE IF NOT EXISTS daily_reward (
        user_id TEXT PRIMARY KEY,
        last_claim_date TEXT
      )
    `
    ).run();

    console.log("✅ Database tables and indexes initialized successfully!");
  } catch (error) {
    console.error("❌ Error initializing database:", error.message);
  }
}

// Call the initialization function
initializeDatabase();

// Helper function to get a setting
function getSetting(key) {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key);
    return row ? JSON.parse(row.value) : null;
  } catch (error) {
    console.error(`❌ Error fetching setting for key "${key}":`, error);
    return null;
  }
}

// Helper function to set/update a setting
function setSetting(key, value) {
  try {
    db.prepare(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)"
    ).run(key, JSON.stringify(value));
  } catch (error) {
    console.error(`❌ Error setting value for key "${key}":`, error);
  }
}

// Helper function to add a log entry
function addLog(userId, action, detail) {
  try {
    const timestamp = new Date().toISOString();
    db.prepare(
      "INSERT INTO logs (user_id, action, detail, timestamp) VALUES (?, ?, ?, ?)"
    ).run(userId, action, detail, timestamp);
  } catch (error) {
    console.error("❌ Error adding log entry:", error);
  }
}

// Check if a user has claimed their daily reward today
function hasClaimedDaily(userId) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const row = db
      .prepare("SELECT last_claim_date FROM daily_reward WHERE user_id = ?")
      .get(userId);
    return row && row.last_claim_date === today;
  } catch (error) {
    console.error(
      `❌ Error checking daily reward for user "${userId}":`,
      error
    );
    return false;
  }
}

// Mark a user as having claimed their daily reward
function setClaimedDaily(userId) {
  try {
    const today = new Date().toISOString().slice(0, 10);
    db.prepare(
      "INSERT OR REPLACE INTO daily_reward (user_id, last_claim_date) VALUES (?, ?)"
    ).run(userId, today);
  } catch (error) {
    console.error(`❌ Error setting daily reward for user "${userId}":`, error);
  }
}

// Cleanup old daily purchases (e.g., older than 7 days)
function cleanupOldDailyPurchases(days = 7) {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const formattedDate = cutoffDate.toISOString().slice(0, 10);

    const info = db
      .prepare("DELETE FROM daily_purchases WHERE date < ?")
      .run(formattedDate);
    console.log(
      `✅ Cleaned up ${info.changes} daily purchases older than ${days} days.`
    );
  } catch (error) {
    console.error("❌ Error cleaning up old daily purchases:", error);
  }
}

// Add a room to the allowed rooms list
function addAllowedRoom(roomId) {
  try {
    let allowedRooms = getSetting("allowedRooms") || [];
    if (!allowedRooms.includes(roomId)) {
      allowedRooms.push(roomId);
      setSetting("allowedRooms", allowedRooms);
      console.log(`✅ Added room ${roomId} to allowed rooms list.`);
    } else {
      console.log(`ℹ️ Room ${roomId} is already in the allowed rooms list.`);
    }
  } catch (error) {
    console.error("❌ Error adding allowed room:", error);
  }
}

// Remove a room from the allowed rooms list by index
function removeAllowedRoom(index) {
  try {
    let allowedRooms = getSetting("allowedRooms") || [];
    if (index >= 0 && index < allowedRooms.length) {
      const removedRoom = allowedRooms.splice(index, 1)[0];
      setSetting("allowedRooms", allowedRooms);
      console.log(`✅ Removed room ${removedRoom} from allowed rooms list.`);
      return true;
    } else {
      console.log(`⚠️ Index ${index} is out of range.`);
      return false;
    }
  } catch (error) {
    console.error("❌ Error removing allowed room:", error);
    return false;
  }
}

// Get the list of allowed rooms
function getAllowedRooms() {
  try {
    const allowedRooms = getSetting("allowedRooms") || [];
    console.log(`ℹ️ Fetched allowed rooms: ${JSON.stringify(allowedRooms)}`);
    return allowedRooms;
  } catch (error) {
    console.error("❌ Error fetching allowed rooms:", error);
    return [];
  }
}

// Export the database and helper functions
module.exports = db;
module.exports.getSetting = getSetting;
module.exports.setSetting = setSetting;
module.exports.addLog = addLog;
module.exports.hasClaimedDaily = hasClaimedDaily;
module.exports.setClaimedDaily = setClaimedDaily;
module.exports.cleanupOldDailyPurchases = cleanupOldDailyPurchases;
module.exports.addAllowedRoom = addAllowedRoom;
module.exports.removeAllowedRoom = removeAllowedRoom;
module.exports.getAllowedRooms = getAllowedRooms;

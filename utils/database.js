const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Path to the database file
const dbPath = path.resolve(__dirname, "../redheroes.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error connecting to database:", err.message);
  } else {
    console.log("✅ Connected to the database!");
  }
});

// Initialize database tables
function initializeDatabase() {
  db.serialize(() => {
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        username TEXT NOT NULL,
        balance INTEGER DEFAULT 0,
        karma INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        price INTEGER NOT NULL,
        description TEXT NOT NULL,
        auto_use BOOLEAN DEFAULT 'N'
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS user_inventory (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        item_id INTEGER NOT NULL,
        quantity INTEGER DEFAULT 0,
        FOREIGN KEY (item_id) REFERENCES items(id),
        UNIQUE (user_id, item_id)
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id TEXT NOT NULL,
        room_name TEXT NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS work_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        task TEXT NOT NULL,
        answer TEXT NOT NULL,
        expires_at INTEGER NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS work_cooldowns (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL UNIQUE,
        last_work INTEGER NOT NULL
      )
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS daily_steal (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE, -- Key for daily steal count (e.g., daily_steal_userId_date)
        value INTEGER DEFAULT 0  -- Number of steals
      )
    `);

    console.log("✅ Database tables initialized!");
  });
}

// Export database and initialization function
module.exports = { db, initializeDatabase };

const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// Initialize database
const dbPath = path.join(__dirname, "../redheroes.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error connecting to database:", err.message);
  } else {
    console.log("✅ Connected to database!");
  }
});

// Function to initialize database tables
function initializeDatabase() {
  // Create a table to store the database version
  db.run(
    `CREATE TABLE IF NOT EXISTS db_version (
      id INTEGER PRIMARY KEY,
      version INTEGER NOT NULL
    )`
  );

  // Check the current database version
  db.get("SELECT version FROM db_version WHERE id = 1", [], (err, row) => {
    if (err) {
      console.error("❌ Error fetching database version:", err.message);
      return;
    }

    const currentVersion = row?.version || 0; // Default version is 0
    updateDatabaseSchema(currentVersion);
  });
}

// Function to update the database schema based on the version
function updateDatabaseSchema(currentVersion) {
  let nextVersion = currentVersion;

  // Version 1: Create all tables (Initial setup)
  if (nextVersion < 1) {
    console.log("⚙️ Creating tables for Version 1...");

    db.run(`CREATE TABLE IF NOT EXISTS daily_rewards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      last_claimed DATE,
      streak INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS daily_steal (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_id INTEGER NOT NULL,
      event_name TEXT NOT NULL,
      FOREIGN KEY(item_id) REFERENCES items(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_system TEXT,
      type TEXT NOT NULL,
      price INTEGER NOT NULL,
      description TEXT NOT NULL,
      auto_use BOOLEAN DEFAULT 'N',
      effect_file TEXT,
      priority INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS lotto888 (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      numbers TEXT NOT NULL,
      date TEXT NOT NULL,
      UNIQUE(user_id, date)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS lotto_prize (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prize INTEGER NOT NULL DEFAULT 200
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS rooms (
      room_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      room_name TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(room_id, guild_id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS user_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 0,
      UNIQUE(user_id, item_id),
      FOREIGN KEY(item_id) REFERENCES items(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL UNIQUE,
      username TEXT NOT NULL,
      balance INTEGER DEFAULT 0,
      karma INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_daily INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS work_cooldowns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL UNIQUE,
      last_work INTEGER NOT NULL
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS work_tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_id TEXT NOT NULL UNIQUE,
      task TEXT NOT NULL,
      answer TEXT NOT NULL,
      expires_at INTEGER NOT NULL
    )`);

    db.run(
      `CREATE INDEX IF NOT EXISTS idx_work_cooldowns_room_id ON work_cooldowns (room_id)`
    );
    db.run(
      `CREATE INDEX IF NOT EXISTS idx_work_tasks_room_id ON work_tasks (room_id)`
    );

    nextVersion = 1;
    console.log("✅ All tables created successfully for Version 1.");
  }

  // Version 2: Add experience field to users table
  if (nextVersion < 2) {
    db.run(
      "ALTER TABLE users ADD COLUMN experience INTEGER DEFAULT 0",
      (err) => {
        if (err) {
          console.error("❌ Error adding column to users table:", err.message);
        } else {
          console.log("✅ Added 'experience' column to users table.");
        }
      }
    );
    nextVersion = 2;
  }

  // Version 3: Add achievements table
  if (nextVersion < 3) {
    db.run(`CREATE TABLE IF NOT EXISTS achievements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      achievement_name TEXT NOT NULL,
      achieved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, achievement_name)
    )`);
    nextVersion = 3;
  }

  // Update the database version
  db.run("INSERT OR REPLACE INTO db_version (id, version) VALUES (1, ?)", [
    nextVersion,
  ]);
  console.log(`✅ Database schema updated to version ${nextVersion}`);
}

module.exports = { db, initializeDatabase };

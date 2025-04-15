const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.resolve(__dirname, "../redheroes.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("❌ Error connecting to database:", err.message);
  } else {
    console.log("✅ Connected to the database!");
  }
});

// Initialize tables (if not exists)
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
    CREATE TABLE IF NOT EXISTS setroom (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      idroom TEXT NOT NULL
    )
  `);
  
});

module.exports = db;

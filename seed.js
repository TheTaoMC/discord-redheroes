const db = require("./utils/database");

// Insert initial items
const items = [
  ["🔒 Lock", "lock", 100, "ป้องกันการขโมย", "N"],
  ["🦹 Steal x2", "stealx2", 500, "เพิ่มโอกาสขโมยเป็น 2 เท่า", "Y"],
  ["⚡ Steal x3", "stealx3", 1000, "เพิ่มโอกาสขโมยเป็น 3 เท่า", "Y"],
  ["🌟 Karma Boost", "karma_boost", 200, "เพิ่ม Karma 10 คะแนน", "Y"],
];

items.forEach((item) => {
  db.run(
    "INSERT INTO items (name, type, price, description, auto_use) VALUES (?, ?, ?, ?, ?)",
    item,
    (err) => {
      if (err) {
        console.error("❌ Error inserting item:", err.message);
      } else {
        console.log(`✅ Inserted item: ${item[0]}`);
      }
    }
  );
});

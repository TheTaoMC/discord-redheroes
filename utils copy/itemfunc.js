const shopItems = [
  { name: "🔐 ล็อกกระเป๋า (ป้องกันการขโมย 1 ครั้ง)", price: 100, maxPerDay: 5 },
  { name: "⭐ เพิ่ม Karma +10", price: 200 },
  { name: "🦹 ขโมย x2 (1 ครั้ง)", price: 500 },
];

// Function to check if the user can buy an item
function canBuyItem(itemIndex, userId, { balance, purchases }) {
  const item = shopItems[itemIndex - 1];

  // Check if the user has enough balance
  if (balance < item.price) {
    return {
      success: false,
      message: `❌ เงินไม่พอสำหรับซื้อ ${item.name}`,
    };
  }

  // Check daily purchase limit (if applicable)
  if (item.maxPerDay) {
    const todayCount = purchases[itemIndex] || 0;
    if (todayCount >= item.maxPerDay) {
      return {
        success: false,
        message: `❌ คุณซื้อ ${item.name} ครบ ${item.maxPerDay} ครั้งแล้ว`,
      };
    }
  }

  return { success: true };
}

// Function to use an item
function useItem(itemIndex, userId, userInventory, { updateKarma }) {
  const inventory = userInventory.get(userId) || { lock: 0, stealx2: 0 };

  switch (itemIndex) {
    case 1:
      inventory.lock++;
      break;
    case 2:
      updateKarma(userId, 10);
      break;
    case 3:
      inventory.stealx2++;
      break;
  }

  userInventory.set(userId, inventory);
  return inventory;
}

// Function to process items during a steal attempt
function processStealItems(userId, targetId, userInventory) {
  const userInv = userInventory.get(userId) || { stealx2: 0 };
  const targetInv = userInventory.get(targetId) || { lock: 0 };

  // Check if the target has a lock item
  if (targetInv.lock > 0) {
    targetInv.lock--;
    userInventory.set(targetId, targetInv);
    return {
      success: false,
      message: "🔒 เป้าหมายล็อกกระเป๋าอยู่! ขโมยไม่สำเร็จ...",
    };
  }

  // Calculate success rate
  let successRate = 0.5; // 50% base success rate

  // If the user has a steal x2 item
  if (userInv.stealx2 > 0) {
    successRate = 0.7; // 70% success rate with steal x2 item
    userInv.stealx2--;
    userInventory.set(userId, userInv);
  }

  return {
    success: Math.random() < successRate,
    multiplier: userInv.stealx2 > 0 ? 2 : 1,
  };
}

// Function to show user's inventory
function showInventory(userId, userInventory) {
  const inv = userInventory.get(userId) || { lock: 0, stealx2: 0 };
  return `🎒 ไอเทมในกระเป๋า:
🔐 ล็อกกระเป๋า: ${inv.lock} ชิ้น
🦹 ขโมย x2: ${inv.stealx2} ชิ้น`;
}

module.exports = {
  shopItems,
  canBuyItem,
  useItem,
  processStealItems,
  showInventory,
};

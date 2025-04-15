module.exports = {
  name: "help",
  description: "แสดงคำแนะนำการใช้งานบอท",
  execute(message, args) {
    const helpMessage = `
    🦹 **RedHeroes Bot Commands** 🦹
    \`.steal @user\` - ขโมยเงินจากผู้ใช้งานอื่น
    \`.inventory\` - ดูรายการไอเท็มในกระเป๋า
    \`.daily\` - รับรางวัลประจำวัน
    \`.shop\` - ดูรายการไอเท็มในร้านค้า
    \`.buy [item_name]\` - ซื้อไอเท็มจากร้านค้า
    \`.help\` - แสดงคำแนะนำการใช้งาน
    `;
    message.channel.send(helpMessage);
  },
};

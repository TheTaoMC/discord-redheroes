module.exports = {
  name: 'testbot',
  description: 'ทดสอบการทำงานของ bot complains',
  async execute(message, args, { client, db }) {
    if (!message.member.permissions.has('ADMINISTRATOR')) {
      return message.reply('❌ คำสั่งนี้ใช้ได้เฉพาะแอดมินเท่านั้น');
    }

    const botComplains = require('../events/botComplains');
    await botComplains.testBotComplains(client, db);
    message.reply('✅ ทดสอบระบบ Bot Complains เรียบร้อยแล้ว!');
  },
};
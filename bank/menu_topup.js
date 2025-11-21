// bank/menu_topup.js  (patched)
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, MessageFlags } = require('discord.js');

function readLog() {
  try {
    const p = path.join(__dirname, '../update/logdata.json');
    return JSON.parse(fs.readFileSync(p, 'utf8')) || {};
  } catch { return {}; }
}

module.exports = {
  name: 'interactionCreate',
  async execute(_client, interaction) {
    try {
      const isClosed = !!readLog()?.เมนูระบบใช้งานธนาคาร; // false = เปิดใช้งาน
      // โหมด "ธนาคารเปิดใช้งาน" = false → มีให้เลือก PromptPay/Wallet
      // โหมด "ปิด" = true → ปุ่ม buy_topup จะเปิดเฉพาะ Wallet (ไปดูใน wallet.js)
      if (!isClosed && interaction.isButton() && interaction.customId === 'buy_topup') {
        const embed = new EmbedBuilder()
          .setColor(0x5865f2)
          .setTitle('꒰``🏛️``꒱ เลือกช่องทางเติมเงิน')
          .setImage('https://www.animatedimages.org/data/media/562/animated-line-image-0124.gif');

        const select = new ActionRowBuilder().addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('teram_topup')
            .setPlaceholder('꒰ 🏛️ เลือกประเภทช่องทางเติมเงิน ꒱')
            .addOptions(
              { label: 'พร้อมเพย์ธนาคาร', emoji: '<:paypal:1357293128889008270>', description: 'สแกน QR เช็คสลิปเงินเข้าทันที', value: 'เติมสแกนจ่าย' },
              { label: 'ซองอั่งเปาวอเลต', emoji: '<:walletnew:1371806054060654622>', description: 'เติมด้วยลิงก์ซองอั่งเปา เงินเข้าทันที', value: 'เติมวอเลต' },
              { label: 'ล้างตัวเลือกใหม่', emoji: '<a:3915donotdisturb:1346747309211385927>', value: 'reset_memubank' }
            )
        );

        return interaction.reply({ embeds: [embed], components: [select], flags: MessageFlags.Ephemeral });
      }
    } catch (e) {
      console.error('menu_topup error:', e);
    }
  }
};

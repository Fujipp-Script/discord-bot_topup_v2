// commands/setup.js
const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8'));
  } catch { return {}; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setup')
    .setDescription('ตั้งค่ารับเงินธนาคาร/วอเลต/ช่องต่าง ๆ')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const cfg = readConfig();
    const allowed = new Set(cfg['ไอดีผู้ใช้งานที่ใช้คำสั่งได้'] || []);
    if (!allowed.has(interaction.user.id)) {
      return interaction.reply({ content: 'คุณไม่มีสิทธิ์ใช้คำสั่งนี้', ephemeral: true });
    }

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('setting_topup') // bankselect.js จะจับปุ่มนี้  :contentReference[oaicite:10]{index=10}
        .setLabel('เปิดหน้า ตั้งค่ารับเงิน')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ content: 'กดปุ่มเพื่อเปิดหน้า “ตั้งค่ารับเงิน”', components: [row], ephemeral: true });
  }
};

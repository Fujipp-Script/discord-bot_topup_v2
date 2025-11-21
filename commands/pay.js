// commands/pay.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { EmbedUpdate, createButton } = require('../components/payEmbed');
const fs = require('fs');
const path = require('path');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8'));
  } catch { return {}; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('pay')
    .setDescription('ส่งหน้าเติมเงิน (embed + ปุ่ม) ไปยังห้องที่กำหนด')
    .addChannelOption(opt =>
      opt.setName('channel')
        .setDescription('ห้องปลายทาง (ถ้าไม่ใส่จะส่งในห้องปัจจุบัน)')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    // เช็คสิทธิ์ตามรายชื่อ user id ใน config.json
    const cfg = readConfig();
    const allowed = new Set(cfg['ไอดีผู้ใช้งานที่ใช้คำสั่งได้'] || []);
    if (!allowed.has(interaction.user.id)) {
      return interaction.reply({ content: 'คุณไม่มีสิทธิ์ใช้คำสั่งนี้', ephemeral: true });
    }

    const target = interaction.options.getChannel('channel') || interaction.channel;
    const embed = EmbedUpdate();
    const row   = createButton();

    await target.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: `ส่งหน้าเติมเงินไปที่ <#${target.id}> แล้วครับ`, ephemeral: true });
  }
};

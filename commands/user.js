// commands/user.js
const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { loadBalances, addBalance, setBalance, getBalance, removeBalance } = require('../bank/base'); // :contentReference[oaicite:11]{index=11}
const fs = require('fs');
const path = require('path');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8'));
  } catch { return {}; }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('จัดการเครดิตของผู้ใช้')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addSubcommand(sc =>
      sc.setName('add')
        .setDescription('บวกเครดิตให้ผู้ใช้')
        .addUserOption(o => o.setName('user').setDescription('ผู้ใช้เป้าหมาย').setRequired(true))
        .addNumberOption(o => o.setName('amount').setDescription('จำนวนเงินที่จะบวก').setRequired(true))
    )
    .addSubcommand(sc =>
      sc.setName('update')
        .setDescription('ตั้งยอดเครดิตใหม่ (ทับของเดิม)')
        .addUserOption(o => o.setName('user').setDescription('ผู้ใช้เป้าหมาย').setRequired(true))
        .addNumberOption(o => o.setName('amount').setDescription('จำนวนเงินใหม่ทั้งหมด').setRequired(true))
    )
    .addSubcommand(sc =>
      sc.setName('delete')
        .setDescription('ลบผู้ใช้ออกจากฐานเครดิต')
        .addUserOption(o => o.setName('user').setDescription('ผู้ใช้เป้าหมาย').setRequired(true))
    ),

  async execute(interaction) {
    const cfg = readConfig();
    const allowed = new Set(cfg['ไอดีผู้ใช้งานที่ใช้คำสั่งได้'] || []);
    if (!allowed.has(interaction.user.id)) {
      return interaction.reply({ content: 'คุณไม่มีสิทธิ์ใช้คำสั่งนี้', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();
    const target = interaction.options.getUser('user');
    const amt = interaction.options.getNumber('amount');

    await interaction.deferReply({ ephemeral: true });
    await loadBalances();

    try {
      if (sub === 'add') {
        if (!(amt > 0)) return interaction.editReply('จำนวนเงินต้องมากกว่า 0');
        const after = addBalance(target.id, amt);
        return interaction.editReply(`เพิ่มเครดิตให้ <@${target.id}> จำนวน **${amt.toFixed(2)}** สำเร็จ • ยอดใหม่: **${after}** THB`);
      }
      if (sub === 'update') {
        if (!(amt >= 0)) return interaction.editReply('จำนวนเงินต้องเป็น 0 หรือมากกว่า');
        const after = setBalance(target.id, amt);
        return interaction.editReply(`ตั้งยอดของ <@${target.id}> เป็น **${after}** THB เรียบร้อย`);
      }
      if (sub === 'delete') {
        const existed = getBalance(target.id);
        const ok = removeBalance(target.id);
        return interaction.editReply(ok
          ? `ลบข้อมูลเครดิตของ <@${target.id}> เรียบร้อย (ยอดเดิม: ${existed} THB)`
          : `ไม่พบข้อมูลของ <@${target.id}> ในระบบ`);
      }
      return interaction.editReply('คำสั่งไม่ถูกต้อง');
    } catch (e) {
      console.error('user cmd error', e);
      return interaction.editReply('เกิดข้อผิดพลาด ไม่สามารถดำเนินการได้');
    }
  }
};

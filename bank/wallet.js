// bank/wallet.js  (patched/tidy)  — ใช้ META_API จาก api/truemoney.js
const fs = require('fs');
const path = require('path');
const client = require('../index');
const { addBalance } = require('./base');           // store เครดิตเดิม  :contentReference[oaicite:15]{index=15}
const { META_API } = require('../api/truemoney');   // อ่าน config.json  :contentReference[oaicite:16]{index=16}
const { TextInputBuilder, ActionRowBuilder, ModalBuilder, TextInputStyle, EmbedBuilder, MessageFlags } = require('discord.js');

function readLog() {
  try {
    const p = path.join(__dirname, '../update/logdata.json');
    return JSON.parse(fs.readFileSync(p, 'utf8')) || {};
  } catch { return {}; }
}

const openWalletModal = async (interaction) => {
  const modal = new ModalBuilder()
    .setCustomId('wallet_modal')
    .setTitle('เติมเงินด้วยซองอั่งเปา')
    .addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId('codeInput')
          .setLabel('🧧 กรอกลิงค์ซองอั่งเปา')
          .setStyle(TextInputStyle.Short)
          .setPlaceholder('https://gift.truemoney.com/campaign/?v=xxxxxxxxxxxxxxx')
          .setRequired(true)
      )
    );
  return interaction.showModal(modal);
};

client.on('interactionCreate', async (interaction) => {
  try {
    const isClosed = !!readLog()?.เมนูระบบใช้งานธนาคาร; // true = ปิดธนาคาร → ปุ่ม buy_topup เปิด Wallet ตรง ๆ
    if (isClosed && interaction.isButton() && interaction.customId === 'buy_topup') {
      return openWalletModal(interaction);
    }
    if (!isClosed && interaction.isStringSelectMenu() && interaction.customId === 'teram_topup') {
      const choice = interaction.values?.[0];
      if (choice === 'เติมวอเลต') return openWalletModal(interaction);
    }
  } catch (e) {
    console.error('wallet trigger error:', e);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!(interaction.isModalSubmit() && interaction.customId === 'wallet_modal')) return;

  const editErr = async (title) => {
    const e = new EmbedBuilder().setColor(0xff0000).setTitle(title);
    if (interaction.deferred || interaction.replied) return interaction.editReply({ embeds: [e] });
    return interaction.reply({ embeds: [e], flags: MessageFlags.Ephemeral });
  };

  try {
    await interaction.deferReply({ ephemeral: true });

    const url = interaction.fields.getTextInputValue('codeInput').trim();
    if (!/^https:\/\/gift\.truemoney\.com\/campaign\/\?v=/.test(url)) {
      return editErr('``❌`` กรุณากรอกลิงก์ซองอั่งเปาให้ถูกต้อง!');
    }

    const s = readLog();
    const WalletPhone = String(s?.เบอร์รับเงินวอเลท || '').replace(/\D/g, '');
    const TopupNotify = s?.ไอดีช่องแจ้งเตือนเติมเงิน || '';
    const Role_success = s?.ไอดียศได้รับเมื่อเติมเงิน || '';

    if (WalletPhone.length !== 10) return editErr('``❌`` เบอร์รับเงินต้องเลข 10 หลักเท่านั้น!');

    await interaction.editReply('⌛ กำลังตรวจสอบซองอั่งเปา…');

    const res = await META_API(url, WalletPhone);
    if (res?.ok === 1001) {
      const userId = interaction.user.id;
      const amt = Number(res.amount || 0);
      const newBal = addBalance(userId, amt);

      const ok = new EmbedBuilder()
        .setColor(0xff9933)
        .setTitle('꒰``✅``꒱ เติมเงินสำเร็จ')
        .addFields(
          { name: '``👤`` **คุณได้เติมเงิน**', value: `\`\`\` ${amt.toFixed(2)} THB \`\`\``, inline: true },
          { name: '``💰`` **ยอดเงินคงเหลือ**', value: `\`\`\` ${newBal} THB \`\`\``, inline: true }
        )
        .setThumbnail(interaction.user.displayAvatarURL());
      await interaction.editReply({ embeds: [ok] });

      // give role
      const role = interaction.guild.roles.cache.get(Role_success);
      if (role) {
        try { await interaction.member.roles.add(role); }
        catch (e) {
          if (e?.code === 50013) {
            await interaction.followUp({
              embeds: [new EmbedBuilder().setColor(0xff0000).setTitle('``❌`` บอทมียศต่ำกว่ายศที่จะให้หลังเติมเงิน')],
              flags: MessageFlags.Ephemeral
            });
          } else { console.error('role add error', e); }
        }
      }

      // notify channel
      const t = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' });
      const [date, time] = t.split(', ');
      const formatted = date.replace(/\//g, '-');

      const normalize = (n) => String(n || '').replace(/^(Mr|Ms|Mrs|Dr|นาย|นางสาว|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.|สาว)\s*/i, '').trim();
      const cleanedName = normalize((res.name_owner || '').split(' ')[0]);

      const ch = interaction.guild.channels.cache.get(TopupNotify);
      if (ch?.isTextBased?.() || ch?.send) {
        const noti = new EmbedBuilder()
          .setColor(0xff9933)
          .setTitle('꒰``✅``꒱ แจ้งเตือนเติมเงินสำเร็จ')
          .setDescription(
            `\`\`👤\`\` **ผู้ใช้ :** <@${userId}>\n` +
            `\`\`💰\`\` **จำนวนเงิน : ${amt} บาท**\n` +
            `\`\`🧧\`\` **ผ่านวอเลต : ซองอั่งเปา**\n` +
            `\`\`💬\`\` **ชำระโดย : ${cleanedName || 'ไม่ทราบชื่อ'}**`
          )
          .setThumbnail(interaction.user.displayAvatarURL())
          .setFooter({ text: `🕐 เวลา : ${time} ${formatted}` });
        await ch.send({ embeds: [noti] });
      }
      return;
    }

    // error path
    if (res?.errorData) return editErr(`\`\`❌\`\` ${res.mes_err || 'เกิดข้อผิดพลาด'}`);
    return editErr('``❌`` ไม่สามารถประมวลผลคำตอบจากเซิร์ฟเวอร์ได้');
  } catch (e) {
    console.error('wallet handler error:', e);
    return editErr('``❌`` เกิดข้อผิดพลาดไม่คาดคิด');
  }
});

// bank/bankselect.js  (patched)
const fs = require('fs');
const path = require('path');
const client = require('../index');
const {
  EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, MessageFlags
} = require('discord.js');

function readLogdata() {
  try {
    const p = path.resolve(__dirname, '../update/logdata.json');
    return JSON.parse(fs.readFileSync(p, 'utf8')) || {};
  } catch { return {}; }
}

function writeLogdata(mutator) {
  const p = path.resolve(__dirname, '../update/logdata.json');
  let obj = {};
  try { obj = JSON.parse(fs.readFileSync(p, 'utf8')) || {}; } catch {}
  const next = mutator(obj) || obj;
  fs.writeFileSync(p, JSON.stringify(next, null, 2));
  return next;
}

const createPanel = () => {
  const s = readLogdata();

  const Phone_wallet   = s?.เบอร์รับเงินวอเลท || 'รอเพิ่ม';
  const Phone_promtpay = s?.เบอร์รับเงินพ้อมเพย์ || 'รอเพิ่ม';
  const Channel_check  = s?.ไอดีช่องเช็คสลิป || 'รอเพิ่ม';
  const Channel_Notify = s?.ไอดีช่องแจ้งเตือนเติมเงิน || 'รอเพิ่ม';

  const Key_api   = s?.API_คีย์_TOKEN || 'รอเพิ่ม';
  const Api_link  = s?.ลิงค์_API_SlipOK || 'รอเพิ่ม';

  const price_promtpay = s?.เติมเงินขั้นต่ำของธนาคาร ?? 'รอเพิ่ม';
  const check_slipid   = s?.ยศไอดีเช็คสลิป || 'รอเพิ่ม';
  const check_sliptime = s?.ปรับกำหนดเวลาเช็คสลิป || 'รอเพิ่ม';
  const Role_success   = s?.ไอดียศได้รับเมื่อเติมเงิน || 'รอเพิ่ม';

  const Status_bank    = !!s?.เมนูระบบใช้งานธนาคาร; // false = เปิดใช้งาน

  const statusStr = Status_bank ? '🔴 ปิดแล้ว' : '🟢 เปิดอยู่ตอนนี้';

  const embed = new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle('ตั้งค่าบัญชีการรับเงิน')
    .addFields(
      { name: `\`\`🏛️\`\` LINK API`, value: `\`\`\` https://api.slipok.com/...${Api_link} \`\`\`` },
      { name: `\`\`🏛️\`\` API KEY`, value: `\`\`\` ${Key_api} \`\`\`` },
      { name: `\`\`💳\`\` หมายเลขพร้อมเพย์`, value: `\`\`\` ${Phone_promtpay} \`\`\`` },
      { name: `\`\`💰\`\` เติมเงินขั้นต่ำของธนาคาร`, value: `\`\`\` ${price_promtpay} \`\`\`` },
      { name: `\`\`🏦\`\` เมนูระบบใช้งานธนาคาร`, value: `\`\`\` ${statusStr} \`\`\`` },
      { name: `\`\`🆔\`\` ไอดีช่องเช็คสลิป`, value: `\`\`\` ${Channel_check} \`\`\`` },
      { name: `\`\`🆔\`\` ไอดีช่องแจ้งเตือนเติมเงิน`, value: `\`\`\` ${Channel_Notify} \`\`\`` },
      { name: `\`\`🆔\`\` ยศไอดีเช็คสลิป`, value: `\`\`\` ${check_slipid} \`\`\`` },
      { name: `\`\`🆔\`\` ยศที่ได้รับเมื่อเติมเงิน`, value: `\`\`\` ${Role_success} \`\`\`` },
      { name: `\`\`🕐\`\` ปรับกำหนดเวลาเช็คสลิป`, value: `\`\`\` ${check_sliptime} นาที \`\`\`` },
      { name: `\`\`🧧\`\` PHONE WALLET`, value: `\`\`\` ${Phone_wallet} \`\`\`` }
    )
    .setImage('https://www.animatedimages.org/data/media/562/animated-line-image-0124.gif');

  const SelectMenu = new ActionRowBuilder()
    .addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('code_bank')
        .setPlaceholder('🏛️ เลือกธนาคารของคุณให้ถูกต้อง')
        .addOptions({ label: 'รีเฟรชดูการอัปเดต', emoji: '🔄', value: 'setup_bank' })
    );

  const Buttons = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('setting_topup_bank').setLabel('🏛️ ตั้งค่ารับเงินธนาคาร').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId('setting_topup_wallet').setLabel('🧧 ตั้งค่ารับเงินวอเลต').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('setting_channel_bank').setLabel('🆔 ตั้งค่าไอดีช่อง').setStyle(ButtonStyle.Primary)
    );

  const Buttons2 = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder().setCustomId('status_bank').setLabel('🏦 เปิด-ปิด เมนูเติมเงิน').setStyle(ButtonStyle.Secondary)
    );

  return { embed, SelectMenu, Buttons, Buttons2 };
};

module.exports = {
  name: 'interactionCreate',
  async execute(_client, interaction) {
    try {
      if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

      const { customId } = interaction;
      if (customId === 'setting_topup' || (customId === 'code_bank' && interaction.values?.[0] === 'setup_bank')) {
        const { embed, SelectMenu, Buttons, Buttons2 } = createPanel();
        if (interaction.isButton()) {
          await interaction.reply({ embeds: [embed], components: [SelectMenu, Buttons, Buttons2], flags: MessageFlags.Ephemeral });
        } else {
          await interaction.update({ embeds: [embed], components: [SelectMenu, Buttons, Buttons2], flags: MessageFlags.Ephemeral });
        }
        return;
      }

      if (interaction.isStringSelectMenu() && interaction.customId === 'code_bank') {
        const val = String(interaction.values?.[0] || '');
        writeLogdata((obj) => { obj.Code_bank_number = val; return obj; });
        await interaction.update({ withResponse: true });
      }
    } catch (e) {
      console.error('bankselect error:', e);
    }
  }
};

// สถานะเปิด/ปิดเมนูธนาคาร
const buildStatusEmbed = () => {
  const s = readLogdata();
  const isClosed = !!s?.เมนูระบบใช้งานธนาคาร;
  const statusStr = isClosed ? '🔴 ปิดแล้ว' : '🟢 เปิดอยู่ตอนนี้';

  const embed = new EmbedBuilder()
    .setColor(0x2e2e2e)
    .setTitle('ระบบเปิด-ปิด เติมเงินธนาคาร')
    .setDescription(`\`\`🏦\`\` เมนูระบบเติมเงินธนาคาร \`\` ${statusStr} \`\`\n\`\`\`ตั้งค่าเปิด-ปิด แถบเติมเงินธนาคาร\`\`\``)
    .setThumbnail(client.user.displayAvatarURL());

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('open_status_bank').setLabel('꒰🟢 เปิดใช้งาน ꒱').setStyle(ButtonStyle.Success).setDisabled(!isClosed),
    new ButtonBuilder().setCustomId('off_status_bank').setLabel('꒰🔴 ปิดใช้งาน ꒱').setStyle(ButtonStyle.Danger).setDisabled(isClosed)
  );

  return { embed, row };
};

client.on('interactionCreate', async (interaction) => {
  if (!(interaction.isButton() && interaction.customId === 'status_bank')) return;
  const { embed, row } = buildStatusEmbed();
  await interaction.reply({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
});

client.on('interactionCreate', async (interaction) => {
  if (!(interaction.isButton() && (interaction.customId === 'open_status_bank' || interaction.customId === 'off_status_bank'))) return;
  const isClose = interaction.customId === 'off_status_bank';
  writeLogdata((obj) => { obj['เมนูระบบใช้งานธนาคาร'] = isClose; return obj; });
  const { embed, row } = buildStatusEmbed();
  await interaction.update({ embeds: [embed], components: [row], flags: MessageFlags.Ephemeral });
});

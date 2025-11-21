// update/submit_update.js  (patched)
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, MessageFlags } = require('discord.js');

const configPath = path.resolve(__dirname, './logdata.json');

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      if (!interaction.isModalSubmit()) return;

      // อ่านค่าเดิม (ถ้าไม่มีให้เป็น {})
      let DATE_BASE;
      try { DATE_BASE = JSON.parse(fs.readFileSync(configPath)); } catch { DATE_BASE = {}; }

      // === BANK API ===
      if (interaction.customId === 'topup_modal_bank') {
        const link_value_bank   = interaction.fields.getTextInputValue('link_value_bank');
        const topup_value_key   = interaction.fields.getTextInputValue('topup_value_key');
        const phone_value_pp    = interaction.fields.getTextInputValue('phone_value_promtpay');
        const price_promtpay    = interaction.fields.getTextInputValue('price_promtpay');

        if (!link_value_bank.startsWith('https://api.slipok.com/api/line/apikey/')) {
          return interaction.reply({
            embeds:[ new EmbedBuilder().setColor(0xFF0000).setTitle('``❌`` กรุณากรอกลิงก์ API ให้ถูกต้อง').setDescription('```ตัวอย่าง https://api.slipok.com/api/line/apikey/12345```') ],
            flags: MessageFlags.Ephemeral
          });
        }

        const NumberAPICode = link_value_bank.split('/').pop();
        DATE_BASE['API_คีย์_TOKEN'] = topup_value_key;
        DATE_BASE['ลิงค์_API_SlipOK'] = NumberAPICode;
        DATE_BASE['เบอร์รับเงินพ้อมเพย์'] = phone_value_pp;
        DATE_BASE['เติมเงินขั้นต่ำของธนาคาร'] = price_promtpay;

        fs.writeFileSync(configPath, JSON.stringify(DATE_BASE, null, 2));
        return interaction.reply({ content: '✅ บันทึกค่าธนาคารแล้ว', flags: MessageFlags.Ephemeral });
      }

      // === WALLET ===
      if (interaction.customId === 'topup_modal_wallet') {
        const phone_wallet = interaction.fields.getTextInputValue('phone_value_wallet');
        DATE_BASE['เบอร์รับเงินวอเลท'] = phone_wallet;
        fs.writeFileSync(configPath, JSON.stringify(DATE_BASE, null, 2));
        return interaction.reply({ content: '✅ บันทึกเบอร์วอเลตแล้ว', flags: MessageFlags.Ephemeral });
      }

      // === CHANNELS/ROLES ===
      if (interaction.customId === 'channel_modal_bank') {
        const Channel_check   = interaction.fields.getTextInputValue('channel_check');
        const Channel_notify  = interaction.fields.getTextInputValue('channel_notify');
        const check_slipid    = interaction.fields.getTextInputValue('check_slipid');
        const check_sliptime  = interaction.fields.getTextInputValue('check_sliptime');
        const role_success    = interaction.fields.getTextInputValue('role_success');

        DATE_BASE['ไอดีช่องเช็คสลิป']            = Channel_check;
        DATE_BASE['ไอดีช่องแจ้งเตือนเติมเงิน']    = Channel_notify;
        DATE_BASE['ยศไอดีเช็คสลิป']              = check_slipid;
        DATE_BASE['ไอดียศได้รับเมื่อเติมเงิน']   = role_success;
        DATE_BASE['ปรับกำหนดเวลาเช็คสลิป']       = check_sliptime;

        fs.writeFileSync(configPath, JSON.stringify(DATE_BASE, null, 2));
        return interaction.reply({ content: '✅ บันทึกช่อง/ยศ แล้ว', flags: MessageFlags.Ephemeral });
      }

      // === OTHER CHANNELS / PRICES (ถ้ามีใช้) ===
      if (interaction.customId === 'channel_modal_') {
        const Channel_boost = interaction.fields.getTextInputValue('channel_boost');
        const Channel_oders = interaction.fields.getTextInputValue('channel_oders');
        DATE_BASE['ไอดีช่องส่งประวัติการบูสต์'] = Channel_boost;
        DATE_BASE['ไอดีช่องส่งออเดอร์แอดมิน'] = Channel_oders;
        fs.writeFileSync(configPath, JSON.stringify(DATE_BASE, null, 2));
        return interaction.reply({ content: '✅ บันทึกช่องบูสต์/ออเดอร์ แล้ว', flags: MessageFlags.Ephemeral });
      }

      if (interaction.customId === 'price_boot_modal') {
        const Price_Boot1 = interaction.fields.getTextInputValue('price_boot1_input');
        const Price_Boot3 = interaction.fields.getTextInputValue('price_boot3_input');
        DATE_BASE['ราคาบูสต์หนึ่งเดือน'] = Price_Boot1;
        DATE_BASE['ราคาบูสต์สามเดือน']  = Price_Boot3;
        fs.writeFileSync(configPath, JSON.stringify(DATE_BASE, null, 2));
        return interaction.reply({ content: '✅ บันทึกราคาเรียบร้อย', flags: MessageFlags.Ephemeral });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
    }
  }
};

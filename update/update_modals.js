const fs = require('fs');
const path = require('path');
const { TextInputBuilder, ActionRowBuilder, ModalBuilder, TextInputStyle } = require('discord.js');
module.exports = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        try {
            const configPath = path.resolve(__dirname, './logdata.json');
            const DATE_BASE = JSON.parse(fs.readFileSync(configPath));
            const Phone_wallet = DATE_BASE?.เบอร์รับเงินวอเลท || 'รอเพิ่ม';
            const Phone_promtpay = DATE_BASE?.เบอร์รับเงินพ้อมเพย์ || '064XXXXXXX';
            const Price_Boot1 = DATE_BASE?.ราคาบูสต์หนึ่งเดือน || 'รอเพิ่ม';
            const Price_Boot3 = DATE_BASE?.ราคาบูสต์สามเดือน || 'รอเพิ่ม';
            const Channel_check = DATE_BASE?.ไอดีช่องเช็คสลิป || 'รอเพิ่ม';
            const Channel_notify = DATE_BASE?.ไอดีช่องแจ้งเตือนเติมเงิน || 'รอเพิ่ม';
            const Channel_boost = DATE_BASE?.ไอดีช่องส่งประวัติการบูสต์ || 'รอเพิ่ม';
            const price_promtpay = DATE_BASE?.เติมเงินขั้นต่ำของธนาคาร || '5';
            const check_slipid = DATE_BASE?.ยศไอดีเช็คสลิป || 'รอเพิ่ม';
            const check_sliptime = DATE_BASE?.ปรับกำหนดเวลาเช็คสลิป || 'รอเพิ่ม';
            const Channel_oder = DATE_BASE?.ไอดีช่องส่งออเดอร์แอดมิน || 'รอเพิ่ม';
            const Key_api = DATE_BASE?.API_คีย์_TOKEN || 'ตัวอย่าง SLIPXXXXXXX';
            const link_bank = DATE_BASE?.ลิงค์_API_SlipOK || '12345';
            const Role_success = DATE_BASE?.ไอดียศได้รับเมื่อเติมเงิน || 'รอเพิ่ม';
     
            if (interaction.customId == "setting_topup_bank") {
                const modal = new ModalBuilder()
                    .setCustomId('topup_modal_bank')
                    .setTitle('ตั้งค่า API ธนาคาร')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('link_value_bank')
                                .setLabel('[ 🔗ลิงค์ API ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('https://api.slipok.com/api/line/apikey/12345')
                                .setRequired(false)
                                .setValue(`https://api.slipok.com/api/line/apikey/${link_bank}`)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('topup_value_key')
                                .setLabel('[ ⭐คีย์ API ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('ตัวอย่าง SLIPXXXXXXX')
                                .setRequired(false)
                                .setValue(Key_api)
                        ),
                       
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('phone_value_promtpay')
                                .setLabel('[ 💳หมายเลขพ้อมเพย์ธนาคาร ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('064XXXXXXX')
                                .setRequired(false)
                                .setValue(Phone_promtpay)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('price_promtpay')
                                .setLabel('[ 💰ราคาขั้นต่ำเติมเงินธนาคาร ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('ป้อนราคาเติมเงินขั้นต่ำ')
                                .setRequired(false)
                                .setValue(price_promtpay)
                        ),
                    );
                await interaction.showModal(modal);
            }

            if (interaction.customId == "setting_topup_wallet") {
                const modal = new ModalBuilder()
                    .setCustomId('topup_modal_wallet')
                    .setTitle('ตั้งค่าบัญชีรับเงินวอเลท')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('phone_value_wallet')
                                .setLabel('[ 🧧เบอร์รับเงินวอเลต ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('080-XXX-XXXX')
                                .setRequired(false)
                                .setValue(Phone_wallet)
                        ),
                    );
                await interaction.showModal(modal);
            }

            if (interaction.customId == "setting_channel_bank") {
                const modal = new ModalBuilder()
                    .setCustomId('channel_modal_bank')
                    .setTitle('ตั้งค่าช่องบัญชีธนาคาร')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('channel_check')
                                .setLabel('[ 🆔ช่องเช็คสลิป ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('กรุณากรอก ID ช่องเช็คสลิป')
                                .setRequired(false)
                                .setValue(Channel_check)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('channel_notify')
                                .setLabel('[ 🆔ช่องแจ้งเตือนเติมเงิน ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('กรุณากรอก ID ช่องแจ้งเตือน')
                                .setRequired(false)
                                .setValue(Channel_notify)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('check_slipid')
                                .setLabel('[ 🆔ไอดียศเช็คสลิป ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('กรุณากรอก ID ไอดียศเช้คสลิป')
                                .setRequired(false)
                                .setValue(check_slipid)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('role_success')
                                .setLabel('[ 🆔ไอดียศเมื่อเติมเงิน ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('ID ยศที่ได้รับเมื่อเติมเงิน')
                                .setRequired(false)
                                .setValue(Role_success)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('check_sliptime')
                                .setLabel('[ 🕐 ปรับกำหนดเวลาเช็คสลิป ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('กรุณากรอก ID ไอดียศเช้คสลิป')
                                .setRequired(false)
                                .setValue(check_sliptime)
                        ),
                    );
                await interaction.showModal(modal);
            }

            if (interaction.customId == "setting_channel") {
                const modal = new ModalBuilder()
                    .setCustomId('channel_modal_')
                    .setTitle('ตั้งค่าช่องส่งประวัติการบูสต์')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('channel_boost')
                                .setLabel('[ 🆔ช่องประวัติการบูสต์ ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('กรุณากรอก ID ช่องประวัติการบูสต์')
                                .setRequired(false)
                                .setValue(Channel_boost)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('channel_oders')
                                .setLabel('[ 🆔ช่องส่งออเดอร์แอดมิน ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('กรุณากรอก ID ช่องส่งออเดอร์แอดมิน')
                                .setRequired(false)
                                .setValue(Channel_oder)
                        )
                    );
                await interaction.showModal(modal);
            }

            if (interaction.customId == "price_boot") {
                const modal = new ModalBuilder()
                    .setCustomId('price_boot_modal')
                    .setTitle('ตั้งค่าราคาเม็ดบูสต์')
                    .addComponents(
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('price_boot1_input')
                                .setLabel('[ 💰ตั้งราคาสินค้าบูสต์ 1 เดือน ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('ป้อนราคาต่อเม็ดบูสต์')
                                .setRequired(false)
                                .setValue(Price_Boot1)
                        ),
                        new ActionRowBuilder().addComponents(
                            new TextInputBuilder()
                                .setCustomId('price_boot3_input')
                                .setLabel('[ 💰ตั้งราคาสินค้าบูสต์ 3 เดือน ]')
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder('ป้อนราคาต่อเม็ดบูสต์')
                                .setRequired(false)
                                .setValue(Price_Boot3)
                        )
                    );
                await interaction.showModal(modal);
            }
        } catch (error) {
            console.error('Error handling interaction:', error);
        }
    }
};
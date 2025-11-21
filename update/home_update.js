const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(client, interaction) {
        try {
            if (!interaction.isCommand() && !interaction.isStringSelectMenu()) return;
            const { commandName, customId } = interaction;
            if (commandName === 'setup' || (customId === 'refresh' && interaction.values[0] === 'setup')) {
             
                const ServerPath = path.resolve(__dirname, './logdata.json');
                const Server_BASE = JSON.parse(fs.readFileSync(ServerPath));
                const Price_Boot1 = Server_BASE?.ราคาบูสต์หนึ่งเดือน || 'รอเพิ่ม';
                const Price_Boot3 = Server_BASE?.ราคาบูสต์สามเดือน || 'รอเพิ่ม';
                const Channel_boost = Server_BASE?.ไอดีช่องส่งประวัติการบูสต์ || 'รอเพิ่ม';
                const Channel_oders = Server_BASE?.ไอดีช่องส่งออเดอร์แอดมิน || 'รอเพิ่ม';

                const congigrowPath = path.resolve(__dirname, '../config.json');
                const congigrow_BASE = JSON.parse(fs.readFileSync(congigrowPath));
                const allowedUserIDs = congigrow_BASE?.ไอดีผู้ใช้งานที่ใช้คำสั่งได้;
                if (!allowedUserIDs.includes(interaction.user.id)) {
                    await interaction.reply({
                        content: '\`\`❌ เอ้ะ! คำสั่งสำหรับผู้ที่มีสิทธิ์เท่านั้น \`\`',
                        flags: MessageFlags.Ephemeral
                    });
                    return;
                }

                const embed = new EmbedBuilder()
                    .setColor(0x5865f2)
                    .setTitle(`\`\`⚙️\`\` ตั้งค่าระบบตั้งค่าหลังบ้าน`)
                    .addFields({ name: `\`\`💰\`\` ราคาบูสต์หนึ่งเดือน \`\` ${Price_Boot1} \`\``, value: `_ _` })
                    .addFields({ name: `\`\`💰\`\` ราคาบูสต์สามเดือน \`\` ${Price_Boot3} \`\``, value: `_ _` })
                    .addFields({ name: `\`\`🆔\`\` ไอดีช่องส่งประวัติการบูสต์ \`\` ${Channel_boost} \`\``, value: `_ _` })
                    .addFields({ name: `\`\`🆔\`\` ไอดีช่องส่งออเดอร์แอดมิน \`\` ${Channel_oders} \`\``, value: `_ _` })

                    .setImage('https://img2.pic.in.th/pic/8617984945af94a5f32129eb7522f39a.png');

                const select = new StringSelectMenuBuilder()
                    .setCustomId('refresh')
                    .setPlaceholder('🔄 รีเฟชรหน้าต่าง')
                    .addOptions([
                        { label: 'รีเฟชรดูการอัปเดต', emoji: '🔄', value: 'setup' },
                    ]);
                const selectRow_1 = new ActionRowBuilder().addComponents(select);
                const buttonRow = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('setting_topup')
                            .setLabel('🏛️ตั้งค่าการรับเงิน')
                            .setStyle(ButtonStyle.Danger)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('setting_channel')
                            .setLabel('🆔ตั้งค่าไอดีช่อง')
                            .setStyle(ButtonStyle.Success)
                    )
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('price_boot')
                            .setLabel('💰ตั้งราคาสินค้า')
                            .setStyle(ButtonStyle.Primary)
                    )

                if (interaction.isCommand()) {
                    await interaction.reply({ embeds: [embed], components: [selectRow_1, buttonRow], flags: MessageFlags.Ephemeral });
                } else if (interaction.isStringSelectMenu()) {
                    await interaction.update({ embeds: [embed], components: [selectRow_1, buttonRow], flags: MessageFlags.Ephemeral });
                }
            }
            client.setMaxListeners(20);
        } catch (error) {
            if (error.code === 50001 || error.code === 50013 || error.code === 40060 || error.httpStatus === 400) {
            } else {
                console.error('Unknown error', error);
            }
        }
    }
};
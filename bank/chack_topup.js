// bank/chack_topup.js  (patched)
const { EmbedBuilder, MessageFlags } = require('discord.js');
const { getBalance, loadBalances } = require('./base'); // ใช้ store เดิม  :contentReference[oaicite:10]{index=10}

module.exports = {
  name: 'interactionCreate',
  async execute(client, interaction) {
    try {
      if (!interaction.isButton() || interaction.customId !== 'chack_topup') return;

      const loading = new EmbedBuilder().setColor(0x5865f2).setTitle('กำลังเช็คยอดเงิน...');
      await interaction.reply({ embeds: [loading], flags: MessageFlags.Ephemeral });

      await loadBalances();
      const balance = Number(getBalance(interaction.user.id) || 0);
      const show = balance.toFixed(2);

      // delay เล็กน้อยเพื่อความสวยงาม
      await new Promise(r => setTimeout(r, 800));

      const result = new EmbedBuilder()
        .setColor(0x5865f2)
        .setAuthor({ name: interaction.user.username, iconURL: interaction.user.displayAvatarURL() })
        .setDescription(`\`\`\`꒰👛꒱ ยอดเงินคงเหลือ ${show} THB \`\`\``)
        .setThumbnail(interaction.user.displayAvatarURL());
      await interaction.editReply({ embeds: [result] });
      client.setMaxListeners(15);
    } catch (err) {
      console.error('chack_topup error:', err);
      try {
        await interaction.editReply({
          embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('``❌`` ไม่สามารถเช็คยอดได้')],
        });
      } catch {}
    }
  }
};

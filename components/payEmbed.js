// components/payEmbed.js
const fs = require('fs');
const path = require('path');
const { EmbedBuilder, ButtonStyle, ActionRowBuilder, ButtonBuilder } = require('discord.js');

function EmbedUpdate() {
  return new EmbedBuilder()
    .setColor(0x0000) // ถ้าจะเปลี่ยนเป็นสีหลัก Dev: 0x7987AC ก็ได้
    .setTitle(`"'                     ₊　　　　⁺　　　．　　　₊　   ⁺　　　\n` + `**．⠀⠀︵︵ 　__เติมเงิน__, อัตโนมัติ!**\n\n` + `**            pay money　 ( <a:CatToken:1407473158101143592> )   thank you **`)
    .setImage('https://media.discordapp.net/attachments/1415713849742721034/1416044875031515146/9467541a253543a32d1a405b3d784cfe.gif?ex=68c8b5cf&is=68c7644f&hm=6fc83ae6d4d568ce33a67acfdb7b938ed3494ddcd2fa295a83ec334b840ade39&=')
    .setFooter({ text: 'Claire Paymoney' });
}

function createButton() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('buy_topup')        // ไปต่อที่ menu_topup.js & wallet.js  :contentReference[oaicite:7]{index=7} :contentReference[oaicite:8]{index=8}
      .setLabel('꒰ เติมเงิน ꒱')
      .setEmoji('<a:BitCoin:1291488881975496826>')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('chack_topup')      // ไปต่อที่ chack_topup.js            :contentReference[oaicite:9]{index=9}
      .setLabel('꒰ เช็คยอดเงิน ꒱')
      .setEmoji('<:MJ_Mark_Money:1291489170451075186>')
      .setStyle(ButtonStyle.Primary)
  );
}

module.exports = { EmbedUpdate, createButton };
// bank/check_slip.js  — no node-fetch/no formdata-node
const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const https = require('https');

const { addBalance } = require('./base');

const UP = path.join(__dirname, 'uploads');
if (!fs.existsSync(UP)) fs.mkdirSync(UP, { recursive: true });

// ใช้ของที่ Node20+ มีให้ในตัว (undici)
const { FormData, File, Blob } = globalThis;

function readLog() {
  try {
    const p = path.resolve(__dirname, '../update/logdata.json');
    return JSON.parse(fs.readFileSync(p, 'utf8')) || {};
  } catch { return {}; }
}

module.exports = {
  name: 'messageCreate',
  async execute(client, message) {
    try {
      if (message.author.bot || !message.attachments.size) return;

      const s = readLog();
      const Api_Number   = s?.ลิงค์_API_SlipOK || '';
      const Api_Key      = s?.API_คีย์_TOKEN || '';
      const ChannelCheck = s?.ไอดีช่องเช็คสลิป || '';
      const NotifyID     = s?.ไอดีช่องแจ้งเตือนเติมเงิน || '';
      const Role_success = s?.ไอดียศได้รับเมื่อเติมเงิน || '';

      if (!Api_Number || !Api_Key) {
        const t = !Api_Number
          ? '``❌`` ไม่ได้เพิ่มลิงก์ API จึงไม่สามารถตรวจสอบสลิปได้!'
          : '``❌`` ไม่ได้เพิ่มคีย์ API จึงไม่สามารถตรวจสอบสลิปได้!';
        return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle(t)] });
      }

      if (String(message.channel.id) !== String(ChannelCheck)) return;

      const processAttachment = async (attachment) => {
        const imagePath = path.join(UP, `${Date.now()}_${attachment.name}`).replace(/\\/g, '/');

        // ดาวน์โหลดไฟล์แนบจาก Discord
        await new Promise((resolve, reject) => {
          const file = fs.createWriteStream(imagePath);
          https.get(attachment.url, (res) => {
            res.pipe(file);
            file.on('finish', () => file.close(resolve));
          }).on('error', (err) => {
            try { fs.unlinkSync(imagePath); } catch {}
            reject(err);
          });
        });

        try {
          // เตรียมฟอร์มด้วย FormData แบบ built-in
          const buf = fs.readFileSync(imagePath);
          const blob = new Blob([buf], { type: 'image/png' }); // เดาเป็น png; ไม่ซีเรียสสำหรับ slipok
          const file = new File([blob], path.basename(imagePath), { type: 'image/png' });

          const form = new FormData();
          form.append('files', file);
          form.append('log', 'true');

          // ใช้ global fetch ของ Node
          const res = await fetch(`https://api.slipok.com/api/line/apikey/${Api_Number}`, {
            method: 'POST',
            headers: { 'x-authorization': String(Api_Key) },
            body: form
          });

          let data = null;
          try { data = await res.json(); } catch { /* ignore */ }

          if (!res.ok || !data?.success) {
            const err = data || { code: -1 };
            return handleApiError(err, message);
          }

          const userId = message.author.id;
          const amountToAdd = Number(data?.data?.amount || 0);
          const newBalance = addBalance(userId, amountToAdd);

          const ok = new EmbedBuilder()
            .setColor(0xFF9933)
            .setTitle('꒰``✅``꒱ เติมเงินสำเร็จ')
            .addFields(
              { name: `\`\`👤\`\` **คุณ ${message.author.username} เติมเงิน**`, value: `\`\`\` ${amountToAdd.toFixed(2)} THB \`\`\``, inline: true },
              { name: `\`\`💰\`\` **ยอดเงินคงเหลือ**`, value: `\`\`\` ${newBalance} THB \`\`\``, inline: true }
            )
            .setThumbnail(message.author.displayAvatarURL());
          await message.channel.send({ embeds: [ok] });

          // แจกยศสำเร็จ
          const role = message.guild.roles.cache.get(Role_success);
          if (role) {
            try { await message.member.roles.add(role); }
            catch (e) {
              if (e?.code === 50013) {
                await message.reply({
                  embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('``❌`` บอทมียศต่ำกว่ายศที่จะให้หลังเติมเงิน')]
                });
              } else { console.error('role add error', e); }
            }
          }

          // แจ้งห้องเติมเงินสำเร็จ (ถ้าตั้ง)
          const bankCodes = {
            '002': 'กรุงเทพ', '004': 'กสิกร', '006': 'กรุงไทย', '011': 'ธนชาต',
            '014': 'ไทยพาณิชย์', '025': 'กรุงศรี', '069': 'เกียรติ..', '022': 'ซีไอเอ็มบี',
            '067': 'ทิสโก้', '024': 'ยูโอบี', '071': 'ไทยเครดิต', '073': 'แลนด์แอนด์..',
            '070': 'ไอซีบีซี', '098': 'พัฒนาวิ..', '034': 'การเกษตร', '035': 'เพื่อการส่ง..',
            '030': 'ออมสิน', '033': 'อาคารสง..'
          };
          const sendingBank = data?.data?.sendingBank ?? '002';
          const bankAbbr = bankCodes[sendingBank] || sendingBank;

          const normalizeName = (n) => String(n || '').replace(/^(Mr|Ms|Mrs|Dr|นาย|นางสาว|นาง|น\.ส\.|ด\.ช\.|ด\.ญ\.|สาว)\s*/i, '').trim();
          const cleanedName = normalizeName(data?.data?.sender?.displayName);

          const thailandTime = new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' });
          const [date, time] = thailandTime.split(', ');
          const formattedDate = date.replace(/\//g, '-');

          const notifyCh = message.guild.channels.cache.get(NotifyID);
          if (notifyCh?.isTextBased?.() || notifyCh?.send) {
            const noti = new EmbedBuilder()
              .setColor(0x5865f2)
              .setTitle('꒰``✅``꒱ แจ้งเตือนเติมเงินสำเร็จ')
              .setDescription(
                `\`\`👤\`\` **ผู้ใช้ :** <@${userId}>\n` +
                `\`\`💰\`\` **จำนวนเงิน : ${amountToAdd} บาท**\n` +
                `\`\`🏛️\`\` **ผ่านธนาคาร : ${bankAbbr}**\n` +
                `\`\`💬\`\` **ชำระโดย : ${cleanedName || 'ไม่ทราบชื่อ'}**`
              )
              .setThumbnail(message.author.displayAvatarURL())
              .setFooter({ text: `🕐 เวลา : ${time} ${formattedDate}` });
            await notifyCh.send({ embeds: [noti] });
          }
        } catch (err) {
          console.error('SlipOK API error:', err);
          await message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('``❌`` เชื่อมต่อ API เพื่อตรวจสลิปล้มเหลว')] });
        } finally {
          try { fs.unlinkSync(imagePath); } catch {}
        }
      };

      for (const a of message.attachments.values()) {
        await processAttachment(a);
      }

      function handleApiError(errorData, msgObj) {
        const code = Number(errorData?.code ?? -1);
        const m = new EmbedBuilder().setColor(0xFF0000);
        const map = {
          1000: 'กรุณาติดตั้ง node_modules ให้ครบ',
          1001: 'ไม่พบข้อมูลสาขา กรุณาตรวจสอบไอดีสาขา',
          1002: 'Authorization Header ไม่ถูกต้อง',
          1003: 'Package ของคุณหมดอายุแล้ว',
          1005: 'อัปโหลดได้เฉพาะ .jpg .jpeg .png',
          1006: 'รูปภาพไม่ถูกต้อง',
          1007: 'รูปภาพไม่มี QR Code — ลองครอปให้เหลือเฉพาะ QR',
          1008: 'QR ดังกล่าวไม่ใช่ QR สำหรับตรวจสอบการชำระเงิน',
          1009: 'ข้อมูลธนาคารขัดข้องชั่วคราว',
          1010: 'สลิปจากธนาคาร — รอตรวจสอบหลังการโอน',
          1011: 'QR Code หมดอายุ / ไม่มีรายการ',
          1012: 'สลิปซ้ำ — เคยส่งเข้ามาแล้ว',
          1013: 'ยอดที่ส่งมาไม่ตรงกับยอดสลิป',
          1014: 'บัญชีผู้รับไม่ตรงกับบัญชีหลัก'
        };
        m.setTitle(`\`\`❌\`\` ${map[code] || 'เกิดข้อผิดพลาด Unknown'}`);
        return msgObj.channel.send({ embeds: [m] });
      }

      client.setMaxListeners(15); // ถ้ายังเตือน ย้ายไป set ทีเดียวใน server.js
    } catch (e) {
      console.error('check_slip outer error:', e);
    }
  }
};


// bank/check_slip.js  (patched for debug view)
// const { EmbedBuilder, AttachmentBuilder } = require('discord.js');
// const fs = require('fs');
// const path = require('path');
// const https = require('https');
// const { FormData } = require('formdata-node');
// let fetch; (async () => { fetch = (await import('node-fetch')).default; })();

// const { addBalance } = require('./base');

// // ⬇️ โหลดรายชื่อแอดมินจาก config.json (จะส่งดีบักให้คนกลุ่มนี้)
// let ADMIN_IDS = [];
// try {
//   const CFG = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8'));
//   ADMIN_IDS = Array.isArray(CFG['ไอดีผู้ใช้งานที่ใช้คำสั่งได้']) ? CFG['ไอดีผู้ใช้งานที่ใช้คำสั่งได้'] : [];
// } catch {}

// const UP = path.join(__dirname, 'uploads');
// if (!fs.existsSync(UP)) fs.mkdirSync(UP, { recursive: true });

// function readLog() {
//   try {
//     const p = path.resolve(__dirname, '../update/logdata.json');
//     return JSON.parse(fs.readFileSync(p, 'utf8')) || {};
//   } catch { return {}; }
// }

// // ⬇️ helper: ส่งดีบัก (JSON) ให้แอดมินทาง DM + เซฟไฟล์ล่าสุด
// async function sendSlipDebug(client, guild, rawJson, cause = 'unknown') {
//   try {
//     // เขียนไฟล์ล่าสุดไว้ดูย้อนหลัง
//     const lastPath = path.join(UP, 'slipok_last.json');
//     fs.writeFileSync(lastPath, JSON.stringify(rawJson, null, 2));
//     const file = new AttachmentBuilder(Buffer.from(JSON.stringify(rawJson, null, 2)), { name: 'slipok_response.json' });

//     // แจ้งแอดมินทุกคนในลิสต์ (ถ้าอยู่ในเซิร์ฟเวอร์นี้)
//     for (const adminId of ADMIN_IDS) {
//       try {
//         const user = await client.users.fetch(adminId).catch(() => null);
//         if (!user) continue;
//         await user.send({
//           content: `🔎 SlipOK debug (${cause}) • Guild: **${guild?.name || 'unknown'}**`,
//           files: [file]
//         }).catch(() => {});
//       } catch {}
//     }

//     // log ลง console เผื่อไล่เร็ว
//     console.log('=== SlipOK DEBUG:', cause, '===\n', JSON.stringify(rawJson, null, 2));
//   } catch (e) {
//     console.error('sendSlipDebug error:', e);
//   }
// }

// module.exports = {
//   name: 'messageCreate',
//   async execute(client, message) {
//     try {
//       if (message.author.bot || !message.attachments.size) return;

//       const s = readLog();
//       const Api_Number   = s?.ลิงค์_API_SlipOK || '';
//       const Api_Key      = s?.API_คีย์_TOKEN || '';
//       const ChannelCheck = s?.ไอดีช่องเช็คสลิป || '';
//       const NotifyID     = s?.ไอดีช่องแจ้งเตือนเติมเงิน || '';
//       const Role_success = s?.ไอดียศได้รับเมื่อเติมเงิน || '';

//       if (!Api_Number || !Api_Key) {
//         const t = !Api_Number
//           ? '``❌`` ไม่ได้เพิ่มลิงก์ API จึงไม่สามารถตรวจสอบสลิปได้!'
//           : '``❌`` ไม่ได้เพิ่มคีย์ API จึงไม่สามารถตรวจสอบสลิปได้!';
//         return message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle(t)] });
//       }

//       if (String(message.channel.id) !== String(ChannelCheck)) return;

//       const processAttachment = async (attachment) => {
//         const { fileFromSync } = await import('fetch-blob/from.js');
//         const imagePath = path.join(UP, `${Date.now()}_${attachment.name}`).replace(/\\/g, '/');

//         await new Promise((resolve, reject) => {
//           const file = fs.createWriteStream(imagePath);
//           https.get(attachment.url, (res) => {
//             res.pipe(file);
//             file.on('finish', () => file.close(resolve));
//           }).on('error', (err) => {
//             try { fs.unlinkSync(imagePath); } catch {}
//             reject(err);
//           });
//         });

//         try {
//           const form = new FormData();
//           form.append('files', fileFromSync(imagePath));
//           form.append('log', 'true');

//           const res = await fetch(`https://api.slipok.com/api/line/apikey/${Api_Number}`, {
//             method: 'POST',
//             headers: { 'x-authorization': String(Api_Key) },
//             body: form
//           });

//           let respJson = null;
//           try { respJson = await res.clone().json(); } catch { respJson = { note: 'non-json response' }; }

//           if (!res.ok) {
//             // ⬇️ ส่งดีบักให้แอดมิน พร้อมไฟล์ JSON
//             await sendSlipDebug(client, message.guild, respJson || { status: res.status }, 'http_error');
//             return handleApiError(respJson || { code: -1 }, message);
//           }

//           const data = respJson;
//           if (!data?.success) {
//             // ⬇️ ตรวจไม่ผ่าน → ส่งดีบักให้แอดมินดูดิบทั้งหมด
//             await sendSlipDebug(client, message.guild, data, 'success_false');
//             return message.channel.send({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('``❌`` การตรวจสอบสลิปล้มเหลว!')] });
//           }

//           // ✅ ผ่าน → ดำเนินการเพิ่มเครดิตตามเดิม
//           const userId = message.author.id;
//           const amountToAdd = Number(data?.data?.amount || 0);
//           const newBalance = addBalance(userId, amountToAdd);

//           const ok = new EmbedBuilder()
//             .setColor(0xFF9933)
//             .setTitle('꒰``✅``꒱ เติมเงินสำเร็จ')
//             .addFields(
//               { name: `\`\`👤\`\` **คุณ ${message.author.username} เติมเงิน**`, value: `\`\`\` ${amountToAdd.toFixed(2)} THB \`\`\``, inline: true },
//               { name: `\`\`💰\`\` **ยอดเงินคงเหลือ**`, value: `\`\`\` ${newBalance} THB \`\`\``, inline: true }
//             )
//             .setThumbnail(message.author.displayAvatarURL());
//           await message.channel.send({ embeds: [ok] });

//           // แจกยศ/แจ้งเตือน (โค้ดเดิมของคุณ)
//           // ...
//         } catch (err) {
//           console.error('SlipOK API error:', err);
//           await message.reply({ embeds: [new EmbedBuilder().setColor(0xFF0000).setTitle('``❌`` เชื่อมต่อ API เพื่อตรวจสลิปล้มเหลว')] });
//         } finally {
//           try { fs.unlinkSync(imagePath); } catch {}
//         }
//       };

//       for (const a of message.attachments.values()) {
//         await processAttachment(a);
//       }

//       function handleApiError(errorData, msgObj) {
//         const code = Number(errorData?.code ?? -1);

//         // ⬇️ กรณี code เด่น ๆ ส่งดีบักเพิ่มอีกครั้ง (โดยเฉพาะ 1014 ที่คุณเจอ)
//         if ([1014, 1012, 1013].includes(code)) {
//           sendSlipDebug(client, msgObj.guild, errorData, `api_code_${code}`).catch(()=>{});
//         }

//         const m = new EmbedBuilder().setColor(0xFF0000);
//         const map = {
//           1000: 'กรุณาติดตั้ง node_modules ให้ครบ',
//           1001: 'ไม่พบข้อมูลสาขา กรุณาตรวจสอบไอดีสาขา',
//           1002: 'Authorization Header ไม่ถูกต้อง',
//           1003: 'Package ของคุณหมดอายุแล้ว',
//           1005: 'อัปโหลดได้เฉพาะ .jpg .jpeg .png',
//           1006: 'รูปภาพไม่ถูกต้อง',
//           1007: 'รูปภาพไม่มี QR Code — ลองครอปให้เหลือเฉพาะ QR',
//           1008: 'QR ดังกล่าวไม่ใช่ QR สำหรับตรวจสอบการชำระเงิน',
//           1009: 'ข้อมูลธนาคารขัดข้องชั่วคราว',
//           1010: 'สลิปจากธนาคาร — รอตรวจสอบหลังการโอน',
//           1011: 'QR Code หมดอายุ / ไม่มีรายการ',
//           1012: 'สลิปซ้ำ — เคยส่งเข้ามาแล้ว',
//           1013: 'ยอดที่ส่งมาไม่ตรงกับยอดสลิป',
//           1014: 'บัญชีผู้รับไม่ตรงกับบัญชีหลัก'
//         };
//         m.setTitle(`\`\`❌\`\` ${map[code] || 'เกิดข้อผิดพลาด Unknown'}`);
//         return msgObj.channel.send({ embeds: [m] });
//       }
//     } catch (e) {
//       console.error('check_slip outer error:', e);
//     }
//   }
// };


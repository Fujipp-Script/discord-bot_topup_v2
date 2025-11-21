// index.js
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Partials, Collection, EmbedBuilder, ActivityType } = require('discord.js');

// โหลดคอนฟิกแบบกันพัง
let CONFIG = {};
try {
  CONFIG = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8'));
} catch {
  console.error('⚠️ อ่าน config.json ไม่ได้ หรือไฟล์หาย');
  CONFIG = {};
}

// สร้าง Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

// export client ให้ไฟล์ที่ require('../index') ใช้งานได้
module.exports = client;

/**
 * ===== Auto-bind handlers ใน ./bank และ ./update (ถ้ามี) =====
 * - ไฟล์ที่ export { name, execute } จะถูก bind อัตโนมัติ (เช่น home_update / bankselect / menu_topup / chack_topup / check_slip)
 * - ไฟล์ที่ผูก client เองอยู่แล้ว (เช่น bank_slipOk / wallet) แค่ require ก็พอ
 */
for (const dir of ['bank', 'update']) {
  const abs = path.join(__dirname, dir);
  if (!fs.existsSync(abs)) {
    console.warn(`⚠️ ไม่พบโฟลเดอร์ ./${dir}`);
    continue;
  }
  for (const f of fs.readdirSync(abs).filter(x => x.endsWith('.js'))) {
    const full = path.join(abs, f);
    const mod = require(full);
    if (mod?.name && typeof mod.execute === 'function') {
      client.on(mod.name, (...args) => mod.execute(client, ...args));
      console.log(`🔗 bound handler ${mod.name} -> ${dir}/${f}`);
    } else {
      // บางไฟล์ภายในใช้ client.on(...) เอง (เช่น QR พร้อมเพย์, วอเลต)
      console.log(`📦 loaded ${dir}/${f}`);
    }
  }
}

// โหลดคำสั่ง (จากโฟลเดอร์ ./commands)
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
if (fs.existsSync(commandsPath)) {
  for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
    const cmd = require(path.join(commandsPath, file));
    if (cmd?.data && cmd?.execute) client.commands.set(cmd.data.name, cmd);
  }
} else {
  console.warn('⚠️ ไม่พบโฟลเดอร์ ./commands');
}

// ตัวจัดการเมื่อพร้อม (รองรับทั้ง ready(v14) และ clientReady(v15))
const onReady = async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  client.user.setPresence({
    activities: [{ name: 'Topup System • /setup /pay /user', type: ActivityType.Watching }],
    status: 'online',
  });

  try {
    const body = client.commands.map(c => c.data.toJSON());
    await client.application.commands.set(body);
    console.log(`✅ Registered ${body.length} application (/) commands`);
  } catch (e) {
    console.error('Register commands error:', e);
  }
};
client.once('ready', onReady);
client.once('clientReady', onReady); // เผื่ออัปเกรด DJS v15 ในอนาคต

// ตัวประมวลผล Slash Commands
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const cmd = client.commands.get(interaction.commandName);
  if (!cmd) return;
  try {
    await cmd.execute(interaction);
  } catch (e) {
    console.error('Command execute error:', e);
    const msg = new EmbedBuilder().setColor(0xff0000).setTitle('เกิดข้อผิดพลาดในการทำงานของคำสั่ง');
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ embeds: [msg] }).catch(() => {});
    } else {
      await interaction.reply({ embeds: [msg], ephemeral: true }).catch(() => {});
    }
  }
});

// กัน promise ค้าง/ error เงียบ
process.on('unhandledRejection', (err) => console.error('unhandledRejection:', err));
process.on('uncaughtException', (err) => console.error('uncaughtException:', err));

// ล็อกอิน
if (!CONFIG['โทเค็นบอท']) {
  console.error('❌ ยังไม่ได้ใส่ "โทเค็นบอท" ใน config.json');
  process.exit(1);
}
client.login(CONFIG['โทเค็นบอท']).catch(err => {
  console.error('❌ login failed:', err);
});

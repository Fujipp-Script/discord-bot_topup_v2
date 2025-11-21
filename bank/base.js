// bank/base.js (ฉบับแก้ไข)
const fs = require('fs');
const path = require('path');

function readCfg() {
  try {
    return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'config.json'), 'utf8'));
  } catch { return {}; }
}

// ใช้ไฟล์จาก config.DATA_USERS ถ้ามี, ไม่งั้นใช้ balances.json เดิม
const CFG = readCfg();
const CUSTOM_DB = CFG?.DATA_USERS && String(CFG.DATA_USERS).trim();
const DB_PATH = path.resolve(__dirname, CUSTOM_DB || 'balances.json');

let balances = {};

// สร้างไฟล์/โฟลเดอร์ถ้ายังไม่มี
function ensureFile() {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
}

// โหลดข้อมูลตอนเริ่ม
function loadBalances() {
  try {
    ensureFile();
    const data = fs.readFileSync(DB_PATH, 'utf8');
    balances = JSON.parse(data || '{}') || {};
    if (typeof balances !== 'object' || Array.isArray(balances)) balances = {};
  } catch {
    balances = {};
  }
}

// บันทึกข้อมูล
function saveBalances() {
  try {
    ensureFile();
    fs.writeFileSync(DB_PATH, JSON.stringify(balances, null, 2));
  } catch (e) {
    console.error('saveBalances error:', e);
  }
}

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

// ตั้งค่าจำนวนเงินให้ผู้ใช้ (เก็บเป็น string 2 ตำแหน่ง)
function setBalance(userId, amount) {
  balances[userId] = toNum(amount).toFixed(2);
  saveBalances();
  return balances[userId];
}

// เพิ่มยอดเงิน
function addBalance(userId, amount) {
  const cur = toNum(balances[userId]);
  const next = Math.round((cur + toNum(amount)) * 100) / 100;
  balances[userId] = next.toFixed(2);
  saveBalances();
  return balances[userId];
}

// หักยอดเงิน
function deductBalance(userId, amount) {
  const cur = toNum(balances[userId]);
  const dec = toNum(amount);
  if (cur >= dec) {
    const next = Math.round((cur - dec) * 100) / 100;
    balances[userId] = next.toFixed(2);
    saveBalances();
    return true;
  }
  return false;
}

// ดึงยอดเงินของผู้ใช้
function getBalance(userId) {
  return typeof balances[userId] === 'string' ? balances[userId] : '0.00';
}

// ลบผู้ใช้ทั้ง record
function removeBalance(userId) {
  if (Object.prototype.hasOwnProperty.call(balances, userId)) {
    delete balances[userId];
    saveBalances();
    return true;
  }
  return false;
}

loadBalances();

module.exports = { loadBalances, saveBalances, setBalance, addBalance, deductBalance, getBalance, removeBalance };

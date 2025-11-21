// api/truemoney.js
// ใช้กับ bank/wallet.js -> META_API(url, walletPhone)
// อ่านค่าจาก config.json (ใส่ TM_ENDPOINT และ TM_TOKEN ได้)
const fs = require('fs');
const path = require('path');

function readCfg() {
  try {
    const p = path.join(process.cwd(), 'config.json');
    return JSON.parse(fs.readFileSync(p, 'utf8')) || {};
  } catch { return {}; }
}

const CFG = readCfg();
// ตัวเลือกโหมด:
// 1) เรียก META API ของคุณเอง (แนะนำสำหรับ production)
//    - ใส่ใน config.json: { "TM_ENDPOINT": "https://your.api/redeem", "TM_TOKEN": "xxxxx" }
//    - เซิร์ฟเวอร์ของคุณควรรับ JSON { url, walletPhone } แล้วตอบกลับ { ok:1001, amount, name_owner } เมื่อสำเร็จ
// 2) ถ้าไม่ตั้งค่า TM_ENDPOINT → แจ้งเตือนให้ตั้งค่า

function isValidGiftUrl(u) {
  return /^https:\/\/gift\.truemoney\.com\/campaign\/\?v=/.test(String(u || '').trim());
}

async function callMetaEndpoint(endpoint, token, url, walletPhone) {
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ url, walletPhone })
    });

    // พยายามอ่านข้อความ error กรณีไม่ใช่ JSON
    let data = null;
    try { data = await res.json(); } catch { /* ignore */ }

    if (!res.ok) {
      const msg = (data && (data.message || data.error || data.mes_err)) || `HTTP ${res.status}`;
      return { errorData: true, mes_err: `META_API error: ${msg}` };
    }

    // ปรับรูปแบบข้อมูลให้ wallet.js ใช้ได้
    // คาดหวังว่า endpoint ของคุณจะส่งอย่างน้อย { ok:1001, amount, name_owner }
    if (data && Number(data.ok) === 1001) {
      return {
        ok: 1001,
        amount: Number(data.amount || 0),
        name_owner: String(data.name_owner || '')
      };
    }

    // เผื่อ endpoint อื่นใช้ key แตกต่างกัน
    if (data && (data.status === 'success' || data.success === true)) {
      return {
        ok: 1001,
        amount: Number(data.amount || data.value || 0),
        name_owner: String(data.name_owner || data.owner || data.name || '')
      };
    }

    const msg = (data && (data.message || data.error || data.mes_err)) || 'ไม่ทราบสาเหตุ';
    return { errorData: true, mes_err: msg };

  } catch (e) {
    return { errorData: true, mes_err: `META_API network error: ${e.message}` };
  }
}

async function META_API(url, walletPhone) {
  // ตรวจ URL ก่อน
  if (!isValidGiftUrl(url)) {
    return { errorData: true, mes_err: 'ลิงก์ซองอั่งเปาไม่ถูกต้อง' };
  }

  // ถ้าตั้งค่า TM_ENDPOINT ไว้ ให้เรียกใช้
  const endpoint = CFG?.TM_ENDPOINT && String(CFG.TM_ENDPOINT).trim();
  if (endpoint) {
    const token = CFG?.TM_TOKEN && String(CFG.TM_TOKEN).trim();
    return await callMetaEndpoint(endpoint, token, url, walletPhone);
  }

  // ไม่ได้ตั้งค่า endpoint → แจ้งให้ไปตั้งค่า
  return {
    errorData: true,
    mes_err: 'ยังไม่ได้ตั้งค่า TM_ENDPOINT ใน config.json (เช่น "https://your.api/redeem")'
  };
}

module.exports = { META_API };

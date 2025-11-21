// server.js
const express = require('express');
const os = require('os');

// 👉 การ require('./index') จะทำให้บอท Discord เริ่มทำงาน (login) ทันที
const client = require('./index');

const app = express();
const STARTED_AT = Date.now();

// simple homepage
app.get('/', (_req, res) => {
  res.type('text/plain').send('Claire Paymoney • OK');
});

// liveness probe
app.get('/healthz', (_req, res) => {
  const ready = !!client.user; // มี user แล้วแปลว่า login สำเร็จ
  res.status(ready ? 200 : 503).json({
    ok: ready,
    uptimeSec: Math.round(process.uptime()),
    bot: ready ? client.user.tag : null
  });
});

// readiness / metrics (หยาบ ๆ)
app.get('/metrics', (_req, res) => {
  const ready = !!client.user;
  const guilds = ready ? client.guilds.cache.size : 0;
  res.json({
    service: 'claire-topup-bot',
    node: process.version,
    hostname: os.hostname(),
    startedAt: new Date(STARTED_AT).toISOString(),
    uptimeSec: Math.round((Date.now() - STARTED_AT) / 1000),
    botReady: ready,
    guilds
  });
});

// 404
app.use((_req, res) => res.status(404).json({ ok: false, error: 'not_found' }));

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`🌐 HTTP server listening on :${PORT}`);
});

// graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received, shutting down...`);
  server.close(() => console.log('HTTP server closed.'));
  try { await client.destroy(); } catch {}
  process.exit(0);
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = app;

// POST /api/lead  { file, page, name, school, phone, email }
// Forwards a download-form lead to the owner's WhatsApp through CallMeBot
// (https://www.callmebot.com/blog/free-api-whatsapp-messages/). The download
// form calls this alongside FormSubmit, without waiting for it, so a slow or
// failed WhatsApp send never affects the visitor's download.
//
// Env vars (Vercel project settings, see .env.example):
//   CALLMEBOT_PHONE   the WhatsApp number that receives the alerts, e.g. +923001234567
//   CALLMEBOT_APIKEY  the key CallMeBot sent to that number
'use strict';

const MAX_LEN = 200;

function clean(value) {
  if (typeof value !== 'string') return '';
  // drop control characters (incl. newlines) so a field can't fake extra lines in the message
  return value.replace(/[\u0000-\u001f\u007f]+/g, ' ').trim().slice(0, MAX_LEN);
}

// A Pakistani mobile as typed on the form (0300 1234567, +92 300..., 92300...) -> 923001234567
function waNumber(phone) {
  let d = phone.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2);
  if (d.startsWith('0')) d = '92' + d.slice(1);
  return d.length >= 10 && d.length <= 15 ? d : '';
}

function sameSite(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // same-origin fetches from some browsers omit it
  try {
    return new URL(origin).host === req.headers.host;
  } catch (err) {
    return false;
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }
  if (!sameSite(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const lead = {
    file: clean(body.file) || 'Download',
    page: clean(body.page),
    name: clean(body.name),
    school: clean(body.school),
    phone: clean(body.phone),
    email: clean(body.email),
  };
  if (!lead.name || !lead.school || lead.phone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ error: 'Missing details' });
  }

  const to = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;
  if (!to || !apikey) {
    console.error('CALLMEBOT_PHONE or CALLMEBOT_APIKEY is not set; WhatsApp lead alert skipped');
    return res.status(503).json({ error: 'Not configured' });
  }

  const reply = waNumber(lead.phone);
  const text = [
    `New download: ${lead.file}`,
    `Name: ${lead.name}`,
    `School: ${lead.school}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email || '-'}`,
    lead.page ? `Page: ${lead.page}` : '',
    reply ? `Reply: https://wa.me/${reply}` : '',
  ].filter(Boolean).join('\n');

  const url = 'https://api.callmebot.com/whatsapp.php?' + new URLSearchParams({ phone: to, text, apikey });
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!r.ok) {
      console.error('CallMeBot answered', r.status, (await r.text()).slice(0, 300));
      return res.status(502).json({ error: 'WhatsApp send failed' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('CallMeBot request failed', err && err.message);
    return res.status(502).json({ error: 'WhatsApp send failed' });
  }
};

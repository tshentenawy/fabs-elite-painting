const nodemailer = require("nodemailer");

const MAX = { name: 100, email: 200, phone: 40, service: 100, message: 5000 };
const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const esc = (s) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }
  let body = req.body || {};
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = Object.fromEntries(new URLSearchParams(body)); }
  }
  if (clean(body.company_website, 200)) return res.status(200).json({ ok: true });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return res.status(429).json({ ok: false, error: "Too many messages. Please call us instead." });

  const name = clean(body.name, MAX.name);
  const email = clean(body.email, MAX.email);
  const phone = clean(body.phone, MAX.phone);
  const service = clean(body.service, MAX.service);
  const message = clean(body.message, MAX.message);
  if (!name || !phone || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: "Please enter your name, phone number and a valid email." });
  }

  const { SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;
  if (!SMTP_USER || !SMTP_PASS || !CONTACT_TO) {
    console.error("Contact form: missing SMTP_USER / SMTP_PASS / CONTACT_TO");
    return res.status(500).json({ ok: false, error: "Form is not configured yet." });
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com", port: 465, secure: true, auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  const rows = [["Name", name], ["Email", email], ["Phone", phone || "-"], ["Service", service || "-"]];
  try {
    await transporter.sendMail({
      from: `"Fabs Construction Website" <${SMTP_USER}>`,
      to: CONTACT_TO,
      replyTo: `"${name.replace(/"/g, "")}" <${email}>`,
      subject: `Free quote request from ${name}${service ? ` (${service})` : ""}`,
      text: rows.map(([k, v]) => `${k}: ${v}`).join("\n") +
        `\n\nProject details:\n${message || "(none provided)"}\n\nReply to this email to answer the customer directly.`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#231F20">
        <h2 style="margin:0 0 12px;color:#2F7E80">Free quote request</h2>
        <table cellpadding="6" style="border-collapse:collapse">
        ${rows.map(([k, v]) => `<tr><td style="font-weight:bold">${k}</td><td>${esc(v)}</td></tr>`).join("")}
        </table>
        <p style="font-weight:bold;margin:16px 0 4px">Project details</p>
        <p style="white-space:pre-wrap;margin:0">${esc(message || "(none provided)")}</p>
        <p style="color:#777;font-size:12px;margin-top:20px">Hit Reply to answer the customer directly.</p></div>`,
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact form send failed:", err);
    return res.status(502).json({ ok: false, error: "Sorry, the message could not be sent. Please call or email us." });
  }
};

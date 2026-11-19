// حكاية حب — Cloudflare Worker (ملف واحد: السيرفر + الدخول + الدفع)
// ===== auth =====
const enc = new TextEncoder();
const b64 = (u) => { let s = ""; for (const x of u) s += String.fromCharCode(x); return btoa(s); };
const unb64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const hex = (buf) => [...new Uint8Array(buf)].map((x) => x.toString(16).padStart(2, "0")).join("");

function safeEq(a, b) {
  a = String(a); b = String(b);
  let d = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) d |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return d === 0;
}

async function hashPw(pw, salt) {
  const k = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" }, k, 256);
  return b64(new Uint8Array(bits));
}
async function verifyPw(pw, saltB64, hashB64) {
  return safeEq(await hashPw(pw, unb64(saltB64)), hashB64);
}
function randToken() {
  return b64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
async function sha256hex(s) {
  return hex(await crypto.subtle.digest("SHA-256", enc.encode(s)));
}

// ===== payments =====
// Paymob (Accept) integration. NOTE: written from the public docs and NOT tested
// against the real service. Test it in Paymob's test mode before going live.
const encP = new TextEncoder();
const API = "https://accept.paymob.com/api";

const paymobReady = (env) =>
  !!(env.PAYMOB_API_KEY && env.PAYMOB_INTEGRATION_ID && env.PAYMOB_IFRAME_ID && env.PAYMOB_HMAC);

async function post(path, body) {
  const r = await fetch(API + path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error("paymob_" + r.status);
  return r.json();
}

async function createPayment(env, order) {
  const auth = await post("/auth/tokens", { api_key: env.PAYMOB_API_KEY });
  const amount = order.total * 100;
  const o = await post("/ecommerce/orders", {
    auth_token: auth.token, delivery_needed: false, amount_cents: amount, currency: "EGP",
    merchant_order_id: String(order.id), items: [],
  });
  const parts = String(order.name).split(" ");
  const key = await post("/acceptance/payment_keys", {
    auth_token: auth.token, amount_cents: amount, expiration: 3600, order_id: o.id, currency: "EGP",
    integration_id: Number(env.PAYMOB_INTEGRATION_ID),
    billing_data: {
      first_name: parts[0] || "NA", last_name: parts.slice(1).join(" ") || "NA", email: "na@example.com",
      phone_number: order.phone, apartment: "NA", floor: "NA", street: "NA", building: "NA",
      shipping_method: "NA", postal_code: "NA", city: "NA", country: "EG", state: "NA",
    },
  });
  return { ref: String(o.id), pay_url: `https://accept.paymob.com/api/acceptance/iframes/${env.PAYMOB_IFRAME_ID}?payment_token=${key.token}` };
}

const KEYS = ["amount_cents", "created_at", "currency", "error_occured", "has_parent_transaction", "id",
  "integration_id", "is_3d_secure", "is_auto_captured", "is_capture", "is_refunded", "is_standalone_payment",
  "is_voided", "order.id", "owner", "pending", "source_data.pan", "source_data.sub_type", "source_data.type", "success"];
const get = (o, k) => k.split(".").reduce((a, c) => (a == null ? a : a[c]), o);

async function verifyWebhook(env, obj, hmac) {
  const s = KEYS.map((k) => { const v = get(obj, k); return v == null ? "" : String(v); }).join("");
  const key = await crypto.subtle.importKey("raw", encP.encode(env.PAYMOB_HMAC), { name: "HMAC", hash: "SHA-512" }, false, ["sign"]);
  const sig = hex(await crypto.subtle.sign("HMAC", key, encP.encode(s)));
  return safeEq(sig, String(hmac).toLowerCase());
}

// ===== mail (Resend) =====
const mailReady = (env) => !!(env.RESEND_API_KEY && env.MAIL_FROM);
async function sendMail(env, { to, subject, html }) {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: env.MAIL_FROM, to: [to], subject, html }),
  });
  if (!r.ok) throw new Error("mail_" + r.status);
}

// ===== worker =====

const COOKIE = "hk_sid";
const SESSION_DAYS = 30;
const MAX_E = 20_000_000;
const HEX = /^#[0-9a-fA-F]{6}$/;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
const STATUSES = ["new", "paid", "preparing", "shipped", "done", "cancelled"];

const J = (o, s = 200, h = {}) =>
  new Response(JSON.stringify(o), {
    status: s,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...h },
  });
const E = (code, s = 400) => J({ error: code }, s);

const ip = (req) => req.headers.get("CF-Connecting-IP") || "unknown";
const str = (v, min, max) => (typeof v === "string" && v.trim().length >= min && v.trim().length <= max ? v.trim() : null);

async function readBody(req, max = 100_000) {
  const t = await req.text();
  if (t.length > max) throw E("too_large", 413);
  try {
    const o = JSON.parse(t || "{}");
    if (o === null || typeof o !== "object" || Array.isArray(o)) throw 0;
    return o;
  } catch { throw E("bad_json"); }
}

async function limit(env, key, max, ttl) {
  const k = "rl:" + key;
  const n = parseInt((await env.GIFTS.get(k)) || "0", 10);
  if (n >= max) throw E("rate_limited", 429);
  await env.GIFTS.put(k, String(n + 1), { expirationTtl: Math.max(60, ttl) });
}

function getCookie(req, name) {
  for (const p of (req.headers.get("Cookie") || "").split(/;\s*/)) {
    const i = p.indexOf("=");
    if (i > 0 && p.slice(0, i) === name) return p.slice(i + 1);
  }
  return null;
}
const cookie = (v, maxAge) => `${COOKIE}=${v}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

async function currentUser(req, env) {
  const t = getCookie(req, COOKIE);
  if (!t) return null;
  const row = await env.DB.prepare(
    "SELECT u.id,u.email,u.name,u.role,s.expires_at FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=?"
  ).bind(await sha256hex(t)).first();
  if (!row || row.expires_at < Date.now()) return null;
  return { id: row.id, email: row.email, name: row.name, role: row.role };
}

async function startSession(env, userId) {
  const token = randToken();
  const exp = Date.now() + SESSION_DAYS * 86400_000;
  await env.DB.prepare("INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)").bind(await sha256hex(token), userId, exp).run();
  await env.DB.prepare("DELETE FROM sessions WHERE expires_at<?").bind(Date.now()).run();
  return cookie(token, SESSION_DAYS * 86400);
}

function newId() {
  const b = crypto.getRandomValues(new Uint8Array(12));
  return b64(b).replace(/\+/g, "-").replace(/\//g, "_");
}

const pub = (u) => ({ id: u.id, email: u.email, name: u.name, role: u.role });
const needAdmin = (user) => { if (!user) throw E("unauthorized", 401); if (user.role !== "admin") throw E("forbidden", 403); };
const needUser = (user) => { if (!user) throw E("unauthorized", 401); };

function productInput(b) {
  const name = str(b.name, 2, 80);
  const description = typeof b.description === "string" && b.description.length <= 500 ? b.description.trim() : null;
  const price = Number.isInteger(b.price) && b.price >= 1 && b.price <= 1_000_000 ? b.price : null;
  const image = typeof b.image === "string" && (b.image === "" || (/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(b.image) && b.image.length <= 200_000)) ? b.image : null;
  const active = b.active === 0 || b.active === false ? 0 : 1;
  if (!name || description === null || price === null || image === null) return null;
  return { name, description, price, image, active };
}

async function route(req, env, ctx) {
  const url = new URL(req.url);
  const p = url.pathname;
  const m = req.method;

  if (!p.startsWith("/api/")) {
    if (/^\/g\/[A-Za-z0-9_-]{16}$/.test(p)) {
      const r = await env.ASSETS.fetch(new Request(new URL("/g", url), req));
      const h = new Headers(r.headers);
      h.set("X-Robots-Tag", "noindex"); h.set("Referrer-Policy", "no-referrer"); h.set("Cache-Control", "no-store");
      return new Response(r.body, { status: r.status, headers: h });
    }
    const r = await env.ASSETS.fetch(req);
    const h = new Headers(r.headers);
    h.set("X-Content-Type-Options", "nosniff"); h.set("X-Frame-Options", "DENY"); h.set("Referrer-Policy", "strict-origin-when-cross-origin");
    return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
  }

  if (!env.DB || !env.GIFTS) return E("not_configured", 500);
  if (p === "/api/pay/webhook" && m === "POST") return webhook(req, env, url);
  if (m !== "GET" && m !== "HEAD" && !(req.headers.get("Content-Type") || "").includes("application/json")) return E("bad_content_type", 415);

  const user = await currentUser(req, env);
  let x;

  if (p === "/api/config" && m === "GET") return J({ online: paymobReady(env), wa: env.WA_PHONE || "", mail: mailReady(env) });
  if (p === "/api/health" && m === "GET") {
    const tables = {};
    for (const t of ["users", "sessions", "gifts", "products", "orders", "email_tokens"]) {
      try { await env.DB.prepare("SELECT 1 FROM " + t + " LIMIT 1").first(); tables[t] = true; } catch { tables[t] = false; }
    }
    return J({ kv: !!env.GIFTS, tables, mail: mailReady(env), payments: paymobReady(env) });
  }
  if (p === "/api/me" && m === "GET") return J({ user: user ? pub(user) : null });

  // ---- auth
  if (p === "/api/auth/register" && m === "POST") {
    await limit(env, "reg:" + ip(req), 10, 86400);
    const b = await readBody(req);
    const name = str(b.name, 2, 60);
    const email = str(b.email, 5, 254)?.toLowerCase();
    const pw = typeof b.password === "string" ? b.password : "";
    if (!name || !email || !EMAIL.test(email)) return E("bad_input");
    if (pw.length < 8 || pw.length > 128) return E("weak_password");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const hash = await hashPw(pw, salt);
    const admin = !!(env.ADMIN_SETUP_CODE && typeof b.setup === "string" && b.setup && safeEq(b.setup, env.ADMIN_SETUP_CODE));
    let id;
    try {
      const r = await env.DB.prepare("INSERT INTO users(email,name,pw_hash,pw_salt,role,created_at) VALUES(?,?,?,?,?,?)")
        .bind(email, name, hash, b64(salt), admin ? "admin" : "user", Date.now()).run();
      id = r.meta.last_row_id;
    } catch (e) {
      if (/UNIQUE/i.test(String((e && e.message) || e))) return E("email_taken", 409);
      throw e;
    }
    return J({ user: { id, email, name, role: admin ? "admin" : "user" } }, 201, { "Set-Cookie": await startSession(env, id) });
  }
  if (p === "/api/auth/login" && m === "POST") {
    await limit(env, "login:" + ip(req), 20, 900);
    const b = await readBody(req);
    const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
    const pw = typeof b.password === "string" ? b.password : "";
    const u = await env.DB.prepare("SELECT * FROM users WHERE email=?").bind(email).first();
    const ok = u ? await verifyPw(pw, u.pw_salt, u.pw_hash) : (await hashPw(pw, new Uint8Array(16)), false);
    if (!u || !ok) return E("bad_credentials", 401);
    return J({ user: pub(u) }, 200, { "Set-Cookie": await startSession(env, u.id) });
  }
  if (p === "/api/auth/logout" && m === "POST") {
    const t = getCookie(req, COOKIE);
    if (t) await env.DB.prepare("DELETE FROM sessions WHERE token_hash=?").bind(await sha256hex(t)).run();
    return J({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
  }

  if (p === "/api/auth/forgot" && m === "POST") {
    await limit(env, "forgot:" + ip(req), 5, 3600);
    const b = await readBody(req);
    const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
    if (mailReady(env) && EMAIL.test(email)) {
      const u = await env.DB.prepare("SELECT id FROM users WHERE email=?").bind(email).first();
      if (u) {
        const token = randToken();
        await env.DB.prepare("DELETE FROM email_tokens WHERE user_id=? AND kind='reset'").bind(u.id).run();
        await env.DB.prepare("INSERT INTO email_tokens(token_hash,user_id,kind,expires_at) VALUES(?,?,?,?)")
          .bind(await sha256hex(token), u.id, "reset", Date.now() + 3600_000).run();
        const link = (env.SITE_URL || new URL(req.url).origin).replace(/\/+$/, "") + "/reset?token=" + token;
        const html = '<div dir="rtl" style="font-family:Tahoma,sans-serif;line-height:1.9">' +
          "<h2>استرجاع كلمة السر</h2><p>طلبت استرجاع كلمة السر لحسابك في حكاية حب. اضغط الزر التالي لاختيار كلمة سر جديدة (الرابط صالح ساعة واحدة):</p>" +
          '<p><a href="' + link + '" style="background:#d63a62;color:#fff;padding:10px 22px;border-radius:999px;text-decoration:none">اختيار كلمة سر جديدة</a></p>' +
          "<p>لو ماطلبتش ده، تجاهل الرسالة وحسابك آمن.</p></div>";
        ctx.waitUntil(sendMail(env, { to: email, subject: "استرجاع كلمة السر - حكاية حب", html }).catch((e) => console.error(e)));
      }
    }
    return J({ ok: true });
  }
  if (p === "/api/auth/reset" && m === "POST") {
    await limit(env, "reset:" + ip(req), 10, 3600);
    const b = await readBody(req);
    const pw = typeof b.password === "string" ? b.password : "";
    if (typeof b.token !== "string" || !/^[A-Za-z0-9_-]{20,80}$/.test(b.token)) return E("bad_token");
    if (pw.length < 8 || pw.length > 128) return E("weak_password");
    const th = await sha256hex(b.token);
    const t = await env.DB.prepare("SELECT user_id,expires_at FROM email_tokens WHERE token_hash=? AND kind='reset'").bind(th).first();
    if (!t || t.expires_at < Date.now()) return E("bad_token");
    const salt = crypto.getRandomValues(new Uint8Array(16));
    await env.DB.prepare("UPDATE users SET pw_hash=?,pw_salt=? WHERE id=?").bind(await hashPw(pw, salt), b64(salt), t.user_id).run();
    await env.DB.prepare("DELETE FROM email_tokens WHERE token_hash=?").bind(th).run();
    await env.DB.prepare("DELETE FROM sessions WHERE user_id=?").bind(t.user_id).run();
    return J({ ok: true }, 200, { "Set-Cookie": cookie("", 0) });
  }

  // ---- gifts
  if (p === "/api/gifts" && m === "POST") {
    await limit(env, "gift:" + ip(req), 20, 86400);
    const b = await readBody(req, MAX_E + 1000);
    const { E: blob, a, b: c2, U } = b;
    if (typeof blob !== "string" || blob.length < 40 || !/^[A-Za-z0-9+/=]+$/.test(blob)) return E("bad_payload");
    if (blob.length > MAX_E) return E("too_large", 413);
    if (!HEX.test(a) || !HEX.test(c2)) return E("bad_colors");
    const u = Number.isFinite(U) && U > 0 ? Math.floor(U) : 0;
    const id = newId();
    await env.GIFTS.put("g:" + id, JSON.stringify({ E: blob, a, b: c2, U: u, t: Date.now() }), { expirationTtl: 365 * 86400 });
    await env.DB.prepare("INSERT INTO gifts(id,user_id,created_at) VALUES(?,?,?)").bind(id, user ? user.id : null, Date.now()).run();
    return J({ id }, 201);
  }
  if ((x = p.match(/^\/api\/gifts\/([A-Za-z0-9_-]{16})$/))) {
    if (m === "GET") {
      const v = await env.GIFTS.get("g:" + x[1]);
      if (!v) return E("not_found", 404);
      ctx.waitUntil(env.DB.prepare("UPDATE gifts SET views=views+1 WHERE id=?").bind(x[1]).run());
      return new Response(v, { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
    }
    return E("method", 405);
  }
  if (p === "/api/my/gifts" && m === "GET") {
    needUser(user);
    const r = await env.DB.prepare("SELECT id,views,created_at FROM gifts WHERE user_id=? ORDER BY created_at DESC LIMIT 200").bind(user.id).all();
    return J({ gifts: r.results });
  }
  if ((x = p.match(/^\/api\/my\/gifts\/([A-Za-z0-9_-]{16})$/)) && m === "DELETE") {
    needUser(user);
    const g = await env.DB.prepare("SELECT user_id FROM gifts WHERE id=?").bind(x[1]).first();
    if (!g) return E("not_found", 404);
    if (g.user_id !== user.id && user.role !== "admin") return E("forbidden", 403);
    await env.GIFTS.delete("g:" + x[1]);
    await env.DB.prepare("DELETE FROM gifts WHERE id=?").bind(x[1]).run();
    return J({ ok: true });
  }

  // ---- store
  if (p === "/api/products" && m === "GET") {
    const r = await env.DB.prepare("SELECT id,name,description,price,image FROM products WHERE active=1 ORDER BY id DESC LIMIT 100").all();
    return J(r.results);
  }
  if (p === "/api/orders" && m === "POST") return createOrder(req, env, user);
  if (p === "/api/my/orders" && m === "GET") {
    needUser(user);
    const r = await env.DB.prepare("SELECT id,items,total,method,status,created_at FROM orders WHERE user_id=? ORDER BY id DESC LIMIT 100").bind(user.id).all();
    return J({ orders: r.results.map((o) => ({ ...o, items: JSON.parse(o.items) })) });
  }

  // ---- admin
  if (p.startsWith("/api/admin/")) {
    needAdmin(user);
    if (p === "/api/admin/stats" && m === "GET") {
      const c = async (q) => (await env.DB.prepare(q).first()).n;
      return J({
        users: await c("SELECT COUNT(*) n FROM users"),
        gifts: await c("SELECT COUNT(*) n FROM gifts"),
        orders: await c("SELECT COUNT(*) n FROM orders"),
        revenue: await c("SELECT COALESCE(SUM(total),0) n FROM orders WHERE status IN ('paid','preparing','shipped','done')"),
      });
    }
    if (p === "/api/admin/products" && m === "GET") {
      const r = await env.DB.prepare("SELECT * FROM products ORDER BY id DESC LIMIT 300").all();
      return J(r.results);
    }
    if (p === "/api/admin/products" && m === "POST") {
      const v = productInput(await readBody(req, 300_000));
      if (!v) return E("bad_input");
      const r = await env.DB.prepare("INSERT INTO products(name,description,price,image,active,created_at) VALUES(?,?,?,?,?,?)")
        .bind(v.name, v.description, v.price, v.image, v.active, Date.now()).run();
      return J({ id: r.meta.last_row_id }, 201);
    }
    if ((x = p.match(/^\/api\/admin\/products\/(\d+)$/))) {
      if (m === "PUT") {
        const v = productInput(await readBody(req, 300_000));
        if (!v) return E("bad_input");
        const r = await env.DB.prepare("UPDATE products SET name=?,description=?,price=?,image=?,active=? WHERE id=?")
          .bind(v.name, v.description, v.price, v.image, v.active, Number(x[1])).run();
        return r.meta.changes ? J({ ok: true }) : E("not_found", 404);
      }
      if (m === "DELETE") {
        await env.DB.prepare("DELETE FROM products WHERE id=?").bind(Number(x[1])).run();
        return J({ ok: true });
      }
    }
    if (p === "/api/admin/orders" && m === "GET") {
      const r = await env.DB.prepare("SELECT * FROM orders ORDER BY id DESC LIMIT 200").all();
      return J(r.results.map((o) => ({ ...o, items: JSON.parse(o.items) })));
    }
    if ((x = p.match(/^\/api\/admin\/orders\/(\d+)$/)) && m === "PUT") {
      const b = await readBody(req);
      if (!STATUSES.includes(b.status)) return E("bad_status");
      const r = await env.DB.prepare("UPDATE orders SET status=? WHERE id=?").bind(b.status, Number(x[1])).run();
      return r.meta.changes ? J({ ok: true }) : E("not_found", 404);
    }
  }
  return E("not_found", 404);
}

async function createOrder(req, env, user) {
  await limit(env, "order:" + ip(req), 30, 86400);
  const b = await readBody(req);
  const name = str(b.name, 2, 60);
  const phone = typeof b.phone === "string" ? b.phone.replace(/[\s-]/g, "") : "";
  const address = typeof b.address === "string" && b.address.length <= 300 ? b.address.trim() : null;
  const method = b.method === "online" ? "online" : "cod";
  if (!name || !/^\+?\d{8,15}$/.test(phone) || address === null) return E("bad_input");
  if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 20) return E("bad_items");
  if (method === "online" && !paymobReady(env)) return E("online_unavailable");
  const lines = []; let total = 0;
  for (const it of b.items) {
    const id = it && it.id, qty = it && it.qty;
    if (!Number.isInteger(id) || !Number.isInteger(qty) || qty < 1 || qty > 20) return E("bad_items");
    const pr = await env.DB.prepare("SELECT id,name,price FROM products WHERE id=? AND active=1").bind(id).first();
    if (!pr) return E("bad_items");
    lines.push({ id: pr.id, name: pr.name, price: pr.price, qty });
    total += pr.price * qty;
  }
  const r = await env.DB.prepare("INSERT INTO orders(user_id,name,phone,address,items,total,method,created_at) VALUES(?,?,?,?,?,?,?,?)")
    .bind(user ? user.id : null, name, phone, address, JSON.stringify(lines), total, method, Date.now()).run();
  const id = r.meta.last_row_id;
  if (method === "online") {
    try {
      const pay = await createPayment(env, { id, total, name, phone });
      await env.DB.prepare("UPDATE orders SET pay_ref=? WHERE id=?").bind(pay.ref, id).run();
      return J({ order_id: id, total, pay_url: pay.pay_url }, 201);
    } catch {
      await env.DB.prepare("UPDATE orders SET status='cancelled' WHERE id=?").bind(id).run();
      return E("payment_failed", 502);
    }
  }
  return J({ order_id: id, total }, 201);
}

async function webhook(req, env, url) {
  if (!paymobReady(env)) return E("not_configured", 503);
  let b; try { b = await req.json(); } catch { return E("bad_json"); }
  const obj = b && b.obj;
  if (!obj || typeof obj !== "object") return E("bad_payload");
  if (!(await verifyWebhook(env, obj, url.searchParams.get("hmac") || ""))) return E("bad_hmac", 401);
  const oid = parseInt(obj.order && obj.order.merchant_order_id, 10);
  if (obj.success === true && obj.pending !== true && Number.isInteger(oid)) {
    const o = await env.DB.prepare("SELECT total,status FROM orders WHERE id=?").bind(oid).first();
    if (o && o.status === "new" && obj.amount_cents === o.total * 100)
      await env.DB.prepare("UPDATE orders SET status='paid' WHERE id=? AND status='new'").bind(oid).run();
  }
  return J({ ok: true });
}

export default {
  async fetch(req, env, ctx) {
    try { return await route(req, env, ctx); }
    catch (e) {
      if (e instanceof Response) return e;
      console.error(e);
      return J({ error: "server_error", ...(env.DEBUG === "1" ? { detail: String((e && e.message) || e).slice(0, 200) } : {}) }, 500);
    }
  },
};

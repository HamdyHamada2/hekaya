const $ = (s, r = document) => r.querySelector(s);
function h(t, a, ...k) {
  const e = document.createElement(t);
  for (const [x, v] of Object.entries(a || {})) {
    if (x === "class") e.className = v; else if (x.startsWith("on")) e[x] = v; else e.setAttribute(x, v);
  }
  for (const c of k.flat()) if (c != null && c !== false) e.append(c.nodeType ? c : document.createTextNode(c));
  return e;
}
async function api(path, method = "GET", body) {
  const o = { method, credentials: "same-origin", headers: {} };
  if (method !== "GET") { o.headers["Content-Type"] = "application/json"; o.body = JSON.stringify(body || {}); }
  const r = await fetch("/api" + path, o);
  let j = null; try { j = await r.json(); } catch (e) {}
  if (j && j.detail) window.__detail = j.detail;
  if (!r.ok || j === null) throw Object.assign(new Error((j && j.error) || (r.status === 404 || j === null ? "no_api" : "error")), { status: r.status });
  return j;
}
const ERR = {
  bad_credentials: "الإيميل أو كلمة السر غلط", email_taken: "الإيميل ده مسجل قبل كده",
  weak_password: "كلمة السر لازم تكون 8 حروف على الأقل", bad_input: "راجع البيانات المكتوبة",
  rate_limited: "محاولات كتير، جرّب بعد شوية", bad_items: "فيه منتج في السلة مش متاح، حدّث الصفحة",
  online_unavailable: "الدفع الأونلاين مش متاح دلوقتي", payment_failed: "تعذر بدء الدفع، جرّب تاني أو اختار الدفع عند الاستلام",
  unauthorized: "لازم تسجّل دخول الأول", forbidden: "مش مسموح لك بالعملية دي", not_configured: "السيرفر لسه مش متظبط",
  too_large: "الحجم كبير جدًا",
  server_error: "قاعدة البيانات مش جاهزة. نفّذ ملف schema.sql في D1 Console.",
  no_api: "السيرفر مش شغال على الموقع. راجع إن الـ Worker منشور ومربوط بالـ KV وD1.",
};
const msg = (c) => (ERR[c] || "حصل خطأ، جرّب تاني.") + (c === "server_error" && window.__detail ? " [" + window.__detail + "]" : "");
const date = (ms) => new Date(ms).toLocaleDateString("ar-EG");
async function mountHeader() {
  const nav = h("nav", {}, h("a", { href: "/" }, "الرئيسية"), h("a", { href: "/store" }, "المتجر"), h("a", { href: "/account" }, "حسابي"));
  for (const a of nav.querySelectorAll("a")) if (a.getAttribute("href") === location.pathname) a.className = "on";
  $("#hdr").replaceWith(h("header", { class: "top" }, h("a", { class: "logo", href: "/" }, "حكاية حب"), nav));
  try {
    const r = await api("/me");
    if (r.user && r.user.role === "admin") nav.append(h("a", { href: "/admin", class: location.pathname === "/admin" ? "on" : "" }, "الإدارة"));
    return r.user;
  } catch (e) { return null; }
}
function compressImage(file, max, cb, fail) {
  const im = new Image(), u = URL.createObjectURL(file);
  im.onload = () => {
    const s = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement("canvas");
    c.width = Math.round(im.width * s); c.height = Math.round(im.height * s);
    c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
    URL.revokeObjectURL(u); cb(c.toDataURL("image/jpeg", 0.7));
  };
  im.onerror = fail; im.src = u;
}

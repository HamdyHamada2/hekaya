/* Hekaya Hob shell: header, mobile tab bar, footer and AR/EN i18n (shared by all pages) */
(function () {
  if (window.HK) return;
  const D = {
    ar: {
      nav_home: "الرئيسية", nav_studio: "اصنع هديتك", nav_quiz: "تعرفني قد إيه؟", nav_offers: "العروض", nav_store: "المتجر", nav_account: "حسابي", nav_admin: "الإدارة",
      lang_btn: "English", foot_tag: "اصنع لحظة، مش رسالة.", foot_priv: "الهدايا تتصنع وتتشفّر داخل جهازك، وكلمة السر ما بتتبعتش لأي سيرفر.", foot_rights: "جميع الحقوق محفوظة",
      meta_title: "حكاية حب | هدايا رقمية فاخرة", meta_desc: "اصنع هدية رقمية مشفّرة بكلمة سر: رسالتك وصورك وصوتك وموسيقاك في رابط واحد تتفتح بلحظة سينمائية.",
      h_kicker: "هدايا رقمية فاخرة", h_title: "اصنع لحظة، مش رسالة",
      h_lead: "هدية مشفّرة بكلمة سر بتتفتح بلحظة سينمائية: رسالتك وصورك وصوتك وموسيقاك، في رابط واحد تبعته لمن تحب.",
      h_cta1: "اصنع هديتك", h_cta2: "شوف الأفكار", h_t1: "تشفير AES داخل جهازك", h_t2: "تبدأ من غير حساب", h_t3: "يفتح على أي متصفح",
      how_title: "إزاي بتشتغل؟", how_sub: "ثلاث خطوات وهديتك جاهزة.",
      s1_t: "اكتب وأضف", s1_d: "رسالة، صورة، تسجيل بصوتك، وموسيقى.", s2_t: "اقفلها بكلمة سر", s2_d: "الهدية بتتشفّر قبل ما تخرج من جهازك.", s3_t: "ابعتها وشوف اللحظة", s3_d: "رابط أو ملف أو كود QR.",
      ideas_title: "لكل مناسبة حكاية", ideas_sub: "اختار مناسبة وابدأ.",
      i_birthday: "عيد ميلاد", i_love: "عيد الحب", i_wedding: "خطوبة وزواج", i_mother: "عيد الأم", i_sorry: "مصالحة", i_grad: "تخرج",
      feat_title: "كل أدوات الحكاية", feat_sub: "أكتر من مجرد رسالة.",
      f_build_t: "صانع الهدايا", f_build_d: "رسالة وصورة وصوت وكلمة سر، وكبسولة زمن.",
      f_ai_t: "كاتب رسائل الحب", f_ai_d: "اقتراحات رسائل بنبرة تختارها.",
      f_treasure_t: "كنز الحب", f_treasure_d: "ألغاز عن ذكرياتكم تفتح الهدية.",
      f_wed_t: "دعوة فرح", f_wed_d: "عدّ تنازلي وخريطة وردّ بالحضور.",
      f_quiz_t: "تعرفني قد إيه؟", f_quiz_d: "اختبار تبعته وتشوف نتيجة اللي جاوب.",
      f_wheel_t: "عجلة الحظ", f_wheel_d: "لفّة كل يوم وكوبون خصم.",
      f_qr_t: "كود QR", f_qr_d: "حوّل أي رابط لكود تطبعه.",
      f_store_t: "المتجر", f_store_d: "هدايا ومنتجات للتوصيل.",
      offer_t: "عجلة الحظ كل يوم", offer_d: "لفّ واكسب كوبون خصم لحد 20% على طلبك.", offer_cta: "جرّب حظك",
      faq_title: "أسئلة شائعة",
      q1: "هل هديتي آمنة؟", a1: "لو حطيت كلمة سر، المحتوى بيتشفّر في جهازك بتشفير AES. اختار كلمة طويلة، ولو نسيتها مفيش طريقة لاسترجاعها.",
      q2: "هل هي مجانية؟", a2: "صنع الهدية وتنزيلها مجاني. الروابط المحفوظة على السيرفر لها حد يومي، والمنتجات في المتجر بأسعارها.",
      q3: "إزاي أبعتها؟", a3: "بتبعتها كرابط أو ملف أو كود QR، وكلمة السر في رسالة منفصلة.",
      q4: "محتاج حساب؟", a4: "لا، تقدر تصنع هدية من غير حساب. الحساب بيفيدك في متابعة هداياك وطلباتك.",
      cta_t: "جاهز تصنع لحظتك؟", cta_d: "ابدأ دلوقتي، ومش هتاخد دقايق.", cta_btn: "اصنع هديتك",
    },
    en: {
      nav_home: "Home", nav_studio: "Create a gift", nav_quiz: "How well do you know me?", nav_offers: "Offers", nav_store: "Store", nav_account: "Account", nav_admin: "Admin",
      lang_btn: "عربي", foot_tag: "Create a moment, not a message.", foot_priv: "Gifts are built and encrypted on your device. Your password is never sent to any server.", foot_rights: "All rights reserved",
      meta_title: "Hekaya Hob | Luxury digital gifts", meta_desc: "Create an encrypted, password-protected digital gift: your words, photos, voice and music in one link that opens like a movie moment.",
      h_kicker: "Luxury digital gifts", h_title: "Create a moment, not a message",
      h_lead: "An encrypted, password-protected gift that opens like a movie moment: your words, photos, voice and music in one link to send to someone you love.",
      h_cta1: "Create your gift", h_cta2: "Explore ideas", h_t1: "AES encryption on your device", h_t2: "Start without an account", h_t3: "Opens in any browser",
      how_title: "How it works", how_sub: "Three steps and your gift is ready.",
      s1_t: "Write & add", s1_d: "A message, a photo, your own voice and music.", s2_t: "Lock it with a password", s2_d: "The gift is encrypted before it leaves your device.", s3_t: "Send it and watch the moment", s3_d: "A link, a file or a QR code.",
      ideas_title: "A story for every occasion", ideas_sub: "Pick an occasion and begin.",
      i_birthday: "Birthday", i_love: "Valentine's", i_wedding: "Engagement & wedding", i_mother: "Mother's Day", i_sorry: "Apology", i_grad: "Graduation",
      feat_title: "Everything for your story", feat_sub: "So much more than a message.",
      f_build_t: "Gift builder", f_build_d: "Message, photo, voice, password and a time capsule.",
      f_ai_t: "Love-letter writer", f_ai_d: "Message suggestions in the tone you choose.",
      f_treasure_t: "Love treasure hunt", f_treasure_d: "Riddles about your memories unlock the gift.",
      f_wed_t: "Wedding invitation", f_wed_d: "Countdown, map and RSVP.",
      f_quiz_t: "How well do you know me?", f_quiz_d: "A quiz you send, with the results.",
      f_wheel_t: "Lucky wheel", f_wheel_d: "A daily spin and a discount coupon.",
      f_qr_t: "QR codes", f_qr_d: "Turn any link into a printable code.",
      f_store_t: "Store", f_store_d: "Gifts and products, delivered.",
      offer_t: "Spin the wheel every day", offer_d: "Spin and win a coupon of up to 20% off your order.", offer_cta: "Try your luck",
      faq_title: "FAQ",
      q1: "Is my gift safe?", a1: "If you set a password, the content is encrypted on your device with AES. Choose a long password; if you forget it, it cannot be recovered.",
      q2: "Is it free?", a2: "Creating and downloading a gift is free. Links stored on the server have a daily limit, and store products are priced as listed.",
      q3: "How do I send it?", a3: "Send it as a link, a file or a QR code, and share the password in a separate message.",
      q4: "Do I need an account?", a4: "No, you can create a gift without one. An account helps you track your gifts and orders.",
      cta_t: "Ready to create your moment?", cta_d: "Start now. It takes only minutes.", cta_btn: "Create your gift",
    },
  };
  let lang = "ar";
  try { const s = localStorage.getItem("hk_lang"); if (s === "en" || s === "ar") lang = s; } catch (e) {}
  const t = (k) => (D[lang] && D[lang][k]) || D.ar[k] || k;
  const dirOf = (l) => (l === "ar" ? "rtl" : "ltr");
  const IC = {
    home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    gift: "M20 12v9H4v-9M2 7h20v5H2zM12 22V7M12 7H7.5a2.5 2.5 0 1 1 0-5C11 2 12 7 12 7zM12 7h4.5a2.5 2.5 0 1 0 0-5C13 2 12 7 12 7z",
    star: "M12 2l3 7h7l-5.5 4.5 2 7.5L12 17l-6.5 4 2-7.5L2 9h7z",
    bag: "M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0",
    user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  };
  const LINKS = [["/", "nav_home", "home"], ["/studio", "nav_studio", "gift"], ["/wheel", "nav_offers", "star"], ["/store", "nav_store", "bag"], ["/account", "nav_account", "user"]];
  const path = location.pathname.replace(/\/+$/, "") || "/";
  const isOn = (href) => (href === "/account" ? path === "/account" || path === "/admin" : href === "/" ? path === "/" || path === "/index.html" : path === href);
  const svg = (d) => '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + d + '"/></svg>';
  const LOGO = '<svg viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="hkg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6e6a6"/><stop offset="1" stop-color="#a8832a"/></linearGradient></defs><path d="M16 28S4 20.5 4 12.2A6.2 6.2 0 0 1 16 9.6a6.2 6.2 0 0 1 12 2.6C28 20.5 16 28 16 28z" fill="url(#hkg)"/><path d="M11 13h10M16 9.6V20" stroke="#0b0a08" stroke-width="1.6" stroke-linecap="round"/></svg>';
  let top, tabs, foot, admin = false;

  function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

  function build() {
    const head = document.head;
    if (!document.querySelector('link[data-hk-fonts]')) {
      const l = el("link"); l.rel = "stylesheet"; l.setAttribute("data-hk-fonts", "1");
      l.href = "https://fonts.googleapis.com/css2?family=Amiri:wght@700&family=Inter:wght@400;500;600&family=Playfair+Display:wght@600;700&family=Tajawal:wght@400;500;700&display=swap";
      head.appendChild(l);
    }
    if (!document.querySelector('meta[name="theme-color"]')) { const m = el("meta"); m.name = "theme-color"; m.content = "#0b0a08"; head.appendChild(m); }
    top = el("header", "hk-top"); tabs = el("nav", "hk-tabs"); foot = el("footer", "hk-footer");
    tabs.setAttribute("aria-label", "Main");
    const ph = document.getElementById("hdr");
    if (ph) ph.replaceWith(top); else document.body.prepend(top);
    document.body.append(tabs, foot);
  }

  function render() {
    const ld = dirOf(lang);
    [top, tabs, foot].forEach((e) => { e.setAttribute("dir", ld); e.setAttribute("lang", lang); });
    const nav = LINKS.concat([["/quiz", "nav_quiz", "star"]]).filter((x) => x[0] !== "/account" || true);
    const order = ["/", "/studio", "/quiz", "/wheel", "/store", "/account"];
    const sorted = order.map((h) => nav.find((x) => x[0] === h));
    top.innerHTML = '<div class="hk-in"><a class="hk-logo" href="/">' + LOGO + '<span>' + (lang === "ar" ? "حكاية حب" : "Hekaya Hob") + '</span></a>' +
      '<nav class="hk-nav" aria-label="Main">' + sorted.map((x) => '<a href="' + x[0] + '"' + (isOn(x[0]) ? ' class="on" aria-current="page"' : "") + ">" + t(x[1]) + "</a>").join("") + (admin ? '<a href="/admin"' + (path === "/admin" ? ' class="on"' : "") + ">" + t("nav_admin") + "</a>" : "") + "</nav>" +
      '<button class="hk-lang" type="button" id="hk-lang">' + t("lang_btn") + "</button></div>";
    tabs.innerHTML = LINKS.map((x) => '<a href="' + x[0] + '"' + (isOn(x[0]) ? ' class="on" aria-current="page"' : "") + ">" + svg(IC[x[2]]) + "<span>" + t(x[1]) + "</span></a>").join("");
    foot.innerHTML = '<div class="hk-fin"><div class="hk-logo" style="font-size:20px">' + LOGO + "<span>" + (lang === "ar" ? "حكاية حب" : "Hekaya Hob") + "</span></div><div>" + t("foot_tag") + "</div>" +
      '<div class="hk-flinks"><a href="/studio">' + t("nav_studio") + '</a><a href="/store">' + t("nav_store") + '</a><a href="/quiz">' + t("nav_quiz") + '</a><a href="/wheel">' + t("nav_offers") + '</a><a href="/account">' + t("nav_account") + "</a></div>" +
      "<div>" + t("foot_priv") + "</div><div dir=\"ltr\">© 2026 " + (lang === "ar" ? "حكاية حب" : "Hekaya Hob") + " — " + t("foot_rights") + " · Eng: Hamdy Hamada</div></div>";
    document.getElementById("hk-lang").onclick = () => HK.setLang(lang === "ar" ? "en" : "ar");
  }

  function apply() {
    const ready = document.body && document.body.hasAttribute("data-i18n-page");
    const root = document.documentElement;
    root.lang = ready ? lang : "ar";
    root.dir = ready ? dirOf(lang) : "rtl";
    document.querySelectorAll("[data-i18n]").forEach((e) => { e.textContent = t(e.getAttribute("data-i18n")); });
    document.querySelectorAll("[data-i18n-ph]").forEach((e) => { e.setAttribute("placeholder", t(e.getAttribute("data-i18n-ph"))); });
    document.querySelectorAll("[data-i18n-content]").forEach((e) => { e.setAttribute("content", t(e.getAttribute("data-i18n-content"))); });
    const ti = document.querySelector("title[data-i18n]"); if (ti) document.title = t(ti.getAttribute("data-i18n"));
  }

  window.HK = {
    t, get lang() { return lang; },
    setLang(l) {
      if (l !== "ar" && l !== "en") return;
      lang = l; try { localStorage.setItem("hk_lang", l); } catch (e) {}
      render(); apply(); document.dispatchEvent(new CustomEvent("hk:lang", { detail: l }));
    },
    setUser(u) { const a = !!(u && u.role === "admin"); if (a !== admin) { admin = a; render(); } },
  };

  function init() { build(); render(); apply(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init); else init();
})();

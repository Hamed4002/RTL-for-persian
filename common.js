// ======================== RTL Smart Companion - Shared Engine ========================
// این فایل مشترک توسط تمام اسکریپت‌های اختصاصی هر هوش مصنوعی استفاده می‌شود.
// هر فایل site (مثل chatgpt.js) قبل از این فایل، متغیر window.__RTL_CONFIG__ را ست می‌کند.

(function () {
  const CFG = window.__RTL_CONFIG__;
  if (!CFG) return; // اگه کانفیگ ست نشده بود، کاری نکن

  // ======================== ثابت‌ها ========================
  // آستانه پایین‌تر عمداً انتخاب شده: توی متن فنی فارسی معمولاً چند تا کلمه/اصطلاح
  // انگلیسی (مثل Repository, Branch, Step) وسط جمله میاد؛ اگه آستانه بالا باشه،
  // همچین جمله‌هایی اشتباهی ltr تشخیص داده می‌شن با اینکه از نظر خواننده فارسی، rtl هستن.
  // مثال: «9. Fetch upstream چیست؟» فقط ۲۲٪ فارسیه ولی باید rtl بشه.
  const PERSIAN_WEIGHT_PERCENTAGE = 20;
  const persianRegex =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  const skipRegex = /[\d\s\u200E\u200F\u200B#@$%^&*()\-+=_{}[\]\\|:;"'<>,.?/~`!]/;
  const emojiRegex = /[\p{Emoji}\p{Emoji_Presentation}]/u;

  const RESPONSE_SELECTOR = CFG.responseSelector;
  const INPUT_SELECTOR = CFG.inputSelector;
  const TABLE_SELECTOR = CFG.tableSelector || "table";
  const PROTECTED_EXTRA_SELECTOR = CFG.protectedSelector || "";

  const PROTECTED_TAGS = new Set([
    "code",
    "pre",
    "script",
    "style",
    "noscript",
    "svg",
    "math",
  ]);
  const PROTECTED_CLASSES = [
    "katex",
    "katex-display",
    "katex-html",
    "katex-mathml",
    "MathJax",
    "mjx-container",
    "md-code-block",
    "hljs",
    "shiki",
    "monaco-editor",
    "cm-editor",
  ].concat(CFG.extraProtectedClasses || []);

  // ======================== state ========================
  let rtlEnabled = false;
  let observer = null;
  let fontInjected = false;
  let inputListenerAttached = false;
  let isFixing = false;

  const dirCache = new WeakMap();
  const fixedNodes = new WeakSet();
  // المان‌هایی که یه بار isProtected() چک شدن و protected نبودن - دیگه لازم نیست
  // هر بار fixAll زنجیره‌ی والدینشون رو دوباره پیمایش کنیم (ancestor chain walk گرونه)
  const knownSafeNodes = new WeakSet();

  function quickHash(str) {
    let h = 0;
    const len = Math.min(str.length, 200);
    for (let i = 0; i < len; i++) {
      h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
    }
    return h;
  }

  function isProtected(el) {
    let node = el;
    while (node && node !== document.body) {
      const tag = node.tagName && node.tagName.toLowerCase();
      if (PROTECTED_TAGS.has(tag)) return true;
      if (node.classList) {
        for (const cls of PROTECTED_CLASSES) {
          if (node.classList.contains(cls)) return true;
        }
      }
      node = node.parentElement;
    }
    return false;
  }

  let _segmenter = null;
  let _segmenterTried = false;
  function getSegmenter() {
    if (_segmenterTried) return _segmenter;
    _segmenterTried = true;
    try {
      _segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
    } catch (e) {
      _segmenter = null;
    }
    return _segmenter;
  }

  function detectDirection(text) {
    if (!text || text.length === 0) return "ltr";
    if (text.length > 1200) text = text.slice(0, 1200);

    let persianCount = 0;
    let nonPersianCount = 0;

    const segmenter = getSegmenter();
    const segments = segmenter
      ? [...segmenter.segment(text)].map((s) => s.segment)
      : [...text];

    for (const char of segments) {
      if (emojiRegex.test(char)) continue;
      if (skipRegex.test(char)) continue;
      if (persianRegex.test(char)) persianCount++;
      else nonPersianCount++;
    }

    const total = persianCount + nonPersianCount;
    if (total > 0 && (persianCount / total) * 100 > PERSIAN_WEIGHT_PERCENTAGE) {
      return "rtl";
    }

    for (const char of segments) {
      if (emojiRegex.test(char)) continue;
      if (skipRegex.test(char)) continue;
      return persianRegex.test(char) ? "rtl" : "ltr";
    }

    return "ltr";
  }

  function processElement(el) {
    const text = (el.textContent || "").trim();
    if (!text) return;

    const hash = quickHash(text);
    const cached = dirCache.get(el);
    if (cached && cached.hash === hash) return;

    const dir = detectDirection(text);
    const hasPersian = persianRegex.test(text);
    dirCache.set(el, { dir, hash, hasPersian });

    el.setAttribute("dir", dir);
    el.classList.toggle("rtl-smart-rtl", dir === "rtl");
    // حتی وقتی جهت کلی جمله ltr می‌مونه (چون فارسی‌ش کمتر از آستانه است)،
    // اگه حداقل یک حرف فارسی داشته باشه، فقط فونتش عوض می‌شه - بدون دست‌زدن
    // به جهت/ترتیب متن، پس هیچ ریسکی برای بهم‌ریختن چیدمان نداره
    el.classList.toggle("rtl-smart-has-persian", hasPersian && dir !== "rtl");
    el.classList.toggle("rtl-smart-ltr", dir === "ltr");
  }

  // ======================== متن فارسی داخل فرمول (KaTeX \text{...}) ========================
  // KaTeX خروجی \text{...} را همیشه به‌صورت <span class="mord text"><span class="mord">...</span></span>
  // رندر می‌کنه - این الگو در همه‌ی سایت‌ها (chatgpt/claude/deepseek/gemini/qwen) یکسانه.
  // فقط همین span داخلی rtl و فونت‌دار می‌شه، نه کل فرمول (که باید ltr بمونه تا اعداد/نمادها خراب نشن).
  function fixKatexText() {
    document.querySelectorAll(".katex .mord.text").forEach((el) => {
      const text = (el.textContent || "").trim();
      if (!text) return;

      const hash = quickHash(text);
      const cached = dirCache.get(el);
      if (cached && cached.hash === hash) return;

      const dir = detectDirection(text);
      dirCache.set(el, { dir, hash });

      if (dir === "rtl") {
        el.setAttribute("dir", "rtl");
        el.classList.add("rtl-smart-math-text");
      } else {
        el.removeAttribute("dir");
        el.classList.remove("rtl-smart-math-text");
      }
    });
  }

  function fixAll() {
    if (!rtlEnabled || isFixing) return;
    isFixing = true;

    try {
      document.querySelectorAll(RESPONSE_SELECTOR).forEach((el) => {
        if (fixedNodes.has(el)) return;

        if (!knownSafeNodes.has(el)) {
          if (isProtected(el)) {
            fixedNodes.add(el);
            el.setAttribute("dir", "ltr");
            return;
          }
          knownSafeNodes.add(el);
        }

        processElement(el);
      });

      // این‌ها همیشه باید LTR بمونن: کد، ادیتورها، و کل ظرفِ فرمول KaTeX
      // (فرمول کلاً LTR نگه داشته می‌شه تا توان/کسر/ریشه هرگز بهم نریزه؛
      // فقط تکه‌های متن فارسی داخلش با fixKatexText جداگانه RTL و فونت‌دار می‌شن)
      const alwaysLtrSel =
        ".katex,.katex-display,.katex-html,.katex-mathml,.MathJax,.mjx-container,.md-code-block,pre,code,.monaco-editor,.cm-editor" +
        (PROTECTED_EXTRA_SELECTOR ? "," + PROTECTED_EXTRA_SELECTOR : "");
      document.querySelectorAll(alwaysLtrSel).forEach((el) => {
        if (el.getAttribute("dir") !== "ltr") {
          el.setAttribute("dir", "ltr");
        }
      });

      fixTables();
      fixInputs();
      fixKatexText();
    } finally {
      isFixing = false;
    }
  }

  function fixTables() {
    document.querySelectorAll(TABLE_SELECTOR).forEach((table) => {
      if (table.closest("pre, .md-code-block, .monaco-editor")) return;

      const text = (table.textContent || "").trim();
      if (!text) return;

      const hash = quickHash(text);
      const cached = dirCache.get(table);
      if (cached && cached.hash === hash) return;

      const dir = detectDirection(text);
      dirCache.set(table, { dir, hash });
      table.setAttribute("dir", dir);
      table.dataset.rtlManaged = "1";

      table.querySelectorAll("th, td").forEach((cell) => {
        if (dir === "rtl") {
          cell.style.setProperty(
            "font-family",
            "'Estedad', 'Vazir', 'Tahoma', sans-serif",
            "important"
          );
          cell.style.setProperty("text-align", "right", "important");
          cell.style.setProperty("direction", "rtl", "important");
          cell.dataset.rtlManaged = "1";
        } else {
          cell.style.removeProperty("font-family");
          cell.style.removeProperty("text-align");
          cell.style.removeProperty("direction");
          delete cell.dataset.rtlManaged;
        }
      });
    });
  }

  function fixInputs() {
    document.querySelectorAll(INPUT_SELECTOR).forEach((el) => {
      const text =
        el.tagName === "TEXTAREA" || el.tagName === "INPUT"
          ? el.value || ""
          : el.textContent || "";
      const dir = detectDirection(text.trim());
      // فقط اگه واقعاً تغییر کرده بنویس - می‌گیره‌ی یه‌سری reflow اضافه در طول تایپ/استریم
      if (el.getAttribute("dir") !== dir) {
        el.setAttribute("dir", dir);
      }
      if (el.dataset.rtlManaged !== "1") {
        el.dataset.rtlManaged = "1";
      }
    });
  }

  function injectFont() {
    if (fontInjected || document.getElementById("rtl-smart-style")) return;

    const regularURL = chrome.runtime.getURL("fonts/Estedad-Regular.woff2");
    const boldURL = chrome.runtime.getURL("fonts/Estedad-Bold.woff2");

    if (
      !regularURL.startsWith("chrome-extension://") ||
      !boldURL.startsWith("chrome-extension://")
    )
      return;

    const css = `
      @font-face {
        font-family: 'Estedad';
        src: url('${regularURL}') format('woff2');
        font-weight: 100 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'Estedad';
        src: url('${boldURL}') format('woff2');
        font-weight: 500 900;
        font-style: normal;
        font-display: swap;
      }
      .rtl-smart-rtl,
      [dir="rtl"] {
        font-family: 'Estedad', 'Vazir', 'Tahoma', sans-serif !important;
      }
      /* جمله‌هایی که جهت‌شون ltr مونده ولی چند حرف فارسی دارن - فقط فونت عوض می‌شه،
         جهت/چیدمان دست‌نخورده می‌مونه */
      .rtl-smart-has-persian {
        font-family: 'Estedad', 'Vazir', 'Tahoma', sans-serif !important;
      }
      .rtl-smart-rtl,
      [dir="rtl"].rtl-smart-rtl,
      textarea[dir="rtl"],
      input[dir="rtl"],
      [contenteditable][dir="rtl"],
      [role="textbox"][dir="rtl"] {
        direction: rtl !important;
        text-align: right !important;
        line-height: 1.8 !important;
      }
      table[dir="rtl"] { direction: rtl !important; }
      table[dir="rtl"] th, table[dir="rtl"] td {
        font-family: 'Estedad', 'Vazir', 'Tahoma', sans-serif !important;
        text-align: right !important;
        direction: rtl !important;
      }
      /* یه قانون قدیمی این‌جا unicode-bidi:plaintext می‌ذاشت تا مرورگر خودش
         جهت رو بر اساس اولین حرف تایپ‌شده تشخیص بده. این با تشخیص جهتِ خودمون
         (که بر اساس کل متن و با هر keystroke دوباره محاسبه می‌شه) تضاد داشت:
         اگه اولین حرف انگلیسی بود، مرورگر جهت رو رو ltr قفل می‌کرد و با فارسیِ
         بعدی هم عوض نمی‌شد - نتیجه‌اش جابه‌جایی عجیب کلمه‌ی انگلیسی بود.
         حذفش کردیم تا فقط attribute dir که خودمون real-time ست می‌کنیم حاکم باشه. */
      .katex, .katex-display, .katex-mathml, .katex-html, .MathJax, .mjx-container,
      pre, code, .md-code-block, .monaco-editor, .cm-editor {
        direction: ltr !important;
        unicode-bidi: isolate !important;
      }
      /* حروف فارسی داخل کد/کامنت/رشته: فونت مونواسپیس اصلی برای حروف انگلیسی/نماد
         حفظ می‌شه، فقط حروفی که این فونت‌ها گلیف فارسی ندارن (یعنی خودِ حروف فارسی)
         خودکار میره سراغ Estedad - این یه fallback خالص CSS هست، هیچ چیزی
         reorder یا reverse نمی‌شه، پس صددرصد امنه */
      pre, code, .md-code-block, .monaco-editor, .cm-editor {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas,
          "Liberation Mono", "Courier New", 'Estedad', monospace !important;
      }
      /* متن فارسی داخل \text{...} فرمول: فقط فونت و جهت خودِ این تکه عوض می‌شه،
         بقیه فرمول (اعداد، نمادها، توان، کسر، ریشه) دست‌نخورده می‌مونه */
      .katex .mord.text.rtl-smart-math-text,
      .katex .mord.text[dir="rtl"] {
        font-family: 'Estedad', 'Vazir', 'Tahoma', sans-serif !important;
        unicode-bidi: isolate !important;
      }
      [dir="rtl"] code {
        direction: ltr !important;
        unicode-bidi: isolate !important;
      }
      [dir="rtl"] pre {
        direction: ltr !important;
        text-align: left !important;
        unicode-bidi: isolate !important;
        display: block !important;
      }
      ${CFG.extraCSS || ""}
    `;

    const style = document.createElement("style");
    style.id = "rtl-smart-style";
    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
    fontInjected = true;
  }

  function removeFont() {
    const el = document.getElementById("rtl-smart-style");
    if (el) el.remove();
    fontInjected = false;
  }

  function attachInputListeners() {
    if (inputListenerAttached) return;
    inputListenerAttached = true;

    document.addEventListener(
      "input",
      (e) => {
        if (!rtlEnabled) return;
        const el = e.target;
        if (!el) return;
        const tag = el.tagName;
        const ce = el.getAttribute("contenteditable");
        if (
          tag === "TEXTAREA" ||
          tag === "INPUT" ||
          ce === "true" ||
          ce === "plaintext-only" ||
          ce === "" ||
          el.getAttribute("role") === "textbox"
        ) {
          const text =
            tag === "TEXTAREA" || tag === "INPUT"
              ? el.value || ""
              : el.textContent || "";
          el.setAttribute("dir", detectDirection(text.trim()));
          el.dataset.rtlManaged = "1";
        }
      },
      true
    );

    document.addEventListener(
      "paste",
      (e) => {
        if (!rtlEnabled) return;
        setTimeout(() => {
          const el = e.target;
          if (!el) return;
          const ce = el.getAttribute("contenteditable");
          if (el.tagName === "TEXTAREA" || ce) {
            const text =
              el.tagName === "TEXTAREA" ? el.value || "" : el.textContent || "";
            el.setAttribute("dir", detectDirection(text.trim()));
          }
        }, 50);
      },
      true
    );
  }

  let scanTimer = null;

  function startObserver() {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
      if (!rtlEnabled || isFixing) return;

      let relevant = false;
      for (const mut of mutations) {
        if (mut.type === "childList" && mut.addedNodes.length > 0) {
          for (const node of mut.addedNodes) {
            if (node.nodeType === 1 || node.nodeType === 3) {
              relevant = true;
              break;
            }
          }
        } else if (mut.type === "characterData") {
          const txt = mut.target && mut.target.textContent;
          if (txt && txt.trim().length > 5) {
            relevant = true;
          }
        }
        if (relevant) break;
      }

      if (relevant) {
        clearTimeout(scanTimer);
        scanTimer = setTimeout(fixAll, 200);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
  }

  function stopObserver() {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    clearTimeout(scanTimer);
  }

  function enableRTL() {
    if (rtlEnabled) return;
    rtlEnabled = true;
    injectFont();
    attachInputListeners();
    fixAll();
    startObserver();
  }

  function disableRTL() {
    if (!rtlEnabled) return;
    rtlEnabled = false;
    stopObserver();

    document.querySelectorAll(".rtl-smart-rtl, .rtl-smart-ltr").forEach((el) => {
      el.classList.remove("rtl-smart-rtl", "rtl-smart-ltr");
    });
    document.querySelectorAll(".rtl-smart-has-persian").forEach((el) => {
      el.classList.remove("rtl-smart-has-persian");
    });
    document.querySelectorAll(".rtl-smart-math-text").forEach((el) => {
      el.classList.remove("rtl-smart-math-text");
      el.removeAttribute("dir");
    });
    document
      .querySelectorAll(
        ".katex, .katex-display, .katex-html, .katex-mathml, .MathJax, .mjx-container, .md-code-block, pre, code, .monaco-editor, .cm-editor"
      )
      .forEach((el) => {
        el.removeAttribute("dir");
      });
    document.querySelectorAll("[data-rtl-managed]").forEach((el) => {
      el.removeAttribute("dir");
      el.style.removeProperty("font-family");
      el.style.removeProperty("text-align");
      el.style.removeProperty("direction");
      delete el.dataset.rtlManaged;
    });

    removeFont();
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "toggleRTL") {
      if (request.enabled) enableRTL();
      else disableRTL();
      sendResponse({ status: "ok", enabled: rtlEnabled });
    }
    return true;
  });

  function init() {
    chrome.runtime.sendMessage({ action: "getStatus" }, (response) => {
      if (chrome.runtime.lastError) return;
      if (response && response.enabled) enableRTL();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

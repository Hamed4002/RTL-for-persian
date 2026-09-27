// ======================== RTL Smart Companion - DeepSeek ========================
window.__RTL_CONFIG__ = {
  // بر اساس ساختار div.ds-markdown.ds-assistant-message-main-content در chat.deepseek.com
  responseSelector: [
    ".ds-markdown h1",
    ".ds-markdown h2",
    ".ds-markdown h3",
    ".ds-markdown h4",
    ".ds-markdown h5",
    ".ds-markdown h6",
    ".ds-markdown-paragraph",
    ".ds-markdown li",
    ".ds-markdown li p",
    ".ds-markdown blockquote",
    // پیام‌های ارسالی خود کاربر: یک div ساده مستقیماً زیر .ds-message
    // که برخلاف پاسخ هوش مصنوعی، کلاس ds-markdown را ندارد
    // نکته مهم: فقط این div داخلی rtl می‌شود، نه خودِ .ds-message
    // چون .ds-message با margin منطقی (inline-start:auto) موقعیت حباب رو
    // روی صفحه کنترل می‌کنه و اگه dir روی خودش ست بشه، حباب از راست میره به چپ
    ".ds-message > div:not(.ds-markdown)",
    // آیتم‌های سایدبار (تاریخچه چت): <a href="/a/chat/..."><div>عنوان</div>...</a>
    // فقط عنوان (div دوم) هدف گرفته می‌شه، نه کل لینک، تا چیدمان آیکون‌ها بهم نریزه
    "a[href^='/a/chat/'] > div:nth-child(2)",
  ].join(","),
  inputSelector: [
    "#chat-input",
    "textarea",
    "[contenteditable='true']",
  ].join(","),
  tableSelector: ".ds-markdown table",
  protectedSelector: "pre, code, .md-code-block",
  extraProtectedClasses: ["md-code-block-banner-wrap"],
  extraCSS: `
    .ds-markdown table td, .ds-markdown table th { vertical-align: top; }
  `,
};

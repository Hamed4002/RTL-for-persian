// ======================== RTL Smart Companion - Gemini ========================
window.__RTL_CONFIG__ = {
  // بر اساس ساختار div.markdown.markdown-main-panel در gemini.google.com
  // خود gemini معمولاً dir را روی کانتینر اصلی ست می‌کند؛ اینجا سطح پاراگراف را دقیق‌تر می‌کنیم.
  responseSelector: [
    ".markdown-main-panel h1",
    ".markdown-main-panel h2",
    ".markdown-main-panel h3",
    ".markdown-main-panel h4",
    ".markdown-main-panel h5",
    ".markdown-main-panel h6",
    ".markdown-main-panel p",
    ".markdown-main-panel li",
    ".markdown-main-panel li p",
    ".markdown-main-panel blockquote",
    // پیام‌های خود کاربر (بعد از ارسال) - جمینای این‌ها را در query-text نمایش می‌دهد
    ".query-text",
    ".query-text-line",
    "user-query .query-text",
    // آیتم‌های سایدبار (تاریخچه چت): <span class="title-text gds-body-l">عنوان</span>
    ".title-text",
  ].join(","),
  inputSelector: [
    "rich-textarea [contenteditable='true']",
    "[role='textbox']",
    "textarea",
  ].join(","),
  tableSelector: ".markdown-main-panel table",
  protectedSelector:
    "pre, code, code-block, .code-block, .katex, .math-block, .math-inline",
  extraProtectedClasses: ["math-block", "math-inline"],
  extraCSS: `
    .markdown-main-panel table td, .markdown-main-panel table th { vertical-align: top; }
  `,
};

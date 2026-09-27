// ======================== RTL Smart Companion - ChatGPT ========================
window.__RTL_CONFIG__ = {
  // بر اساس ساختار div.markdown.prose در chatgpt.com
  responseSelector: [
    ".markdown h1",
    ".markdown h2",
    ".markdown h3",
    ".markdown h4",
    ".markdown h5",
    ".markdown h6",
    ".markdown p",
    ".markdown li",
    ".markdown li p",
    ".markdown blockquote",
    // پیام‌های خود کاربر (بعد از ارسال) - این‌ها markdown نیستن
    "[data-message-author-role='user']",
    "[data-message-author-role='user'] .whitespace-pre-wrap",
    "[data-message-author-role='user'] p",
    // مشاهده مستقیم از inspect واقعی کاربر: حباب پیام کاربر این کلاس رو داره
    ".user-message-bubble-color",
    ".user-message-bubble-color > div",
    // آیتم‌های سایدبار (تاریخچه چت): <a data-sidebar-item="true"><span dir="auto">عنوان</span>
    "[data-sidebar-item='true'] span[dir]",
  ].join(","),
  inputSelector: [
    "#prompt-textarea",
    "[contenteditable='true']",
    "textarea",
  ].join(","),
  tableSelector: ".markdown table",
  protectedSelector:
    "pre, code, .cm-editor, #code-block-viewer, [class*='code-block']",
  extraProtectedClasses: ["cm-editor", "cm-content"],
  extraCSS: `
    .markdown table td, .markdown table th { vertical-align: top; }
  `,
};

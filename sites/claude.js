// ======================== RTL Smart Companion - Claude ========================
window.__RTL_CONFIG__ = {
  // بر اساس ساختار div.font-claude-response > div.standard-markdown در claude.ai
  responseSelector: [
    ".font-claude-response h1",
    ".font-claude-response h2",
    ".font-claude-response h3",
    ".font-claude-response h4",
    ".font-claude-response h5",
    ".font-claude-response h6",
    ".font-claude-response p",
    ".font-claude-response li",
    ".font-claude-response li p",
    ".font-claude-response blockquote",
    // پیام‌های خود کاربر (بعد از ارسال) - کلاس اختصاصی Claude برای turn کاربر
    ".font-user-message",
    ".font-user-message p",
    // fallback‌های امن در صورتی که نام کلاس در آپدیت‌های بعدی سایت تغییر کند
    "[data-testid='user-message']",
    "[data-testid='user-message'] p",
    "[data-testid='user-message'] div",
    // آیتم‌های سایدبار (تاریخچه چت): <a href="/chat/..."><span class="block truncate">عنوان</span>
    "a[href^='/chat/'] span.block.truncate",
  ].join(","),
  inputSelector: [
    "div[contenteditable='true']",
    "textarea",
    "[role='textbox']",
  ].join(","),
  tableSelector: ".font-claude-response table",
  protectedSelector: "pre, code, .code-block__code",
  extraProtectedClasses: [],
  extraCSS: `
    .font-claude-response table td, .font-claude-response table th { vertical-align: top; }
  `,
};

# RTL Smart Companion

A Chrome extension that automatically applies right-to-left (RTL) direction and a Persian font to popular AI chatbots, without affecting code blocks, math formulas, or tables.

**[English](#english)** | **[فارسی](#فارسی)**

---

## English

### Overview

By default, ChatGPT, Claude, DeepSeek, and Gemini render all content left-to-right (LTR), even when the conversation is in Persian. This extension automatically:

- Detects Persian text and switches its direction to right-to-left (RTL)
- Applies the [Estedad](https://github.com/aminabedi68/Estedad) Persian font to Persian text (bundled with the extension)
- Preserves code blocks, math formulas (KaTeX), and tables as left-to-right, unaffected
- Applies the same treatment to the chat history sidebar
- Correctly handles the user's own messages, both while typing and after sending

### Supported sites

| Site     | Domain              |
| -------- | ------------------- |
| ChatGPT  | `chatgpt.com`       |
| Claude   | `claude.ai`         |
| DeepSeek | `chat.deepseek.com` |
| Gemini   | `gemini.google.com` |

### Installation

This extension is not published on the Chrome Web Store and must be loaded manually:

1. Download or clone this repository
2. Open `chrome://extensions` in Chrome
3. Enable **Developer mode**
4. Click **Load unpacked** and select the project folder
5. Refresh any open tabs on the supported sites

### Usage

The extension is enabled by default. Click its toolbar icon to toggle it on or off.

### Architecture

- `common.js` — shared engine: direction detection, font management, a `MutationObserver` for streaming responses, and protection of code/formula blocks
- `sites/*.js` — per-site configuration (CSS selectors specific to each site's DOM structure)
- `background.js` — manages the on/off toggle state and extension icon

Each site loads only its own dedicated script, and processed elements are cached by content hash to avoid redundant work during frequent re-scans.

### Known limitations

- When a KaTeX formula mixes Persian text (`\text{...}`) with math symbols, only the Persian fragments receive correct font and reading order; the overall ordering of fragments follows the LaTeX source as written by the model. This is an inherent limitation of combining KaTeX with RTL, not a fixable bug — KaTeX's use of absolute positioning for exponents, fractions, and roots is incompatible with automatic bidirectional reordering.
- All processing is local; the extension makes no network requests.
- Selectors may require updates if the target sites change their HTML/CSS structure.

---

## فارسی

### معرفی

به‌صورت پیش‌فرض، ChatGPT، Claude، DeepSeek و Gemini تمام محتوا را چپ‌به‌راست (LTR) نمایش می‌دهند، حتی زمانی که گفتگو به زبان فارسی باشد. این افزونه به‌صورت خودکار:

- متن فارسی را تشخیص داده و جهت آن را به راست‌به‌چپ (RTL) تغییر می‌دهد
- فونت فارسی [Estedad](https://github.com/aminabedi68/Estedad) را روی متن فارسی اعمال می‌کند (همراه با افزونه ارائه شده است)
- بلوک‌های کد، فرمول‌های ریاضی (KaTeX) و جدول‌ها را دست‌نخورده و چپ‌به‌راست نگه می‌دارد
- همین رفتار را روی نوار سایدبار (تاریخچه‌ی گفتگو) نیز اعمال می‌کند
- پیام‌های ارسالی کاربر را نیز، هم هنگام تایپ و هم پس از ارسال، به‌درستی مدیریت می‌کند

### سایت‌های پشتیبانی‌شده

| سایت     | دامنه               |
| -------- | ------------------- |
| ChatGPT  | `chatgpt.com`       |
| Claude   | `claude.ai`         |
| DeepSeek | `chat.deepseek.com` |
| Gemini   | `gemini.google.com` |

### نصب

این افزونه در فروشگاه Chrome Web Store منتشر نشده و باید به‌صورت دستی بارگذاری شود:

1. این ریپازیتوری را دانلود یا کلون کنید
2. آدرس `chrome://extensions` را در کروم باز کنید
3. گزینه‌ی **Developer mode** را فعال کنید
4. روی **Load unpacked** کلیک کرده و پوشه‌ی پروژه را انتخاب کنید
5. تب‌های باز سایت‌های پشتیبانی‌شده را رفرش کنید

### استفاده

افزونه پس از نصب به‌صورت پیش‌فرض فعال است. با کلیک روی آیکون افزونه در نوار ابزار می‌توان آن را روشن یا خاموش کرد.

### معماری

- `common.js` — موتور مشترک: تشخیص جهت متن، مدیریت فونت، observer برای تغییرات پویا (استریم شدن پاسخ)، و محافظت از بلوک‌های کد/فرمول
- `sites/*.js` — تنظیمات اختصاصی هر سایت (selector های CSS متناسب با ساختار DOM همان سایت)
- `background.js` — مدیریت وضعیت روشن/خاموش و آیکون افزونه

هر سایت تنها اسکریپت اختصاصی خود را بارگذاری می‌کند، و عناصر پردازش‌شده بر اساس hash محتوا کش می‌شوند تا در بازبینی‌های مکرر کار اضافه‌ای انجام نشود.

### محدودیت‌های شناخته‌شده

- در فرمول‌های KaTeX که ترکیبی از متن فارسی (`\text{...}`) و نماد ریاضی هستند، تنها تکه‌های فارسی فونت و ترتیب خوانش درست می‌گیرند؛ ترتیب کلی قرارگیری تکه‌ها همان ترتیبی است که در سورس LaTeX نوشته شده است. این یک محدودیت ذاتی در ترکیب KaTeX با RTL است، نه باگی قابل‌رفع — زیرا KaTeX برای رسم توان، کسر و ریشه از موقعیت‌دهی مطلق استفاده می‌کند که با بازچینی خودکار دوجهته سازگار نیست.
- تمام پردازش‌ها محلی انجام می‌شود؛ افزونه هیچ درخواست شبکه‌ای ارسال نمی‌کند.
- در صورت تغییر ساختار HTML/CSS سایت‌های مقصد، ممکن است برخی selector ها نیاز به به‌روزرسانی داشته باشند.

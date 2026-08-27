# Al-Luqma Al-Tayyiba / اللقمة الطيبة

موقع مطعم بواجهة RTL عربية، قائمة طعام ديناميكية، سلة محفوظة في `localStorage`، وإدارة للوجبات عبر Express + SQLite.

## Installation

يتطلب Node.js `24` أو أحدث لأن المشروع يستخدم SQLite المدمج في Node.

```bash
npm install
```

## Environment Variables

انسخ `.env.example` إلى `.env` ثم عدّل القيم:

```bash
cp .env.example .env
```

أهم المتغيرات:

- `PORT`: منفذ السيرفر، الافتراضي `3000`.
- `BASE_PATH`: مسار النشر العام، الافتراضي `/al-luqma-al-tayyiba`.
- `SESSION_SECRET`: قيمة طويلة عشوائية لتوقيع session cookie.
- `ADMIN_USERNAME`: اسم مستخدم الإدارة.
- `ADMIN_PASSWORD_HASH`: hash كلمة مرور الإدارة.
- `DATABASE_PATH`: مكان ملف SQLite.
- `COOKIE_SECURE`: اجعله `true` عند التشغيل خلف HTTPS.
- `TRUST_PROXY`: اجعله `1` عند التشغيل خلف reverse proxy.

لتوليد hash كلمة مرور:

```bash
npm run hash-password -- "your-secure-password"
```

ضع الناتج في `ADMIN_PASSWORD_HASH`.

## Running

```bash
npm start
```

الروابط:

- الصفحة الرئيسية: `http://localhost:3000/al-luqma-al-tayyiba/`
- السلة: `http://localhost:3000/al-luqma-al-tayyiba/cart`
- لوحة الإدارة: `http://localhost:3000/al-luqma-al-tayyiba/admin`

## Storage

- قاعدة البيانات: `data/al-luqma.sqlite` افتراضيًا.
- الصور المرفوعة من لوحة الإدارة: `public/uploads/menu`.
- بيانات السلة محفوظة في متصفح الزبون عبر `localStorage`.

عند تشغيل قاعدة بيانات جديدة، يتم إدخال وجبات الصفحة الأصلية تلقائيًا كـ seed data.

## VPS

1. ارفع المشروع إلى السيرفر.
2. ثبّت Node.js `24+`.
3. شغّل `npm install`.
4. أنشئ `.env` بقيم production.
5. شغّل التطبيق عبر process manager مثل `pm2`:

```bash
npm install -g pm2
pm2 start server.js --name al-luqma
pm2 save
```

6. اربطه بـNginx/Apache reverse proxy مع HTTPS، واضبط:

```env
COOKIE_SECURE=true
TRUST_PROXY=1
```

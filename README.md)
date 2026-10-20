# كلمات ماسنجر — حزمة المستودع الجديد (kalimat-messenger)

محتويات الحزمة:
- `upload/` ← 8 ملفات تُرفع كلها إلى جذر المستودع (بلا مجلدات).
- `firestore-rules.txt` ← قواعد تُنسخ داخل قواعد Firebase (ليست للرفع إلى GitHub).
- `apk-workflow.txt` ← اختياري، لبناء APK (يُنشأ من داخل GitHub بلصق محتواه).

## 1) فك الضغط
My Files ← اضغط مطولًا على ملف الـ zip ← Extract (استخراج). لا ترفع من «عارض الأرشيف»، يجب الاستخراج أولًا.

## 2) رفع الملفات (مرة واحدة، 8 ملفات)
1. افتح المستودع kalimat-messenger في Chrome (يفضّل «موقع سطح المكتب» من قائمة ⋮).
2. زر ⋯ ← **Upload file** (أو Add file ← Upload files).
3. اضغط choose your files، ادخل مجلد `upload` المستخرج، اضغط مطولًا على ملف ثم حدّد الثمانية كلها:
   index.html / app.js / firebase-config.js / sw.js / manifest.json / icon-192.png / icon-512.png / icon-maskable-512.png
4. انتظر اكتمال الرفع ثم **Commit changes**.
لا مجلدات هنا، فلا يمكن أن تضيع المسارات.

## 3) إعدادات Firebase
- افتح `firebase-config.js` في GitHub ← أيقونة القلم ← استبدل القيم بـ firebaseConfig الخاص بمشروعك الحالي ← Commit.
- Firebase ← Firestore ← Rules: انسخ محتوى `firestore-rules.txt` داخل قواعدك الحالية (قبل القوس الأخير لـ documents) دون حذف شيء ← Publish.

## 4) تشغيل GitHub Pages
Settings ← Pages ← Source: Deploy from a branch ← Branch: main و / (root) ← Save. بعد دقيقتين:
`https://almsharbash.github.io/kalimat-messenger/`
(النطاق almsharbash.github.io مضاف عندك في Authorized domains مسبقًا.)
ثم من Chrome ⋮ ← إضافة إلى الشاشة الرئيسية.

## 5) اختياري: ملف APK
المستودع ← Add file ← **Create new file** ← في خانة الاسم اكتب بالضبط:
`.github/workflows/build-apk.yml`
(عند كتابة / ينشئ GitHub المجلدات تلقائيًا) ← الصق محتوى `apk-workflow.txt` ← Commit.
ثم تبويب Actions ← Build Kalimat Messenger APK ← Run workflow ← بعد دقائق حمّل Artifact ثبّته.
لم أجرّب هذه الخطوة (لا يوجد Android SDK عندي)؛ إن فشلت أرسل نص الخطأ.

## حدود الخطة المجانية
لا إشعارات دفع والتطبيق مغلق؛ ملفات حتى 300 ك.ب؛ حصة Firestore ~20 ألف كتابة يوميًا (تكفي تجربة الأصدقاء)؛ المجموعات غير مشفّرة طرفًا لطرف؛ مفاتيح التشفير على الجهاز فلا تمسح بيانات الموقع.

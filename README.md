# Zoozi App — GitHub Pages

This package contains the Zoozi web app, updated on 10 October 2026.
The app footer displays: Designed by: Ms. Amina Qatan.
It includes 60 original illustrated stories, 270 narrated pages, background music,
continuous reading with page turns, PDFs, and the 20-entry Fable Cottage collection.
The Fable Cottage collection has 17 original YouTube players and 3 official story-page links.
YouTube videos are streamed online with their original audio; no YouTube videos are bundled.
Some official story pages may require a Fable Cottage membership.

## خطوات النشر الأسهل من الكمبيوتر

هذا مجلد نسخة الويب، وليس ملف APK. لا تحتاجين إلى Cloudflare.

1. فكّي ضغط الملف. افتحي مجلد Zoozi؛ يجب أن يظهر داخله index.html ومجلد assets.
2. نزّلي GitHub Desktop من https://desktop.github.com/download/ وثبّتيه ثم سجّلي دخولك بحساب GitHub.
3. في البرنامج اختاري File ثم New repository. اكتبي الاسم zoozi، ثم Create repository.
4. اختاري Repository ثم Show in Explorer. انسخي كل محتويات مجلد Zoozi المفكوك إلى المجلد الذي فتحه البرنامج. يجب أن يكون index.html مباشرة في هذا المجلد، وليس داخل مجلد Zoozi إضافي.
5. ارجعي إلى GitHub Desktop. في Summary اكتبي Zoozi app، ثم اضغطي Commit to main. بعد ذلك اضغطي Publish repository، وأزيلي علامة Keep this code private، ثم Publish repository.
6. افتحي المستودع في موقع GitHub. من Settings ثم Pages اختاري Deploy from a branch، ثم main ثم /(root)، ثم Save.
7. انتظري اكتمال النشر، ثم افتحي Visit site في صفحة Pages. هذا هو الرابط الذي تشاركينه.

إذا كنت قد أنشأت مستودع zoozi مسبقًا: في GitHub Desktop اختاري File ثم Clone repository، ثم اختاري مستودعك. بعدها اتبعي خطوة نسخ الملفات، ثم Commit ثم Push origin، وبعد ذلك فعّلي Pages.

داخل التطبيق افتحي مجموعة The Fable Cottage واختاري القصة ثم زر التشغيل.
يمكن أيضًا الضغط على Watch on YouTube لفتحها في المتصفح. لا يلزم تنزيل الفيديو أو تثبيت تطبيق YouTube؛ يلزم الاتصال بالإنترنت.
إذا منع صاحب الفيديو عرضه داخل المواقع، استخدمي Watch on YouTube.

## Why GitHub Desktop?

The app has 530 files. GitHub's browser uploader allows only 100 files per upload.
GitHub Desktop uploads the whole folder together. All individual files are under 25 MiB.
After publication, use the GitHub Pages URL, not the repository URL, to open the app.

## Technical notes

- Static HTML, CSS, and JavaScript; no server, database, API keys, or build command.
- Keep every file and folder in place. All media paths are relative for GitHub project sites.
- The PWA manifest and service-worker cache are scoped to the app's location.
- A .nojekyll file preserves the static files during branch-based GitHub Pages publication.
- Existing YouTube players retain the original sound and have a Watch on YouTube fallback.
- Original story narration starts after tapping Read story and advances with page turns.
- YouTube and external Fable Cottage pages require internet. Previously loaded original
  stories may be available offline; this is not a promise that all stories are downloaded.
- This package is prepared for GitHub Pages but has not been published to your GitHub account.

Official guides:
- https://docs.github.com/en/desktop/adding-and-cloning-repositories/adding-an-existing-project-to-github-using-github-desktop
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site


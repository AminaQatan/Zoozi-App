ZOOZI APP — MOBILE UPDATE v16

This is an update for your existing Zoozi App, not a standalone backup.
It includes the previous white/purple/gold Fable Cottage design and the seven
first-video thumbnails, plus the new portrait and landscape layouts.

FASTEST UPDATE ON YOUR DESKTOP
1. Extract this ZIP (right-click > Extract All).
2. Open https://github.com/AminaQatan/Zoozi-App
3. Choose Add file > Upload files.
4. Drag these FOUR extracted files into the main repository folder:
   index.html, app.css, app.js, sw.js
   Replace files with these same names. Do not upload the ZIP itself.
5. Choose Commit changes. Wait for the GitHub Pages deployment to finish.
6. Open https://aminaqatan.github.io/Zoozi-App/?refresh=16
7. Close and reopen the installed mobile app. Settings should say
   "Zoozi v16 · Portrait & landscape".

If using GitHub Desktop: copy the four files into your existing local
Zoozi-App folder, replace them, then Commit to main and Push origin.
Keep all other files, especially assets/, stories.js and novel-pages.js.

ON YOUR PHONE
- Enable Auto-rotate (turn off Portrait Orientation Lock on iPhone).
- Turn the phone: the same story page and narration remain active.
- Portrait: picture above the reading controls.
- Landscape on a short screen: picture beside the text and Read story button.
- Use the corner-shaped full-screen button where supported; tap again to exit.
- On browsers without full-screen support, open Zoozi from the home screen
  for more room. YouTube also has its own full-screen control.
- The library and help sections still scroll normally. Long novel text/tools
  can scroll in their panel. Pictures keep their correct proportions.

WHAT IS PRESERVED
All 60 stories, continuous audio, flipping, novel pages, original video sound,
playlist links, settings and Designed by: Ms. Amina Qatan.
No database, new account, API key, or extra service is required.
Online video playlists still require internet.

VALIDATION
JavaScript syntax and CSS parsing passed. DOM behavior checks covered the
six resize sizes 390x844, 844x390, 320x568, 568x320, 768x1024, 1024x768,
preserved narration/page/session, automatic page turns, full-screen controls,
playlist routes and the 68-page novel. These are simulated behavior checks,
not visual device tests. Browser rendering could not be tested here because
the environment blocked browser startup. Please check both orientations
on your phone after uploading.

ZOOZI APP — TV UPDATE v17 (Sony BRAVIA / Google TV / Android TV)

This update does two things:
  1. The website now works with a TV remote: arrows move, OK opens,
     Back goes back. Phones and tablets work exactly as before.
  2. It adds a real TV app ("Zoozi App" with its own banner on the TV
     home screen). GitHub builds the app file for you automatically.

Keep all your other files, especially assets/, stories.js,
fable-stories.js, novel-section.js and novel-pages.js.


PART 1 — UPLOAD TO GITHUB (on your computer)
1. Extract this ZIP (right-click > Extract All).
2. Open https://github.com/AminaQatan/Zoozi-App
3. Choose Add file > Upload files.
4. Open the extracted folder and select EVERYTHING inside it:
     index.html, app.css, app.js, sw.js, tv.html, READ_ME_FIRST.txt
     and the two folders  tv-app  and  .github
   Drag them all together into the GitHub upload box.
   Replace files with the same names. Do not upload the ZIP itself.
   (build-tv-app.yml at the top is a spare copy for the tip below;
   uploading it too is harmless.)
5. Choose Commit changes.
6. Open the Actions tab of the repository. You will see
   "Build Zoozi TV app" running. Wait for the green tick (about 5 minutes).
   The TV app is now ready at:
   https://github.com/AminaQatan/Zoozi-App/releases/download/tv-app/zoozi-tv.apk
7. Settings in the website should now say "Zoozi v17 · Phone, tablet & TV".

If the .github folder does not upload (some computers hide it):
   Add file > Create new file > type the name
   .github/workflows/build-tv-app.yml
   then open the spare build-tv-app.yml from the extracted folder in Notepad,
   copy everything, paste it into GitHub and Commit changes.
   Then open Actions > Build Zoozi TV app > Run workflow.


PART 2 — INSTALL ON THE SONY TV (one time only)
1. On the TV, open Google Play and install "Downloader by AFTVnews"
   (free).
2. Google TV models only: Settings > System > About, then press OK
   7 times on "Android TV OS build" until it says you are a developer.
   (This only allows the TV to install apps you choose.)
3. Open Downloader. In the address box type:
      aminaqatan.github.io/Zoozi-App/tv.html
   and press Go.
   (If that page does not open, type the APK link from Part 1, step 6.)
4. Press OK on "Download the TV app".
5. If the TV asks, choose Settings, set Downloader to "Allowed",
   then press Back. If Play Protect asks, choose Install anyway.
6. Choose Install, then Open. Zoozi App now appears with your TV apps.
   You can add it to your favourites row.

You never need to install it again for story changes: the TV app always
shows the newest version of your website.


USING THE REMOTE
- Arrows: move.  OK: open / press.  Back: go back.
  On the main library, press Back twice to close Zoozi.
- In a story: OK on "Read story" reads the whole book.
  Left / Right turn pages. The Play/Pause button starts or stops reading.
- Videos: OK on Play opens the video on the big screen.
  Back returns to the small screen. In playlists, the Next and
  Previous buttons change the video.
- The illustrated novel uses the TV's own reading voice.
- If a YouTube video will not play inside Zoozi, press Down to
  "Open on YouTube" — it opens in the TV's YouTube app.

TRY IT ON YOUR COMPUTER FIRST
Open the website, go to Settings and switch on "TV remote mode".
Then use the keyboard arrows, Enter (= OK) and Esc (= Back).
Switch it off again the same way.


IF YOU EVER REBUILD THE TV APP
Each build gets a new signature. To install a newer build, first
uninstall the old Zoozi App from the TV, then install the new one.
(Only needed if tv-app/ changes — normal story updates never need it.)


WHAT WAS CHECKED
JavaScript and CSS syntax passed. Remote-control behaviour was tested in
a browser at TV size (960x540 and 1920x1080): library, all 60 stories,
page turns, reading, Settings, The Fable Cottage, English Songs,
Homeschool playlists, big-screen video, the novel with the TV voice, and
Back from every screen. Phone layout was rechecked and is unchanged.
The TV app code compiles against Android 15. The final APK is built by
GitHub, so it could not be installed on a real Sony TV here — please try
it on your TV after Part 2.

Designed by: Ms. Amina Qatan

'use strict';
const $=s=>document.querySelector(s),app=$('#app'),settings=$('#settings');
const speaker='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M11 4 5 9H2v6h3l6 5V4Z"/><path d="M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/></svg>';
const stopIcon='<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/></svg>';
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let prefs={speed:1,flip:true,music:true,musicVolume:.16};try{const p=JSON.parse(localStorage.getItem('first-stories-settings')||'{}');if([.85,1,1.15].includes(p.speed))prefs.speed=p.speed;if(typeof p.flip==='boolean')prefs.flip=p.flip;if(typeof p.music==='boolean')prefs.music=p.music;if(Number.isFinite(p.musicVolume)&&p.musicVolume>=0&&p.musicVolume<=.3)prefs.musicVolume=p.musicVolume}catch{}
let current=null,pageIndex=0,turning=false,audio=null,audioButton=null,installPrompt=null,noticeTimer,turnToken=0;
let fableCurrent=null;
let narrator=null,readingStory=false,storyFinished=false,readSession=0,playAttempt=0;
let music=null,musicContext=null,musicGain=null,musicUnlocked=false;
const groups=[{title:'Little acts of kindness',color:'#007e88',tint:'#dff8f3'},{title:'Al Zahraa’s adventures',color:'#bd417e',tint:'#ffe9f1'},{title:'My little world',color:'#6b48c7',tint:'#f0eaff'},{title:'Daily discoveries',color:'#a66400',tint:'#fff1c7'},{title:'Animal friends',color:'#46762e',tint:'#e9f6df'},{title:'Outdoor adventures',color:'#3765ad',tint:'#e7f0ff'},{title:'Growing together',color:'#bd417e',tint:'#ffe9f1'}].map(g=>({...g,stories:STORIES.filter(s=>s.series===g.title)}));
function art(s,page,cover=false){const src=cover?s.cover:page.image,panel=cover?s.coverPanel:page.panel,crop=cover?s.coverCrop:page.crop,ratio=(cover?s.coverRatio:page.imageRatio)||s.imageRatio;const framing=crop?`style="width:${100/crop[2]}%;height:${100/crop[3]}%;left:${-100*crop[0]/crop[2]}%;top:${-100*crop[1]/crop[3]}%;object-fit:fill"`:Number.isInteger(panel)?`class="panel p${panel}"`:'';return `<div class="art ${cover?'':'page-art'}" style="--ratio:${ratio}"><img src="${src}" ${framing} alt="${escapeHTML(cover?s.title:page.en.join(' '))}" ${cover?'loading="lazy"':'decoding="async"'} draggable="false"></div>`}
function notify(message){clearTimeout(noticeTimer);$('#notice').textContent=message;$('#notice').hidden=false;noticeTimer=setTimeout(()=>$('#notice').hidden=true,6500)}
function setMusicLevel(){const level=prefs.music?prefs.musicVolume*((audio||readingStory) ? .24 : 1):0;if(musicGain&&musicContext){const t=musicContext.currentTime;musicGain.gain.cancelScheduledValues(t);musicGain.gain.setTargetAtTime(level,t,.18)}else if(music)music.volume=level}
function syncMusicControls(){const b=$('#music-toggle');b.setAttribute('aria-pressed',String(prefs.music));b.setAttribute('aria-label',prefs.music?'Turn background music off':'Turn background music on');$('#background-music').checked=prefs.music;$('#music-volume').value=String(Math.round(prefs.musicVolume*100));$('#music-volume-value').textContent=`${Math.round(prefs.musicVolume*100)}%`;setMusicLevel()}
function startMusic(userGesture=false){if(fableCurrent||location.hash.startsWith('#fable'))return;if(userGesture)musicUnlocked=true;if(!prefs.music||!musicUnlocked||document.hidden||(!current&&!userGesture))return;if(!music){music=new Audio('assets/audio/storybook_garden.mp3');music.loop=true;music.preload='auto';try{const AC=window.AudioContext||window.webkitAudioContext;if(AC){musicContext=new AC();musicGain=musicContext.createGain();musicGain.gain.value=0;musicContext.createMediaElementSource(music).connect(musicGain);musicGain.connect(musicContext.destination)}}catch{musicContext=null;musicGain=null}music.onerror=()=>{music.pause();notify('Music could not load. The story is still ready to read.')}}setMusicLevel();if(musicContext?.state==='suspended')musicContext.resume().catch(()=>{});if(music.paused)music.play().catch(()=>{})}
function pauseMusic(){if(music)music.pause()}
function toggleMusic(value){prefs.music=value;saveSettings();syncMusicControls();if(value&&current)startMusic(true);else pauseMusic()}
function syncReadButton(){
  const button=app.querySelector('[data-listen]');
  if(!button)return;
  const label=readingStory?'Stop':storyFinished?'Read again':'Read story';
  button.innerHTML=(readingStory?stopIcon:speaker)+`<span>${label}</span>`;
  button.classList.toggle('playing',readingStory);
  button.setAttribute('aria-pressed',String(readingStory));
  button.setAttribute('aria-label',readingStory?'Stop reading':storyFinished?'Read the whole story again':'Read this story with automatic page turns');
  button.disabled=turning&&!readingStory;
  button.closest('.reading')?.classList.toggle('active',readingStory);
  audioButton=readingStory?button:null;
}
function pausePageAudio(){
  ++playAttempt;
  if(audio){audio.onended=null;audio.onerror=null;audio.pause();audio.currentTime=0;audio=null;}
  setMusicLevel();
}
function stopAudio(){readingStory=false;++readSession;pausePageAudio();syncReadButton();}
function playPage(session){
  if(!readingStory||session!==readSession||!current||turning||document.hidden)return;
  pausePageAudio();
  // Keep one user-activated media element across pages, including on Safari.
  if(!narrator)narrator=new Audio();
  const clip=narrator,story=current,index=pageIndex,attempt=++playAttempt;
  const valid=()=>readingStory&&session===readSession&&attempt===playAttempt&&current===story&&pageIndex===index;
  audio=clip;clip.src=story.pages[index].audio.en;clip.preload='auto';
  clip.playbackRate=prefs.speed;clip.preservesPitch=true;
  syncReadButton();startMusic(true);setMusicLevel();
  clip.onended=()=>{
    if(!valid()||!clip.ended)return;
    if(index===story.pages.length-1){stopAudio();storyFinished=true;syncReadButton();notify('The end! Tap Read again to hear the story again.');return;}
    void flip(1);
  };
  clip.onerror=()=>{if(valid()){stopAudio();notify('Audio could not load. Tap Read story to try again.');}};
  const playing=clip.play();
  if(playing?.catch)playing.catch(()=>{if(valid()){stopAudio();notify('Tap Read story to continue reading.');}});
}
function play(){
  if(readingStory){stopAudio();return;}
  if(!current||turning)return;
  const replay=storyFinished;storyFinished=false;readingStory=true;
  const session=++readSession;
  if(replay&&pageIndex>0){syncReadButton();void flip(-pageIndex);return;}
  playPage(session);
}

const onlinePlayIcon='<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>';
function fableShelf(){return `<section class="online-shelf"><button id="open-fables"><img src="assets/fable-thumbnails/VjTJvwgJnGc.jpg" alt="" loading="lazy"><span><strong>The Fable Cottage</strong><small>20 original stories · Internet required</small></span>${onlinePlayIcon}</button></section>`}
function fableArt(s){return s.cover?`<img src="${s.cover}" alt="" loading="lazy">`:`<div class="source-cover" aria-hidden="true">${speaker}</div>`}
function resetForOnline(){++turnToken;turning=false;storyFinished=false;stopAudio();pauseMusic();current=null;fableCurrent=null;}
function fableLibrary(){
  resetForOnline();document.title='The Fable Cottage · Zoozi App';
  app.innerHTML=`<div class="library fable-library"><div class="reader-top"><button class="back-button" id="back-library">Library</button><h1 class="reader-title">The Fable Cottage</h1></div><p class="online-intro">Original English recordings. Internet required.</p><div class="books fable-books">${FABLE_STORIES.map(s=>`<button class="book-card" data-fable="${s.id}" style="--book-color:#3765ad;--book-tint:#e7f0ff" aria-label="${s.kind==='website'?'Open official story page for':'Play original recording of'} ${escapeHTML(s.title)}"><div class="fable-cover">${fableArt(s)}</div><div class="book-copy"><h3>${escapeHTML(s.title)}</h3><div class="book-meta"><span>${s.kind==='website'?'Official story page':s.kind==='audiobook'?'Original audiobook':'Original video'}</span>${onlinePlayIcon}</div></div></button>`).join('')}</div><p class="source-credit">Stories and recordings by The Fable Cottage. The three story-page links may include members-only chapters.</p></div>`;
  $('#back-library').onclick=()=>navigate();app.querySelectorAll('[data-fable]').forEach(b=>b.onclick=()=>{location.hash='#fable/'+b.dataset.fable;});window.scrollTo({top:0,behavior:'instant'});
}
function fableStory(id){
  const story=FABLE_STORIES.find(s=>s.id===id);if(!story)return fableLibrary();
  resetForOnline();fableCurrent=story;document.title=`${story.title} · Zoozi App`;
  const native=location.hostname==='appassets.androidplatform.net';
  const player=story.youtubeId?(native?`<div class="native-video-poster">${fableArt(story)}<a class="primary-button original-play" href="https://www.youtube.com/embed/${story.youtubeId}">${onlinePlayIcon}Play original</a></div>`:`<div class="original-player"><iframe id="fable-player" title="${escapeHTML(story.title)} — The Fable Cottage" src="https://www.youtube-nocookie.com/embed/${story.youtubeId}?playsinline=1&amp;enablejsapi=1&amp;origin=${encodeURIComponent(location.origin)}" referrerpolicy="strict-origin-when-cross-origin" allow="autoplay; encrypted-media; picture-in-picture; web-share" allowfullscreen></iframe></div>`):`<div class="official-story"><h2>Listen on The Fable Cottage</h2><p>This opens the original illustrated story and audio. Some chapters may need a Fable Cottage membership.</p><a class="primary-button original-play" href="${story.sourceUrl}" target="_blank" rel="noopener">Open official story</a></div>`;
  app.innerHTML=`<div class="reader video-reader"><div class="reader-top"><button class="back-button" id="back-fables">Stories</button><h1 class="reader-title">${escapeHTML(story.title)}</h1></div><p class="online-intro">${story.kind==='audiobook'?'Original audiobook':story.kind==='video'?'Original video':'Official story page'} · Internet required${story.accent?' · '+story.accent:''}</p>${player}<div class="original-links"><p>By The Fable Cottage · Original sound</p>${story.youtubeId?`<a href="${story.sourceUrl}" target="_blank" rel="noopener">Watch on YouTube</a>`:''}<a href="https://www.thefablecottage.com/languages/english" target="_blank" rel="noopener">The Fable Cottage website</a></div></div>`;
  $('#back-fables').onclick=()=>{location.hash='#fables';};window.scrollTo({top:0,behavior:'instant'});
}
function pauseOnlinePlayer(){const frame=$('#fable-player');if(frame?.contentWindow)frame.contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}), 'https://www.youtube-nocookie.com');}

function library(){fableCurrent=null;++turnToken;turning=false;storyFinished=false;stopAudio();pauseMusic();current=null;document.title='Zoozi App';app.innerHTML=`<div class="library"><div class="library-heading"><div><h1>Pick a <span>story!</span></h1><p>60 little stories to read and listen to.</p></div><div class="age-mark">2+<small>AGES</small></div></div>${fableShelf()}${novelsShelf()}${groups.map((g,i)=>`<section class="series"><div class="series-heading" style="--series-color:${g.color};--series-tint:${g.tint}"><span class="series-number" aria-hidden="true">${i+1}</span><h2>${g.title}</h2></div><div class="books">${g.stories.map(s=>`<button class="book-card" data-story="${s.id}" style="--book-color:${s.color};--book-tint:${s.tint}" aria-label="Read ${escapeHTML(s.title)}"><div class="cover-wrap">${art(s,null,true)}</div><div class="book-copy"><h3>${escapeHTML(s.title)}</h3><div class="book-meta"><span>${s.pages.length} pages</span><span class="book-listen">${speaker}<span>Read & listen</span></span></div></div></button>`).join('')}</div></section>`).join('')}</div>`;$('#open-fables').onclick=()=>{location.hash='#fables';};$('#open-novels').onclick=()=>{location.hash='#novels';};app.querySelectorAll('[data-story]').forEach(b=>b.addEventListener('click',()=>{startMusic(true);navigate(b.dataset.story,0)}));window.scrollTo({top:0,behavior:'instant'})}
function pageMarkup(){const p=current.pages[pageIndex];return `${art(current,p)}<section class="reading"><div class="sentences" lang="en">${p.en.map(t=>`<p>${escapeHTML(t)}</p>`).join('')}</div><button class="listen" data-listen="en" aria-label="Read this story with automatic page turns" aria-pressed="false">${speaker}<span>Read story</span></button></section><div class="page-footnote"><span>Zoozi App</span><span>${pageIndex+1} / ${current.pages.length}</span></div>`}
function bindPage(){syncReadButton();app.querySelectorAll('[data-listen]').forEach(b=>b.addEventListener('click',()=>play(b)));const el=$('#story-page');let start=null;el.onpointerdown=e=>{if(e.pointerType==='mouse'||e.target.closest('button,a'))return;start={x:e.clientX,y:e.clientY}};el.onpointerup=e=>{if(!start)return;const dx=e.clientX-start.x,dy=e.clientY-start.y;start=null;if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.3)flip(dx<0?1:-1)};el.onpointercancel=()=>start=null}
function updateNav(){const n=current.pages.length;$('#previous').disabled=turning||pageIndex===0;$('#next').disabled=turning;$('#next').textContent=pageIndex===n-1?'Finish':'Next';$('#progress').innerHTML=`<span>Page ${pageIndex+1} of ${n}</span><div class="dots" aria-hidden="true">${current.pages.map((_,i)=>`<span class="${i===pageIndex?'current':''}"></span>`).join('')}</div>`}
function reader(){fableCurrent=null;storyFinished=false;stopAudio();document.title=`${current.title} · Zoozi App`;app.innerHTML=`<div class="reader" style="--book-color:${current.color};--book-tint:${current.tint}"><div class="reader-top"><button class="back-button" id="back-library">Library</button><h1 class="reader-title">${escapeHTML(current.title)}</h1><a class="download-link" href="${current.pdf}" download>PDF</a></div><div class="book-stage"><article class="story-page" id="story-page" aria-label="Story page">${pageMarkup()}</article></div><nav class="page-nav" aria-label="Story pages"><button class="nav-button" id="previous">Previous</button><div class="page-progress" id="progress" role="status" aria-live="polite"></div><button class="nav-button next" id="next">Next</button></nav><div class="reader-bottom"><span>Tap Read story once. The pages turn automatically.</span><a href="${current.pdf}" download>Download PDF</a>${current.activities?`<a href="${current.activities}" download>Activity Pack</a>`:''}</div></div>`;$('#back-library').onclick=()=>navigate();$('#previous').onclick=()=>flip(-1);$('#next').onclick=()=>flip(1);bindPage();updateNav();prefetchNext();startMusic()}
function routeHash(id,index){return id?`#story/${encodeURIComponent(id)}/${index+1}`:'#library'}
function navigate(id,index=0){location.hash=routeHash(id,index);if(id===current?.id&&index===pageIndex)return;if(!id&&!current)library()}
function parseRoute(){if(location.hash==='#novels')return novelsLibrary();if(location.hash==='#fables')return fableLibrary();if(location.hash.startsWith('#fable/'))return fableStory(location.hash.slice(7));const m=location.hash.match(/^#story\/([^/]+)\/(\d+)$/);if(m){let sid;try{sid=decodeURIComponent(m[1])}catch{return library()}const s=STORIES.find(s=>s.id===sid);const p=Number(m[2])-1;if(s&&p>=0&&p<s.pages.length){++turnToken;turning=false;current=s;pageIndex=p;reader();return}}library()}
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function flip(direction){
  if(turning||!current)return false;
  const target=pageIndex+direction;
  if(target<0)return false;
  if(target>=current.pages.length){stopAudio();navigate();return false;}
  const token=++turnToken,session=readSession,continueReading=readingStory;
  turning=true;pausePageAudio();syncReadButton();startMusic(true);updateNav();
  const enabled=prefs.flip&&!matchMedia('(prefers-reduced-motion: reduce)').matches;
  const el=$('#story-page'),side=direction>0?'next':'prev';
  if(enabled){el.classList.add(`turn-out-${side}`);await wait(230);}
  if(token!==turnToken)return false;
  pageIndex=target;storyFinished=false;
  history.replaceState(null,'',routeHash(current.id,pageIndex));
  el.innerHTML=pageMarkup();el.className=`story-page ${enabled?`turn-in-${side}`:''}`;
  bindPage();updateNav();
  if(enabled)await wait(290);
  if(token!==turnToken)return false;
  el.className='story-page';turning=false;updateNav();syncReadButton();
  if(document.activeElement===document.body)el.focus({preventScroll:true});
  prefetchNext();
  if(continueReading&&readingStory&&session===readSession)playPage(session);
  return true;
}
function prefetchNext(){
  if(!current)return;
  const next=current.pages[pageIndex+1];
  if(next){
    const img=new Image();img.src=next.image;
    if(window.fetch)window.fetch(next.audio.en).then(response=>response.ok?response.arrayBuffer():null).catch(()=>{});
  }
}

function saveSettings(){try{localStorage.setItem('first-stories-settings',JSON.stringify(prefs))}catch{}document.body.classList.toggle('no-animation',!prefs.flip)}
$('#settings-open').onclick=()=>settings.showModal();settings.addEventListener('click',e=>{if(e.target===settings){const r=settings.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)settings.close()}});$('#audio-speed').value=String(prefs.speed);$('#page-animation').checked=prefs.flip;saveSettings();syncMusicControls();
$('#audio-speed').onchange=e=>{prefs.speed=Number(e.target.value);if(audio)audio.playbackRate=prefs.speed;saveSettings()};$('#page-animation').onchange=e=>{prefs.flip=e.target.checked;saveSettings()};$('#music-toggle').onclick=()=>toggleMusic(!prefs.music);$('#background-music').onchange=e=>toggleMusic(e.target.checked);$('#music-volume').oninput=e=>{prefs.musicVolume=Number(e.target.value)/100;saveSettings();syncMusicControls()};$('#home').onclick=()=>navigate();
window.addEventListener('hashchange',parseRoute);window.addEventListener('keydown',e=>{if(settings.open||!current||e.target.closest('select,input,textarea'))return;if(e.key==='ArrowRight'){e.preventDefault();flip(1)}if(e.key==='ArrowLeft'){e.preventDefault();flip(-1)}});document.addEventListener('visibilitychange',()=>{if(document.hidden){stopAudio();pauseMusic();pauseOnlinePlayer()}});window.addEventListener('pagehide',()=>{stopAudio();pauseMusic();pauseOnlinePlayer()});
function installed(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}
function installState(){if(installed()){$('#install-top').hidden=true;$('#install-settings').hidden=true;$('#install-help').textContent='This app is on your home screen.'}}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#install-help').textContent='Tap Install App to add Zoozi App to your home screen.'});window.addEventListener('appinstalled',()=>{installPrompt=null;installState();notify('Zoozi App is ready on your home screen.')});
function showInstallHelp(){
  if(!settings.open)settings.showModal();
  const ua=navigator.userAgent;
  const ios=/iPhone|iPad|iPod/.test(ua)||(/Macintosh/.test(ua)&&navigator.maxTouchPoints>1);
  $('#install-help').textContent=ios
    ?'Open this link in Safari. Tap Share, then Add to Home Screen. If you opened it inside another app, copy the link into Safari first.'
    :/Android/.test(ua)
      ?'Open this link directly in Chrome, outside a chat or social app. Tap the Chrome menu (three dots), then Add to home screen and Install. Use a regular tab, not Incognito.'
      :'Open your browser menu and choose Install app or Add to home screen. You can also keep reading here without installing.';
  $('#install-help').scrollIntoView({block:'nearest'});
}
async function install(){
  if(installed()){notify('The app is already installed.');return;}
  if(!installPrompt){showInstallHelp();return;}
  const prompt=installPrompt;installPrompt=null;
  try{
    await prompt.prompt();
    const choice=await prompt.userChoice;
    if(choice.outcome!=='accepted')showInstallHelp();
  }catch{showInstallHelp();}
}
$('#install-top').onclick=install;$('#install-settings').onclick=install;installState();parseRoute();
// Register as soon as the scripts are ready, without waiting for images or fonts.
if('serviceWorker'in navigator)navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(reg=>reg.update()).catch(()=>{
  $('#install-help').textContent='The offline copy could not finish loading. Keep your internet connection on and reload to try again. You can still read online.';
});
if(document.modelContext?.registerTool){const lifecycle=new AbortController();for(const t of [{name:'list_stories',title:'List stories',description:'List the illustrated English stories.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(){return STORIES.map(s=>({id:s.id,title:s.title,pages:s.pages.length}))}},{name:'open_story_page',title:'Open a story page',description:'Navigate the visible reader to a story and page. Does not start narration.',inputSchema:{type:'object',properties:{storyId:{type:'string'},page:{type:'integer',minimum:1}},required:['storyId','page'],additionalProperties:false},annotations:{readOnlyHint:false},execute(input){const s=STORIES.find(s=>s.id===input?.storyId);if(!s||!Number.isInteger(input.page)||input.page<1||input.page>s.pages.length)throw new Error('Choose a valid story ID and page.');history.replaceState(null,'',routeHash(s.id,input.page-1));parseRoute();return {storyId:s.id,page:input.page,sentences:s.pages[input.page-1].en}}}])try{Promise.resolve(document.modelContext.registerTool(t,{signal:lifecycle.signal})).catch(()=>{})}catch{}window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true})}

// The novel is kept as the original uploaded PDF.
const ZOOZI_NOVEL={
  title:'Princess AL Zahraa in Wonderland',
  cover:'assets/novels/princess-al-zahraa-cover.jpg',
  pdf:'assets/novels/Princess_AL_Zahraa_in_Wonderland.pdf',
  pages:68,
  size:'32.2 MB'
};
function novelsShelf(){
  return `<section class="online-shelf novel-shelf"><button id="open-novels"><img src="${ZOOZI_NOVEL.cover}" alt="" loading="lazy"><span><strong>Novels</strong><small>Princess AL Zahraa in Wonderland</small></span><span aria-hidden="true">→</span></button></section>`;
}
function novelsLibrary(){
  resetForOnline();document.title='Novels · Zoozi App';
  const book=ZOOZI_NOVEL;
  app.innerHTML=`<div class="library novels-library"><div class="reader-top"><button class="back-button" id="back-library">Library</button><h1 class="reader-title">Novels</h1></div><p class="novels-intro">A little wonder. A brave heart. A story to treasure.</p><article class="novel-card"><a class="novel-cover" href="${book.pdf}" target="_blank" rel="noopener" aria-label="Read ${book.title}"><img src="${book.cover}" alt="Cover of ${book.title}"></a><div class="novel-copy"><span class="novel-label">Illustrated novel</span><h2>${book.title}</h2><p>A fairy-tale adventure about courage, self-worth, love of Allah, and family love.</p><p class="novel-meta">${book.pages} pages · English · PDF · ${book.size}</p><div class="novel-actions"><a class="primary-button" href="${book.pdf}" target="_blank" rel="noopener">Read novel</a><a class="novel-download" href="${book.pdf}" download="Princess_AL_Zahraa_in_Wonderland.pdf">Download PDF</a></div><p class="novel-note">The PDF opens in your browser or PDF reader. Download it to read offline.</p></div></article></div>`;
  $('#back-library').onclick=()=>navigate();window.scrollTo({top:0,behavior:'instant'});
}

'use strict';
const DATA=window.PHYSFORGE_DATA, CONFIG=window.PHYSFORGE_CONFIG;
const byKey=key=>DATA.cases.find(c=>c.key===key), $=id=>document.getElementById(id);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
document.querySelectorAll('[data-paper]').forEach(a=>a.href=CONFIG.paperUrl);
document.querySelectorAll('[data-status]').forEach(e=>e.textContent=CONFIG.status);
if(CONFIG.codeUrl){$('code-link').href=CONFIG.codeUrl;$('code-link').hidden=false;$('code-status').hidden=true;}
if(CONFIG.authors.length){$('authors').replaceChildren(...CONFIG.authors.flatMap((a,i)=>{const e=document.createElement(a.url?'a':'span');e.textContent=a.name+(a.affiliation?' · '+a.affiliation:'');if(a.url)e.href=a.url;return i?[document.createTextNode(' / '),e]:[e];}));}
let heroCase='material/001',heroKind='medium',heroGeneration=0;
const hero=$('hero-video');
function setHero(key,kind,autoplay){
  const c=byKey(key);heroCase=key;heroKind=kind;
  const condition=c.conditions.find(x=>x.kind===kind)||c.conditions[0],v=condition.videos.ours;
  const time=hero.currentTime||0,generation=++heroGeneration;
  hero.pause();hero.poster=v.poster;hero.src=v.src;hero.load();
  hero.setAttribute('aria-label',`${c.name}, ${condition.label}, PhysForge`);
  $('hero-label').textContent=condition.label;$('hero-error').hidden=true;$('hero-original').href=v.src;
  $('hero-materials').innerHTML=c.conditions.map(x=>`<button data-kind="${x.kind}" aria-pressed="${x.kind===condition.kind}">${escapeHTML(x.label)}</button>`).join('');
  document.querySelectorAll('[data-hero-object]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.heroObject===key)));
  hero.addEventListener('loadedmetadata',()=>{if(generation!==heroGeneration)return;hero.currentTime=Math.min(time,Math.max(0,hero.duration-.05));if(autoplay)hero.play().catch(()=>{});},{once:true});
}
$('hero-materials').addEventListener('click',e=>{const b=e.target.closest('button[data-kind]');if(b)setHero(heroCase,b.dataset.kind,!hero.paused);});
document.querySelectorAll('[data-hero-object]').forEach(b=>b.addEventListener('click',()=>setHero(b.dataset.heroObject,heroKind,!hero.paused)));
$('hero-play').addEventListener('click',()=>hero.paused?hero.play().catch(()=>{$('hero-error').hidden=false;}):hero.pause());
function heroPlaybackLabel(){const label=hero.paused?'Play':'Pause';$('hero-play').textContent=label;$('hero-play').setAttribute('aria-label',label+' material simulation');}
hero.addEventListener('play',heroPlaybackLabel);hero.addEventListener('pause',heroPlaybackLabel);
hero.addEventListener('error',()=>{$('hero-error').hidden=false;});
setHero(heroCase,heroKind,!reducedMotion);
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());});

// Curated comparisons retain the original videos and a shared elapsed-time axis.
let comparisonKey='material/101',comparisonKind='soft',comparisonVideos=[],comparisonGeneration=0,comparisonFrame=0;
const descriptions={
  'material/101':'Inspect compression and rebound while retaining the apple’s appearance.',
  'material/115':'Switch materials to inspect how the legs bend and how the structure is preserved.',
  'components/001':'Inspect the relative motion of the pillow, beanbag, and mat during contact.'
};
function comparisonRefresh(){
  const max=Math.max(...comparisonVideos.map(v=>Number.isFinite(v.duration)?v.duration:Number(v.dataset.duration)),0);
  const time=Math.max(...comparisonVideos.map(v=>v.currentTime),0);
  $('comparison-seek').max=max;$('comparison-seek').value=Math.min(time,max);
  $('comparison-time').textContent=`${time.toFixed(1)} / ${max.toFixed(1)} s`;
  $('comparison-play').textContent=comparisonVideos.some(v=>!v.paused&&!v.ended)?'Pause all':'Play all';
}
function comparisonTick(){comparisonRefresh();comparisonFrame=comparisonVideos.some(v=>!v.paused&&!v.ended)?requestAnimationFrame(comparisonTick):0;}
function pauseComparison(){comparisonVideos.forEach(v=>v.pause());cancelAnimationFrame(comparisonFrame);comparisonFrame=0;comparisonRefresh();}
function setComparison(key,kind){
  pauseComparison();comparisonGeneration++;
  comparisonVideos.forEach(v=>{v.removeAttribute('src');v.load();});
  const c=byKey(key),condition=c.conditions.find(x=>x.kind===kind)||c.conditions[0];
  comparisonKey=key;comparisonKind=condition.kind;
  $('comparison-title').textContent=c.name;$('comparison-description').textContent=descriptions[key];
  $('comparison-materials').innerHTML=c.conditions.length>1?c.conditions.map(x=>`<button data-kind="${x.kind}" aria-pressed="${x.kind===condition.kind}">${escapeHTML(x.label)}</button>`).join(''):'';
  $('comparison-materials').hidden=c.conditions.length<2;
  document.querySelectorAll('#comparison-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===key)));
  $('comparison-grid').innerHTML=DATA.methods.map(m=>{const v=condition.videos[m.id];return `<article class="method-card ${m.id==='ours'?'ours':''}"><a class="method-name" href="${v.src}" target="_blank" rel="noopener" title="Open original ${m.name} video">${m.name}<span>${m.id==='ours'?'PhysForge':'MP4'}</span></a><video muted playsinline preload="none" src="${v.src}" poster="${v.poster}" data-duration="${v.duration}" aria-label="${escapeHTML(c.name+', '+condition.label+', '+m.name)}"></video></article>`;}).join('');
  comparisonVideos=[...$('comparison-grid').querySelectorAll('video')];
  $('comparison-error').hidden=true;$('comparison-speed').value='1';
  comparisonVideos.forEach(v=>{
    ['loadedmetadata','timeupdate','pause','ended'].forEach(event=>v.addEventListener(event,comparisonRefresh));
    v.addEventListener('play',()=>{if(!comparisonFrame)comparisonFrame=requestAnimationFrame(comparisonTick);});
    v.addEventListener('error',()=>{$('comparison-error').hidden=false;});
  });
  comparisonRefresh();
}
$('comparison-tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-case]');if(b)setComparison(b.dataset.case,'soft');});
$('comparison-materials').addEventListener('click',e=>{const b=e.target.closest('button[data-kind]');if(b)setComparison(comparisonKey,b.dataset.kind);});
$('comparison-play').addEventListener('click',async()=>{
  if(comparisonVideos.some(v=>!v.paused&&!v.ended)){pauseComparison();return;}
  if(comparisonVideos.every(v=>v.ended))comparisonVideos.forEach(v=>v.currentTime=0);
  const generation=comparisonGeneration;
  const results=await Promise.allSettled(comparisonVideos.filter(v=>!v.ended).map(v=>v.play()));
  if(generation===comparisonGeneration&&results.some(r=>r.status==='rejected'))$('comparison-error').hidden=false;
});
$('comparison-reset').addEventListener('click',()=>{pauseComparison();comparisonVideos.forEach(v=>{v.currentTime=0;});comparisonRefresh();});
$('comparison-speed').addEventListener('change',e=>comparisonVideos.forEach(v=>v.playbackRate=Number(e.target.value)));
$('comparison-seek').addEventListener('input',e=>{
  const time=Number(e.target.value);
  comparisonVideos.forEach(v=>{
    const seek=()=>{v.currentTime=Math.min(time,Number.isFinite(v.duration)?v.duration:Number(v.dataset.duration));};
    if(v.readyState)seek();else{v.addEventListener('loadedmetadata',seek,{once:true});v.load();}
  });
});
setComparison(comparisonKey,comparisonKind);

// The remaining library only references PhysForge (Ours) media.
let materialFilter='all',materialLimit=8,componentLimit=6;
const galleryObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)entry.target.pause();}),{threshold:.05});
function cardHTML(c){
  const condition=c.conditions[c.conditions.length>1?c.conditions.length-1:0],v=condition.videos.ours;
  return `<article class="result-card" data-key="${c.key}"><div class="result-media"><video muted playsinline loop preload="none" src="${v.src}" poster="${v.poster}" aria-label="${escapeHTML(c.name+', '+condition.label+', PhysForge')}"></video><button class="card-play" aria-label="Play ${escapeHTML(c.name)} simulation">Play</button><span class="result-id">${c.id}</span></div><div class="result-info"><h3>${escapeHTML(c.name)}</h3>${c.section==='material'?`<div class="card-materials" role="group" aria-label="${escapeHTML(c.name+' material')}">${c.conditions.length>1?c.conditions.map(x=>`<button data-kind="${x.kind}" aria-pressed="${x.kind===condition.kind}">${escapeHTML(x.label)}</button>`).join(''):`<span class="material-static">${escapeHTML(condition.label)}</span>`}</div>`:''}</div><p class="media-error" hidden>Playback unavailable. <a href="${v.src}">Open video</a>.</p></article>`;
}
function registerCards(container){
  container.querySelectorAll('video').forEach(v=>{
    galleryObserver.observe(v);
    const button=v.closest('article').querySelector('.card-play');
    button.addEventListener('click',()=>{v.controls=true;v.play().catch(()=>{v.controls=false;v.closest('article').querySelector('.media-error').hidden=false;});});
    v.addEventListener('play',()=>{button.hidden=true;v.controls=true;});
    v.addEventListener('pause',()=>{button.hidden=false;v.controls=false;});
    v.addEventListener('error',()=>{v.closest('article').querySelector('.media-error').hidden=false;});
  });
}
function clearGallery(container){container.querySelectorAll('video').forEach(v=>{v.pause();galleryObserver.unobserve(v);v.removeAttribute('src');v.load();});container.replaceChildren();}
function renderMaterials(){
  const cases=DATA.cases.filter(c=>c.section==='material'&&(materialFilter==='all'||(materialFilter==='solid'?['triple','double'].includes(c.group):c.group===materialFilter)));
  clearGallery($('material-gallery'));$('material-gallery').innerHTML=cases.slice(0,materialLimit).map(cardHTML).join('');registerCards($('material-gallery'));
  $('gallery-count').textContent=`${Math.min(materialLimit,cases.length)} of ${cases.length} objects`;
  $('material-more').hidden=materialLimit>=cases.length;
  $('material-more').textContent=`Show more objects (${cases.length-Math.min(materialLimit,cases.length)} remaining)`;
}
function renderComponents(){
  const cases=DATA.cases.filter(c=>c.section==='components');clearGallery($('component-gallery'));
  $('component-gallery').innerHTML=cases.slice(0,componentLimit).map(cardHTML).join('');registerCards($('component-gallery'));
  $('component-more').hidden=componentLimit>=cases.length;
}
$('material-gallery').addEventListener('click',e=>{
  const b=e.target.closest('button[data-kind]');if(!b)return;
  const card=b.closest('article'),c=byKey(card.dataset.key),condition=c.conditions.find(x=>x.kind===b.dataset.kind),v=condition.videos.ours;
  const video=card.querySelector('video'),playing=!video.paused;
  video.pause();video.poster=v.poster;video.src=v.src;video.setAttribute('aria-label',`${c.name}, ${condition.label}, PhysForge`);
  card.querySelector('.media-error').hidden=true;card.querySelector('.media-error a').href=v.src;video.load();
  card.querySelectorAll('button[data-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
  if(playing)video.play().catch(()=>{});
});
$('gallery-filters').addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(!b)return;materialFilter=b.dataset.filter;materialLimit=8;document.querySelectorAll('#gallery-filters button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderMaterials();});
$('material-more').addEventListener('click',()=>{materialLimit+=12;renderMaterials();});
$('component-more').addEventListener('click',()=>{componentLimit=13;renderComponents();});
renderMaterials();renderComponents();
new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting){if(entry.target===hero)hero.pause();else pauseComparison();}}),{threshold:.05}).observe(hero);
const compareObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)pauseComparison();}),{threshold:.05});compareObserver.observe($('comparison-grid'));
$('open-method').addEventListener('click',()=>$('method-dialog').showModal());
$('close-method').addEventListener('click',()=>$('method-dialog').close());
$('method-dialog').addEventListener('click',e=>{if(e.target===$('method-dialog'))$('method-dialog').close();});

'use strict';
const DATA=window.PHYSFORGE_DATA, CONFIG=window.PHYSFORGE_CONFIG;
const byKey=key=>DATA.cases.find(c=>c.key===key), $=id=>document.getElementById(id);
const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const singlePlayers=new WeakMap();
function bindSinglePlayer(video,controls,onError){
  const play=controls.querySelector('.single-play'),reset=controls.querySelector('.single-reset');
  const seek=controls.querySelector('.single-seek'),time=controls.querySelector('.single-time');
  let frame=0,seekVersion=0;
  video.controls=false;video.loop=false;
  function refresh(){
    const duration=Number.isFinite(video.duration)?video.duration:Number(video.dataset.duration)||5;
    const current=Math.min(video.currentTime||0,duration);
    play.textContent=video.paused||video.ended?'Play':'Pause';
    play.setAttribute('aria-label',play.textContent+' '+video.getAttribute('aria-label'));
    seek.max=duration;seek.value=current;
    time.textContent=`${current.toFixed(1)} / ${duration.toFixed(1)} s`;
  }
  function tick(){refresh();frame=video.paused||video.ended?0:requestAnimationFrame(tick);}
  function stop(){cancelAnimationFrame(frame);frame=0;refresh();}
  function moveTo(value){
    const version=++seekVersion,source=video.getAttribute('src');
    const apply=()=>{if(version!==seekVersion||video.getAttribute('src')!==source)return;video.currentTime=Math.min(value,Number.isFinite(video.duration)?video.duration:5);refresh();};
    if(video.readyState>=1)apply();else{video.addEventListener('loadedmetadata',apply,{once:true});video.load();}
  }
  play.addEventListener('click',()=>{
    if(!video.paused&&!video.ended){video.pause();return;}
    if(video.ended)moveTo(0);
    video.play().catch(onError);
  });
  reset.addEventListener('click',()=>{video.pause();moveTo(0);});
  seek.addEventListener('input',()=>moveTo(Number(seek.value)));
  video.addEventListener('play',()=>{cancelAnimationFrame(frame);tick();});
  ['pause','ended'].forEach(event=>video.addEventListener(event,stop));
  ['loadedmetadata','timeupdate','seeked','emptied'].forEach(event=>video.addEventListener(event,refresh));
  video.addEventListener('error',onError);
  singlePlayers.set(video,{refresh,dispose(){++seekVersion;video.pause();stop();}});
  refresh();
}
document.querySelectorAll('[data-arxiv]').forEach(a=>{if(CONFIG.arxivUrl){a.href=CONFIG.arxivUrl;a.removeAttribute('aria-disabled');a.querySelector('span').textContent='Paper';}});
document.querySelectorAll('[data-code]').forEach(a=>a.href=CONFIG.codeUrl);
if(CONFIG.authors.length){$('authors').replaceChildren(...CONFIG.authors.flatMap((a,i)=>{const e=document.createElement(a.url?'a':'span');e.textContent=a.name+(a.affiliation?' · '+a.affiliation:'');if(a.url)e.href=a.url;return i?[document.createTextNode(' / '),e]:[e];}));}
let heroCase='material/001',heroKind=byKey(heroCase).conditions[0].kind,heroGeneration=0;
const hero=$('hero-video');
function setHero(key,kind){
  const c=byKey(key);heroCase=key;heroKind=kind;
  const condition=c.conditions.find(x=>x.kind===kind)||c.conditions[0],v=condition.videos.ours;
  const generation=++heroGeneration;
  hero.pause();hero.poster=v.poster;hero.src=v.src;hero.load();singlePlayers.get(hero)?.refresh();
  hero.setAttribute('aria-label',`${c.name}, ${condition.label}, PhysForge`);
  $('hero-error').hidden=true;$('hero-original').href=v.src;
  $('hero-materials').innerHTML=c.conditions.map(x=>`<button data-kind="${x.kind}" aria-pressed="${x.kind===condition.kind}">${escapeHTML(x.label)}</button>`).join('');
  document.querySelectorAll('[data-hero-object]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.heroObject===key)));
  hero.addEventListener('loadedmetadata',()=>{if(generation!==heroGeneration)return;hero.currentTime=0;},{once:true});
}
$('hero-materials').addEventListener('click',e=>{const b=e.target.closest('button[data-kind]');if(b)setHero(heroCase,b.dataset.kind);});
document.querySelectorAll('[data-hero-object]').forEach(b=>b.addEventListener('click',()=>setHero(b.dataset.heroObject,byKey(b.dataset.heroObject).conditions[0].kind)));
bindSinglePlayer(hero,$('hero-play').closest('.single-controls'),()=>{$('hero-error').hidden=false;});
setHero(heroCase,heroKind);
document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('video').forEach(v=>v.pause());});

// Curated comparisons show the first five seconds and a shared elapsed-time axis.
let comparisonKey='material/101',comparisonKind=byKey(comparisonKey).conditions[0].kind,comparisonVideos=[],comparisonGeneration=0,comparisonFrame=0;
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
  $('comparison-materials').innerHTML=c.conditions.length>1?c.conditions.map(x=>`<button data-kind="${x.kind}" aria-pressed="${x.kind===condition.kind}">${escapeHTML(x.label)}</button>`).join(''):`<button data-kind="${condition.kind}" aria-pressed="true">${c.section==='components'?'Components':escapeHTML(condition.label)}</button>`;
  $('comparison-materials').hidden=false;
  document.querySelectorAll('#comparison-tabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.case===key)));
  $('comparison-grid').innerHTML=DATA.methods.map(m=>{const v=condition.videos[m.id];return `<article class="method-card ${m.id==='ours'?'ours':''}"><a class="method-name" href="${v.src}" target="_blank" rel="noopener" title="Open ${m.name} video clip">${m.id==='ours'?'PhysForge':m.name}</a><video muted playsinline preload="none" src="${v.src}" poster="${v.poster}" data-duration="${v.duration}" aria-label="${escapeHTML(c.name+', '+condition.label+', '+m.name)}"></video></article>`;}).join('');
  comparisonVideos=[...$('comparison-grid').querySelectorAll('video')];
  $('comparison-error').hidden=true;
  comparisonVideos.forEach(v=>{
    ['loadedmetadata','timeupdate','pause','ended'].forEach(event=>v.addEventListener(event,comparisonRefresh));
    v.addEventListener('play',()=>{if(!comparisonFrame)comparisonFrame=requestAnimationFrame(comparisonTick);});
    v.addEventListener('error',()=>{$('comparison-error').hidden=false;});
  });
  comparisonRefresh();
}
$('comparison-tabs').addEventListener('click',e=>{const b=e.target.closest('button[data-case]');if(b)setComparison(b.dataset.case,byKey(b.dataset.case).conditions[0].kind);});
$('comparison-materials').addEventListener('click',e=>{const b=e.target.closest('button[data-kind]');if(b)setComparison(comparisonKey,b.dataset.kind);});
$('comparison-play').addEventListener('click',async()=>{
  if(comparisonVideos.some(v=>!v.paused&&!v.ended)){pauseComparison();return;}
  if(comparisonVideos.every(v=>v.ended))comparisonVideos.forEach(v=>v.currentTime=0);
  const generation=comparisonGeneration;
  const results=await Promise.allSettled(comparisonVideos.filter(v=>!v.ended).map(v=>v.play()));
  if(generation===comparisonGeneration&&results.some(r=>r.status==='rejected'))$('comparison-error').hidden=false;
});
$('comparison-reset').addEventListener('click',()=>{pauseComparison();comparisonVideos.forEach(v=>{v.currentTime=0;});comparisonRefresh();});
$('comparison-seek').addEventListener('input',e=>{
  const time=Number(e.target.value);
  comparisonVideos.forEach(v=>{
    const seek=()=>{v.currentTime=Math.min(time,Number.isFinite(v.duration)?v.duration:Number(v.dataset.duration));};
    if(v.readyState)seek();else{v.addEventListener('loadedmetadata',seek,{once:true});v.load();}
  });
});
setComparison(comparisonKey,comparisonKind);

// Each case appears in exactly one section; supplementary cases are ordered first.
const featuredKeys=new Set([...document.querySelectorAll('[data-hero-object], #comparison-tabs [data-case]')].map(e=>e.dataset.heroObject||e.dataset.case));
const galleryCases=DATA.cases.filter(c=>!featuredKeys.has(c.key));
let materialFilter='all',materialLimit=8,componentLimit=6;
const galleryObserver=new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting)entry.target.pause();}),{threshold:.05});
function cardHTML(c){
  const condition=c.conditions[0],v=condition.videos.ours;
  return `<article class="result-card" data-key="${c.key}"><div class="result-media"><video muted playsinline preload="metadata" src="${v.src}" poster="${v.poster}" aria-label="${escapeHTML(c.name+', '+condition.label+', PhysForge')}"></video></div><div class="single-controls"><button type="button" class="single-play card-play" aria-label="Play ${escapeHTML(c.name)} simulation">Play</button><button type="button" class="single-reset" aria-label="Reset ${escapeHTML(c.name)} simulation">Reset</button><output class="single-time">0.0 / ${v.duration.toFixed(1)} s</output><input class="single-seek" type="range" min="0" max="${v.duration}" step="0.01" value="0" aria-label="${escapeHTML(c.name)} playback time"></div><div class="result-info"><h3>${escapeHTML(c.name)}</h3>${c.section==='material'?`<div class="card-materials" role="group" aria-label="${escapeHTML(c.name+' material')}">${c.conditions.length>1?c.conditions.map(x=>`<button data-kind="${x.kind}" aria-pressed="${x.kind===condition.kind}">${escapeHTML(x.label)}</button>`).join(''):`<span class="material-static">${escapeHTML(condition.label)}</span>`}</div>`:''}</div><p class="media-error" hidden>Playback unavailable. <a href="${v.src}">Open video</a>.</p></article>`;
}
function registerCards(container){
  container.querySelectorAll('video').forEach(video=>{
    galleryObserver.observe(video);
    const card=video.closest('article');
    bindSinglePlayer(video,card.querySelector('.single-controls'),()=>{card.querySelector('.media-error').hidden=false;});
  });
}
function clearGallery(container){container.querySelectorAll('video').forEach(v=>{singlePlayers.get(v)?.dispose();galleryObserver.unobserve(v);v.removeAttribute('src');v.load();});container.replaceChildren();}
function renderMaterials(){
  const cases=galleryCases.filter(c=>c.section==='material'&&(materialFilter==='all'||(materialFilter==='solid'?['triple','double'].includes(c.group):c.group===materialFilter)));
  clearGallery($('material-gallery'));$('material-gallery').innerHTML=cases.slice(0,materialLimit).map(cardHTML).join('');registerCards($('material-gallery'));
  $('gallery-count').textContent=`${Math.min(materialLimit,cases.length)} of ${cases.length} objects`;
  $('material-more').hidden=materialLimit>=cases.length;
  $('material-more').textContent='Show more';
  $('material-less').hidden=materialLimit<=8||cases.length<=8;
}
function renderComponents(){
  const cases=galleryCases.filter(c=>c.section==='components');clearGallery($('component-gallery'));
  $('component-gallery').innerHTML=cases.slice(0,componentLimit).map(cardHTML).join('');registerCards($('component-gallery'));
  $('component-more').hidden=cases.length<=6;
  $('component-more').textContent=componentLimit>6?'Show less':'Show more';
  $('component-more').setAttribute('aria-expanded',String(componentLimit>6));
}
$('material-gallery').addEventListener('click',e=>{
  const b=e.target.closest('button[data-kind]');if(!b)return;
  const card=b.closest('article'),c=byKey(card.dataset.key),condition=c.conditions.find(x=>x.kind===b.dataset.kind),v=condition.videos.ours;
  const video=card.querySelector('video');
  video.pause();video.poster=v.poster;video.src=v.src;video.setAttribute('aria-label',`${c.name}, ${condition.label}, PhysForge`);
  card.querySelector('.media-error').hidden=true;card.querySelector('.media-error a').href=v.src;video.load();singlePlayers.get(video)?.refresh();
  card.querySelectorAll('button[data-kind]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
});
$('gallery-filters').addEventListener('click',e=>{const b=e.target.closest('button[data-filter]');if(!b)return;materialFilter=b.dataset.filter;materialLimit=8;document.querySelectorAll('#gallery-filters button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));renderMaterials();});
$('material-more').addEventListener('click',()=>{materialLimit+=12;renderMaterials();});
$('material-less').addEventListener('click',()=>{materialLimit=8;renderMaterials();$('gallery').scrollIntoView({block:'start'});$('material-more').focus({preventScroll:true});});
$('component-more').addEventListener('click',()=>{const collapse=componentLimit>6;componentLimit=collapse?6:Infinity;renderComponents();if(collapse){$('components').scrollIntoView({block:'start'});$('component-more').focus({preventScroll:true});}});
renderMaterials();renderComponents();
new IntersectionObserver(entries=>entries.forEach(entry=>{if(!entry.isIntersecting){if(entry.target===hero)hero.pause();else pauseComparison();}}),{threshold:.05}).observe(hero);
const compareObserver=new IntersectionObserver(entries=>entries.forEach(e=>{if(!e.isIntersecting)pauseComparison();}),{threshold:.05});compareObserver.observe($('comparison-grid'));
$('open-method').addEventListener('click',()=>$('method-dialog').showModal());
$('close-method').addEventListener('click',()=>$('method-dialog').close());
$('method-dialog').addEventListener('click',e=>{if(e.target===$('method-dialog'))$('method-dialog').close();});

const FALLBACK = [
  {title:'Bolhas, realidade e a nova vida digital',description:'Sobre bolhas, vida digital e as diferentes formas de enxergar a realidade.',duration:'28:47',audio:''},
  {title:'Até quando a tecnologia é um problema?',description:'Uma reflexão sobre conforto, dependência e a forma como a tecnologia reorganiza a nossa rotina.',duration:'31:12',audio:''},
  {title:'Silêncio, pensamentos e o que continua ecoando',description:'O que sobra quando a distração acaba e a cabeça finalmente ganha espaço para falar?',duration:'26:35',audio:''},
  {title:'Rotina, caos e a busca por sentido',description:'Entre repetição, ansiedade e pequenas mudanças que podem redefinir a forma como vivemos.',duration:'34:20',audio:''},
];
const grid=document.getElementById('episodeGrid');
const player=document.getElementById('audioPlayer');
const featured=document.getElementById('featuredEpisode');
const playBtn=document.getElementById('featuredPlay');
let currentAudio='';
function esc(s=''){return String(s).replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function niceDate(date){try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',year:'numeric'}).format(new Date(date))}catch{return ''}}
function renderEpisodes(items){grid.innerHTML=items.slice(0,8).map((ep,i)=>`<article class="episode-card"><div class="episode-thumb"></div><div class="episode-body"><small>EP. ${String(i+1).padStart(2,'0')}</small><h3>${esc(ep.title)}</h3><p>${esc((ep.description||'').slice(0,125))}${(ep.description||'').length>125?'…':''}</p><div class="episode-meta"><span>${esc(ep.duration||'')}</span><span>${ep.date?niceDate(ep.date):''}</span></div></div></article>`).join('')}
function setFeatured(ep){if(!ep)return;featured.querySelector('h2').textContent=ep.title;featured.querySelector('p').textContent=(ep.description||'').slice(0,180)||'Novo episódio do Entre Ruidos.';document.getElementById('featuredDuration').textContent=ep.duration||'—';currentAudio=ep.audio||''}
async function loadFeed(){try{const r=await fetch('/api/rss');if(!r.ok)throw new Error('feed');const data=await r.json();const eps=data.episodes?.length?data.episodes:FALLBACK;renderEpisodes(eps);setFeatured(eps[0])}catch{renderEpisodes(FALLBACK);setFeatured(FALLBACK[0])}}
playBtn.addEventListener('click',()=>{if(!currentAudio){window.open('https://open.spotify.com/show/2eFMUbMzyoF9zrpsntjlKg','_blank');return}if(player.src!==currentAudio)player.src=currentAudio;if(player.paused){player.play();playBtn.textContent='Ⅱ'}else{player.pause();playBtn.textContent='▶'}});player.addEventListener('ended',()=>playBtn.textContent='▶');loadFeed();

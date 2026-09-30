const FALLBACK = [
  {
    title: 'Bolha vs Realidade',
    description: 'Neste episódio, falamos sobre o apego às nossas “bolhas”, a nova forma de viver no mundo digital e as diferentes maneiras de enxergar e lidar com a realidade.',
    duration: '00:19:54',
    audio: '',
    date: '2026-09-25',
    image: '/assets/episode-bolha.png'
  },
  {
    title: 'A alta tecnologia',
    description: 'Até quando a tecnologia facilita a nossa vida — e em que momento ela começa a controlar nossos hábitos, escolhas e até a forma como enxergamos o mundo?',
    duration: '00:25:33',
    audio: '',
    date: '2026-09-24',
    image: '/assets/episode-tech.png'
  }
];

const grid = document.getElementById('episodeGrid');
const startGrid = document.getElementById('startGrid');
const episodeDetail = document.getElementById('episodeDetail');
const detailBack = document.getElementById('detailBack');
const detailArt = document.getElementById('detailArt');
const detailLabel = document.getElementById('detailLabel');
const detailTitle = document.getElementById('detailTitle');
const detailDate = document.getElementById('detailDate');
const detailDuration = document.getElementById('detailDuration');
const detailDescription = document.getElementById('detailDescription');
const detailFullDescription = document.getElementById('detailFullDescription');
const detailRelated = document.getElementById('detailRelated');
const detailPlayerPanel = document.getElementById('detailPlayerPanel');
const detailPlayBtn = document.getElementById('detailPlayBtn');
const detailRewind10Btn = document.getElementById('detailRewind10Btn');
const detailForward10Btn = document.getElementById('detailForward10Btn');
const detailProgressBar = document.getElementById('detailProgressBar');
const detailCurrentTime = document.getElementById('detailCurrentTime');
const detailDurationTime = document.getElementById('detailDurationTime');
const detailRateBtn = document.getElementById('detailRateBtn');
const detailMuteBtn = document.getElementById('detailMuteBtn');
const detailVolumeBar = document.getElementById('detailVolumeBar');
const detailSpotify = document.getElementById('detailSpotify');
const detailYouTube = document.getElementById('detailYouTube');
const detailDownload = document.getElementById('detailDownload');
const detailShare = document.getElementById('detailShare');

const miniPlayer = document.getElementById('miniPlayer');
const miniTitle = document.getElementById('miniTitle');
const miniRewind = document.getElementById('miniRewind');
const miniPlay = document.getElementById('miniPlay');
const miniForward = document.getElementById('miniForward');
const miniProgress = document.getElementById('miniProgress');
const miniTime = document.getElementById('miniTime');
const miniRate = document.getElementById('miniRate');
const miniMute = document.getElementById('miniMute');
const miniVolume = document.getElementById('miniVolume');
const miniClose = document.getElementById('miniClose');
const player = document.getElementById('audioPlayer');
const featuredLabel = document.getElementById('featuredLabel');
const featuredTitle = document.getElementById('featuredTitle');
const featuredDescription = document.getElementById('featuredDescription');
const featuredDuration = document.getElementById('featuredDuration');
const featuredArt = document.getElementById('featuredArt');
const playBtn = document.getElementById('featuredPlay');
const rewind10Btn = document.getElementById('rewind10Btn');
const forward10Btn = document.getElementById('forward10Btn');
const playbackRateBtn = document.getElementById('playbackRateBtn');
const downloadEpisodeBtn = document.getElementById('downloadEpisodeBtn');
const shareEpisodeBtn = document.getElementById('shareEpisodeBtn');
const spotifyEpisodeLink = document.getElementById('spotifyEpisodeLink');
const progressBar = document.getElementById('progressBar');
const volumeBar = document.getElementById('volumeBar');
const muteBtn = document.getElementById('muteBtn');
const currentTimeLabel = document.getElementById('currentTime');
const episodeArchiveCta = document.getElementById('episodeArchiveCta');
const episodeArchiveBtn = document.getElementById('episodeArchiveBtn');
const episodeArchive = document.getElementById('episodeArchive');
const archiveList = document.getElementById('archiveList');
const archiveCount = document.getElementById('archiveCount');
const episodeSearch = document.getElementById('episodeSearch');
const archivePrev = document.getElementById('archivePrev');
const archiveNext = document.getElementById('archiveNext');
const archivePages = document.getElementById('archivePages');

const HOME_EPISODE_COUNT = 2;
const ARCHIVE_PAGE_SIZE = 10;
const FEATURED_DESCRIPTION_LIMIT = 185;

let episodes = [];
let currentEpisode = null;
let rafId = null;
let archivePage = 1;
let archiveQuery = '';
let detailEpisode = null;
let hasPlaybackSession = false;
let miniDismissed = false;
let fullPlayerVisible = true;
const PLAYBACK_RATES = [1, 1.5, 2];
let playbackRateIndex = 0;
const SPOTIFY_SHOW_URL = 'https://open.spotify.com/show/2eFMUbMzyoF9zrpsntjlKg';

function slugify(value = '') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function episodePath(ep = {}) {
  return `/episodios/${slugify(ep.title || 'episodio')}`;
}

function absoluteEpisodeUrl(ep = {}) {
  return new URL(episodePath(ep), window.location.origin).href;
}

function episodeBySlug(slug = '') {
  return episodes.find((ep) => slugify(ep.title) === slug) || null;
}

function esc(s = '') {
  return String(s).replace(/[&<>\"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function formatDate(date) {
  try {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit', month: 'short', year: 'numeric'
    }).format(new Date(date));
  } catch {
    return '';
  }
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '00:00';
  const total = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function parseDuration(value = '') {
  if (!value) return 0;
  if (/^\d+$/.test(value)) return Number(value);
  const parts = String(value).split(':').map(Number);
  if (parts.some(Number.isNaN)) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function resolveArt(ep = {}) {
  return ep.image || '/assets/cover.png';
}

function truncateText(value = '', limit = FEATURED_DESCRIPTION_LIMIT) {
  const text = String(value).replace(/\s+/g, ' ').trim();
  if (text.length <= limit) return text;
  const clipped = text.slice(0, limit + 1);
  const lastSpace = clipped.lastIndexOf(' ');
  const cutAt = lastSpace > Math.floor(limit * 0.72) ? lastSpace : limit;
  return `${clipped.slice(0, cutAt).trim()}...`;
}

function episodeNumber(index) {
  return String(Math.max(1, episodes.length - index)).padStart(2, '0');
}

function renderHomeEpisodes() {
  const items = episodes.slice(0, HOME_EPISODE_COUNT);

  grid.innerHTML = items.map((ep, index) => `
    <article class="episode-card">
      <div class="episode-top">
        <span>EP. ${episodeNumber(index)}</span>
        <span>${esc(ep.duration || '—')}</span>
      </div>
      <h3>${esc(ep.title)}</h3>
      <p>${esc(ep.description || '')}</p>
      <div class="episode-actions">
        <button type="button" class="small-btn primary" data-play-index="${index}">Ouvir</button>
        <a class="small-btn" href="${episodePath(ep)}" data-detail-index="${index}">Detalhes</a>
      </div>
      <div class="episode-meta">
        <span>${ep.date ? formatDate(ep.date) : ''}</span>
        <span>${esc(ep.duration || '—')}</span>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('[data-play-index]').forEach((button) => {
    button.addEventListener('click', () => playEpisodeByIndex(Number(button.dataset.playIndex)));
  });
  grid.querySelectorAll('[data-detail-index]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openEpisodeDetail(episodes[Number(link.dataset.detailIndex)]);
    });
  });

  const hasArchive = episodes.length > HOME_EPISODE_COUNT;
  if (episodeArchiveCta) episodeArchiveCta.hidden = !hasArchive;
}

function renderStartHere() {
  if (!startGrid || !episodes.length) return;

  const preferred = ['persona', 'bolha', 'tecnologia'];
  const selected = [];
  for (const key of preferred) {
    const found = episodes.find((ep) => slugify(ep.title).includes(key) && !selected.includes(ep));
    if (found) selected.push(found);
  }
  for (const ep of episodes) {
    if (selected.length >= 3) break;
    if (!selected.includes(ep)) selected.push(ep);
  }

  startGrid.innerHTML = selected.slice(0, 3).map((ep) => {
    const index = episodes.indexOf(ep);
    return `
      <article class="start-card">
        <span class="start-number">EP. ${episodeNumber(index)}</span>
        <h3>${esc(ep.title)}</h3>
        <p>${esc(ep.description || '')}</p>
        <a href="${episodePath(ep)}" data-start-detail="${index}">Conhecer episódio →</a>
      </article>
    `;
  }).join('');

  startGrid.querySelectorAll('[data-start-detail]').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      openEpisodeDetail(episodes[Number(link.dataset.startDetail)]);
    });
  });
}

function getFilteredEpisodes() {
  const query = archiveQuery.trim().toLocaleLowerCase('pt-BR');
  return episodes
    .map((ep, index) => ({ ep, index }))
    .filter(({ ep }) => {
      if (!query) return true;
      const haystack = `${ep.title || ''} ${ep.description || ''}`.toLocaleLowerCase('pt-BR');
      return haystack.includes(query);
    });
}

function getPageTokens(totalPages, currentPage) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const tokens = [1];
  const startPage = Math.max(2, currentPage - 1);
  const endPage = Math.min(totalPages - 1, currentPage + 1);
  if (startPage > 2) tokens.push('…');
  for (let page = startPage; page <= endPage; page += 1) tokens.push(page);
  if (endPage < totalPages - 1) tokens.push('…');
  tokens.push(totalPages);
  return tokens;
}

function renderArchive() {
  const filtered = getFilteredEpisodes();
  const totalPages = Math.max(1, Math.ceil(filtered.length / ARCHIVE_PAGE_SIZE));
  archivePage = Math.min(Math.max(1, archivePage), totalPages);

  const startIndex = (archivePage - 1) * ARCHIVE_PAGE_SIZE;
  const pageItems = filtered.slice(startIndex, startIndex + ARCHIVE_PAGE_SIZE);

  archiveCount.textContent = archiveQuery
    ? `${filtered.length} episódio${filtered.length === 1 ? '' : 's'} encontrado${filtered.length === 1 ? '' : 's'}`
    : `${episodes.length} episódio${episodes.length === 1 ? '' : 's'} no arquivo`;

  if (!pageItems.length) {
    archiveList.innerHTML = '<div class="archive-empty">Nenhum episódio encontrado para essa busca.</div>';
  } else {
    archiveList.innerHTML = pageItems.map(({ ep, index }) => `
      <article class="archive-item">
        <span class="archive-number">EP. ${episodeNumber(index)}</span>
        <div class="archive-main">
          <h4 class="archive-title">${esc(ep.title)}</h4>
          <p class="archive-description">${esc(ep.description || '')}</p>
        </div>
        <div class="archive-meta">
          <span>${ep.date ? formatDate(ep.date) : ''}</span>
          <span>${esc(ep.duration || '—')}</span>
        </div>
        <div class="archive-actions">
          <button type="button" class="small-btn primary" data-archive-play-index="${index}">Ouvir</button>
        </div>
      </article>
    `).join('');
  }

  archiveList.querySelectorAll('[data-archive-play-index]').forEach((button) => {
    button.addEventListener('click', () => playEpisodeByIndex(Number(button.dataset.archivePlayIndex)));
  });

  archivePrev.disabled = archivePage <= 1;
  archiveNext.disabled = archivePage >= totalPages;
  archivePages.innerHTML = getPageTokens(totalPages, archivePage).map((token) => {
    if (token === '…') return '<span class="archive-ellipsis">…</span>';
    return `<button type="button" class="archive-page-btn${token === archivePage ? ' active' : ''}" data-page="${token}" aria-label="Ir para a página ${token}" ${token === archivePage ? 'aria-current="page"' : ''}>${token}</button>`;
  }).join('');

  archivePages.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => {
      archivePage = Number(button.dataset.page);
      renderArchive();
      scrollArchiveToTop();
    });
  });
}

function scrollSectionIntoView(target) {
  if (!target) return;
  const header = document.getElementById('siteHeader');
  const offset = (header?.offsetHeight || 0) + 24;
  const anchor = target.id === 'episodios'
    ? (target.querySelector('.section-title') || target)
    : target;
  const top = anchor.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
}

function scrollArchiveToTop() {
  scrollSectionIntoView(document.getElementById('episodios'));
}

function openArchive() {
  if (!episodeArchive || episodes.length <= HOME_EPISODE_COUNT) return;
  grid.hidden = true;
  episodeArchive.hidden = false;
  if (episodeArchiveBtn) {
    episodeArchiveBtn.textContent = '← Voltar aos episódios recentes';
    episodeArchiveBtn.setAttribute('aria-expanded', 'true');
  }
  renderArchive();
  scrollArchiveToTop();
}

function closeArchive() {
  if (!episodeArchive) return;
  episodeArchive.hidden = true;
  grid.hidden = false;
  if (episodeArchiveBtn) {
    episodeArchiveBtn.textContent = 'Ver todos os episódios →';
    episodeArchiveBtn.setAttribute('aria-expanded', 'false');
  }
  scrollSectionIntoView(document.getElementById('episodios'));
}

function playEpisodeByIndex(index) {
  const ep = episodes[index];
  if (!ep) return;
  setFeatured(ep, true);
  document.getElementById('featuredEpisode')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setFeatured(ep, autoload = false) {
  currentEpisode = ep;
  const episodeIndex = episodes.indexOf(ep);
  if (featuredLabel) {
    featuredLabel.textContent = episodeIndex === 0
      ? 'EPISÓDIO MAIS RECENTE'
      : `EPISÓDIO ${episodeNumber(episodeIndex)}`;
  }
  featuredTitle.textContent = ep.title || 'Novo episódio';
  featuredDescription.textContent = truncateText(ep.description || 'Novo episódio do Entre Ruidos.');
  featuredDuration.textContent = ep.duration || formatTime(parseDuration(ep.duration));
  featuredArt.src = resolveArt(ep);
  featuredArt.alt = `Arte do episódio ${ep.title || ''}`.trim();
  if (spotifyEpisodeLink) spotifyEpisodeLink.href = ep.spotify || SPOTIFY_SHOW_URL;
  if (downloadEpisodeBtn) downloadEpisodeBtn.disabled = !ep.audio;
  player.playbackRate = PLAYBACK_RATES[playbackRateIndex];

  if (ep.audio) {
    player.src = ep.audio;
    player.load();
  } else {
    player.removeAttribute('src');
    player.load();
  }
  player.playbackRate = PLAYBACK_RATES[playbackRateIndex];
  player.defaultPlaybackRate = PLAYBACK_RATES[playbackRateIndex];

  resetPlayerUI();
  if (autoload && ep.audio) {
    player.play().then(() => updatePlayState()).catch(() => updatePlayState());
  } else {
    updatePlayState();
  }
}

function resetPlayerUI() {
  progressBar.value = 0;
  currentTimeLabel.textContent = '00:00';
}

function updatePlayState() {
  playBtn.textContent = player.paused ? '▶' : 'Ⅱ';
}

function seekBy(seconds) {
  const duration = player.duration || parseDuration(currentEpisode?.duration || '');
  const next = Math.max(0, Math.min(duration || Infinity, (player.currentTime || 0) + seconds));
  player.currentTime = next;
  currentTimeLabel.textContent = formatTime(next);
  progressBar.value = duration ? (next / duration) * 100 : 0;
}

function safeFilename(value = 'episodio') {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\\/:*?"<>|]+/g, '')
    .replace(/\s+/g, ' ')
    .trim() || 'episodio';
}

async function downloadCurrentEpisode() {
  if (!currentEpisode?.audio || !downloadEpisodeBtn) return;

  const originalText = downloadEpisodeBtn.textContent;
  downloadEpisodeBtn.disabled = true;
  downloadEpisodeBtn.textContent = '…';

  try {
    const response = await fetch(currentEpisode.audio);
    if (!response.ok) throw new Error('download');
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `Entre Ruidos - ${safeFilename(currentEpisode.title)}.mp3`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
  } catch {
    window.open(currentEpisode.audio, '_blank', 'noopener,noreferrer');
  } finally {
    downloadEpisodeBtn.disabled = false;
    downloadEpisodeBtn.textContent = originalText;
  }
}

async function shareCurrentEpisode() {
  if (!currentEpisode) return;
  const shareUrl = currentEpisode.spotify || SPOTIFY_SHOW_URL;
  const shareData = {
    title: `${currentEpisode.title} — Entre Ruidos`,
    text: `Ouça "${currentEpisode.title}" no Entre Ruidos.`,
    url: shareUrl
  };

  try {
    if (navigator.share) {
      await navigator.share(shareData);
      return;
    }
    await navigator.clipboard.writeText(`${shareData.text} ${shareUrl}`);
    if (shareEpisodeBtn) {
      const original = shareEpisodeBtn.textContent;
      shareEpisodeBtn.textContent = '✓';
      setTimeout(() => { shareEpisodeBtn.textContent = original; }, 1400);
    }
  } catch {}
}

function updateProgress() {
  const duration = player.duration || parseDuration(currentEpisode?.duration || '');
  const current = player.currentTime || 0;
  currentTimeLabel.textContent = formatTime(current);
  featuredDuration.textContent = duration ? formatTime(duration) : (currentEpisode?.duration || '00:00');
  progressBar.value = duration ? (current / duration) * 100 : 0;
  rafId = !player.paused ? requestAnimationFrame(updateProgress) : null;
}

async function loadFeed() {
  try {
    const r = await fetch('/api/rss');
    if (!r.ok) throw new Error('feed');
    const data = await r.json();
    episodes = (data.episodes?.length ? data.episodes : FALLBACK).map((ep) => ({
      ...ep,
      image: ep.image || '/assets/cover.png'
    }));
  } catch {
    episodes = FALLBACK;
  }

  renderHomeEpisodes();
  setFeatured(episodes[0] || FALLBACK[0]);
}

rewind10Btn?.addEventListener('click', () => seekBy(-10));
forward10Btn?.addEventListener('click', () => seekBy(10));

playbackRateBtn?.addEventListener('click', () => {
  playbackRateIndex = (playbackRateIndex + 1) % PLAYBACK_RATES.length;
  const rate = PLAYBACK_RATES[playbackRateIndex];
  player.playbackRate = rate;
  playbackRateBtn.textContent = `${rate}x`;
});

downloadEpisodeBtn?.addEventListener('click', downloadCurrentEpisode);
shareEpisodeBtn?.addEventListener('click', shareCurrentEpisode);

playBtn.addEventListener('click', async () => {
  if (!currentEpisode?.audio) {
    if (currentEpisode?.link) {
      window.open(currentEpisode.link, '_blank');
    } else {
      window.open('https://open.spotify.com/show/2eFMUbMzyoF9zrpsntjlKg', '_blank');
    }
    return;
  }

  try {
    if (player.paused) {
      await player.play();
      if (!rafId) rafId = requestAnimationFrame(updateProgress);
    } else {
      player.pause();
      if (rafId) cancelAnimationFrame(rafId);
      rafId = null;
    }
  } catch {}
  updatePlayState();
});

progressBar.addEventListener('input', (e) => {
  const duration = player.duration || parseDuration(currentEpisode?.duration || '');
  if (!duration) return;
  player.currentTime = (Number(e.target.value) / 100) * duration;
  currentTimeLabel.textContent = formatTime(player.currentTime);
});

volumeBar.addEventListener('input', (e) => {
  player.volume = Number(e.target.value);
  player.muted = player.volume === 0;
  muteBtn.textContent = player.muted ? '🔇' : '🔊';
});

muteBtn.addEventListener('click', () => {
  player.muted = !player.muted;
  if (player.muted) {
    muteBtn.textContent = '🔇';
  } else {
    muteBtn.textContent = '🔊';
    if (player.volume === 0) {
      player.volume = 1;
      volumeBar.value = '1';
    }
  }
});

player.addEventListener('play', () => {
  updatePlayState();
  if (!rafId) rafId = requestAnimationFrame(updateProgress);
});
player.addEventListener('pause', () => {
  updatePlayState();
  if (rafId) cancelAnimationFrame(rafId);
  rafId = null;
});
player.addEventListener('loadedmetadata', () => {
  featuredDuration.textContent = formatTime(player.duration);
});
player.addEventListener('ended', () => {
  updatePlayState();
  progressBar.value = 0;
  currentTimeLabel.textContent = '00:00';
});

episodeArchiveBtn?.addEventListener('click', () => {
  if (episodeArchive.hidden) openArchive();
  else closeArchive();
});
episodeSearch?.addEventListener('input', (event) => {
  archiveQuery = event.target.value;
  archivePage = 1;
  renderArchive();
});
archivePrev?.addEventListener('click', () => {
  if (archivePage <= 1) return;
  archivePage -= 1;
  renderArchive();
});
archiveNext?.addEventListener('click', () => {
  const totalPages = Math.max(1, Math.ceil(getFilteredEpisodes().length / ARCHIVE_PAGE_SIZE));
  if (archivePage >= totalPages) return;
  archivePage += 1;
  renderArchive();
});

player.volume = Number(volumeBar.value);
loadFeed();

// Navegação de página única: scroll alinhado ao header e URL sempre limpa.
(function setupSinglePageNavigation() {
  const cleanPath = `${window.location.pathname}${window.location.search}`;
  const navLinks = [...document.querySelectorAll('.nav-scroll')];
  const menuLinks = [...document.querySelectorAll('.main-nav .nav-scroll')];

  function cleanUrl() {
    if (window.location.hash) history.replaceState(null, '', cleanPath);
  }

  function setActiveMenu(id) {
    menuLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      const selector = link.getAttribute('href');
      if (!selector || !selector.startsWith('#')) return;
      const target = document.querySelector(selector);
      if (!target) return;
      event.preventDefault();
      scrollSectionIntoView(target);
      if (menuLinks.includes(link)) setActiveMenu(target.id);
      history.replaceState(null, '', cleanPath);
    });
  });

  const observed = ['inicio', 'episodios', 'sobre', 'contato']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let activeFrame = null;
  function updateActiveSection() {
    activeFrame = null;
    const header = document.getElementById('siteHeader');
    const marker = (header?.offsetHeight || 0) + 120;
    let active = observed[0];

    for (const section of observed) {
      if (section.getBoundingClientRect().top <= marker) active = section;
    }

    const nearBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8;
    if (nearBottom) active = document.getElementById('contato') || active;
    if (active) setActiveMenu(active.id);
  }

  function requestActiveUpdate() {
    if (activeFrame !== null) return;
    activeFrame = requestAnimationFrame(updateActiveSection);
  }

  window.addEventListener('scroll', requestActiveUpdate, { passive: true });
  window.addEventListener('resize', requestActiveUpdate);
  updateActiveSection();

  cleanUrl();
  window.addEventListener('hashchange', cleanUrl);
})();

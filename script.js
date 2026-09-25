const CONFIG = {
  rssUrl: "https://anchor.fm/s/117a3989c/podcast/rss",
  spotifyUrl: "https://open.spotify.com/show/2eFMUbMzyoF9zrpsntjlKg",
  youtubeUrl: "https://youtube.com/playlist?list=PLf8QBCduvL78&si=oV5GxzkchUBx6HE9",
  maxEpisodes: 20,
};

const el = {
  list: document.querySelector("#episodesList"),
  message: document.querySelector("#feedMessage"),
  status: document.querySelector("#feedStatus"),
  template: document.querySelector("#episodeTemplate"),
  player: document.querySelector("#player"),
  audio: document.querySelector("#audio"),
  playButton: document.querySelector("#playButton"),
  transportGlyph: document.querySelector("#transportGlyph"),
  playerTitle: document.querySelector("#playerTitle"),
  currentTime: document.querySelector("#currentTime"),
  duration: document.querySelector("#duration"),
  seek: document.querySelector("#seek"),
  volume: document.querySelector("#volume"),
  muteButton: document.querySelector("#muteButton"),
  closePlayer: document.querySelector("#closePlayer"),
};

let episodes = [];
let currentIndex = -1;
let previousVolume = 1;

document.querySelector("#year").textContent = new Date().getFullYear();
["spotifyLink", "footerSpotify"].forEach(id => document.querySelector(`#${id}`).href = CONFIG.spotifyUrl);
["youtubeLink", "footerYoutube"].forEach(id => document.querySelector(`#${id}`).href = CONFIG.youtubeUrl);

function stripHtml(value = "") {
  const doc = new DOMParser().parseFromString(value, "text/html");
  return (doc.body.textContent || "").replace(/\s+/g, " ").trim();
}
function excerpt(value = "", max = 180) {
  const clean = stripHtml(value);
  if (clean.length <= max) return clean;
  return clean.slice(0, max).replace(/\s+\S*$/, "") + "…";
}
function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
    .format(date).replaceAll(" de ", " ").toUpperCase();
}
function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` : `${m}:${String(s).padStart(2,"0")}`;
}
function normalizeDuration(raw = "") {
  if (!raw) return "";
  if (String(raw).includes(":")) return String(raw);
  const n = Number(raw);
  return Number.isFinite(n) ? formatTime(n) : "";
}
function refreshActiveState() {
  const playerVisible = !el.player.hidden;
  document.querySelectorAll(".episode[data-index]").forEach(row => {
    const index = Number(row.dataset.index);
    const selected = index === currentIndex;
    const active = selected && playerVisible;
    const isPlaying = active && !el.audio.paused;
    row.classList.toggle("is-active", active);
    const button = row.querySelector(".listen-here");
    const glyph = row.querySelector(".episode-glyph");
    if (!button || !glyph) return;
    glyph.textContent = isPlaying ? "Ⅱ" : "▶";
    button.setAttribute("aria-label", isPlaying ? "Pausar episódio" : "Reproduzir episódio");
  });
}
function showPlayer() {
  el.player.hidden = false;
  document.body.classList.add("player-open");
}
function loadEpisode(index, autoplay = true) {
  const ep = episodes[index];
  if (!ep?.audio) return;
  if (currentIndex !== index) {
    currentIndex = index;
    el.audio.src = ep.audio;
    el.playerTitle.textContent = ep.title;
    el.currentTime.textContent = "0:00";
    el.duration.textContent = normalizeDuration(ep.duration) || "0:00";
    el.seek.value = 0;
  }
  showPlayer();
  if (autoplay) el.audio.play().catch(() => {});
  refreshActiveState();
}
function toggleEpisode(index) {
  if (currentIndex !== index) return loadEpisode(index, true);

  // Se o player foi fechado, reabra antes de retomar o mesmo episódio.
  if (el.player.hidden) showPlayer();

  el.audio.paused ? el.audio.play().catch(() => {}) : el.audio.pause();
  refreshActiveState();
}
function renderEpisodes(items) {
  episodes = items;
  el.list.innerHTML = "";
  el.message.hidden = true;
  el.status.textContent = `${items.length} episódio${items.length === 1 ? "" : "s"}`;

  if (!items.length) {
    el.message.hidden = false;
    el.message.textContent = "Nenhum episódio encontrado no feed.";
    return;
  }

  items.forEach((ep, index) => {
    const fragment = el.template.content.cloneNode(true);
    const row = fragment.querySelector(".episode");
    row.dataset.index = index;
    fragment.querySelector(".episode-number").textContent = String(index + 1).padStart(2, "0");
    fragment.querySelector(".episode-meta").textContent = [formatDate(ep.date), normalizeDuration(ep.duration)].filter(Boolean).join("  ·  ");
    fragment.querySelector("h3").textContent = ep.title || "Episódio sem título";
    const description = fragment.querySelector(".episode-description");
    const text = excerpt(ep.description || "");
    description.textContent = text;
    if (!text) description.hidden = true;

    const listen = fragment.querySelector(".listen-here");
    const download = fragment.querySelector(".download-episode");
    listen.addEventListener("click", () => toggleEpisode(index));
    if (!ep.audio) {
      listen.disabled = true;
      download.removeAttribute("href");
      download.setAttribute("aria-disabled", "true");
      download.style.pointerEvents = "none";
      download.style.opacity = ".4";
    } else {
      download.href = ep.audio;
      const safeName = (ep.title || `episodio-${index + 1}`).replace(/[\/:*?"<>|]+/g, "-").trim();
      download.target = "_blank";
      download.rel = "noopener noreferrer";
      download.setAttribute("aria-label", `Baixar ${ep.title || "episódio"} em nova aba`);
    }
    el.list.appendChild(fragment);
  });
}

async function loadFeed() {
  try {
    const endpoint = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(CONFIG.rssUrl)}`;
    const response = await fetch(endpoint);
    if (!response.ok) throw new Error("Falha ao carregar RSS");
    const data = await response.json();
    if (data.status !== "ok" || !Array.isArray(data.items)) throw new Error("RSS inválido");

    renderEpisodes(data.items.slice(0, CONFIG.maxEpisodes).map(item => ({
      title: stripHtml(item.title || ""),
      description: item.description || item.content || "",
      date: item.pubDate || "",
      duration: item.enclosure?.duration || "",
      audio: item.enclosure?.link || item.enclosure?.url || "",
    })));
  } catch (error) {
    console.error(error);
    el.list.innerHTML = "";
    el.status.textContent = "feed indisponível";
    el.message.hidden = false;
    el.message.textContent = "Não consegui carregar os episódios agora. Spotify e YouTube continuam disponíveis acima.";
  }
}

el.playButton.addEventListener("click", () => {
  if (currentIndex < 0) return;
  el.audio.paused ? el.audio.play() : el.audio.pause();
});
function setTransportState(isPlaying) {
  el.transportGlyph.textContent = isPlaying ? "Ⅱ" : "▶";
  el.playButton.classList.toggle("is-playing", isPlaying);
  el.playButton.setAttribute("aria-label", isPlaying ? "Pausar" : "Reproduzir");
}
function setRangeFill(input, percent) {
  input.style.setProperty("--fill", `${Math.max(0, Math.min(100, percent))}%`);
}
el.audio.addEventListener("play", () => { setTransportState(true); refreshActiveState(); });
el.audio.addEventListener("pause", () => { setTransportState(false); refreshActiveState(); });
el.audio.addEventListener("ended", () => { setTransportState(false); refreshActiveState(); });
el.audio.addEventListener("loadedmetadata", () => { el.duration.textContent = formatTime(el.audio.duration); });
el.audio.addEventListener("timeupdate", () => {
  el.currentTime.textContent = formatTime(el.audio.currentTime);
  if (Number.isFinite(el.audio.duration) && el.audio.duration > 0) {
    const progress = (el.audio.currentTime / el.audio.duration) * 100;
    el.seek.value = progress;
    setRangeFill(el.seek, progress);
  }
});
el.seek.addEventListener("input", () => {
  if (Number.isFinite(el.audio.duration)) el.audio.currentTime = (Number(el.seek.value) / 100) * el.audio.duration;
});
el.volume.addEventListener("input", () => {
  const volume = Number(el.volume.value);
  el.audio.volume = volume;
  if (volume > 0) previousVolume = volume;
  setRangeFill(el.volume, volume * 100);
  el.muteButton.classList.toggle("is-muted", volume === 0);
});
el.muteButton.addEventListener("click", () => {
  if (el.audio.volume > 0) {
    previousVolume = el.audio.volume;
    el.audio.volume = 0;
    el.volume.value = 0;
    setRangeFill(el.volume, 0);
    el.muteButton.classList.add("is-muted");
  } else {
    el.audio.volume = previousVolume || 1;
    el.volume.value = el.audio.volume;
    setRangeFill(el.volume, el.audio.volume * 100);
    el.muteButton.classList.remove("is-muted");
  }
});
el.closePlayer.addEventListener("click", () => {
  el.audio.pause();
  el.player.hidden = true;
  document.body.classList.remove("player-open");
  refreshActiveState();
});

setRangeFill(el.seek, 0);
setRangeFill(el.volume, 100);
setTransportState(false);
loadFeed();

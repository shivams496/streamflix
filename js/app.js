import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

const IMG_BASE = "https://image.tmdb.org/t/p";
const TMDB_API = "https://api.themoviedb.org/3";

const tmdbHeaders = {
  accept: "application/json",
  Authorization: `Bearer ${TMDB_TOKEN}`,
};

const loader = document.getElementById("loader");
const navbar = document.getElementById("navbar");
const heroEl = document.getElementById("hero");
const rowsWrap = document.getElementById("rows-wrap");
const avatarInitial = document.getElementById("avatar-initial");
const configWarning = document.getElementById("config-warning");
const searchInput = document.getElementById("search-input");
const searchToggle = document.getElementById("search-toggle");
const navLinks = document.querySelectorAll(".nav-links a");

let currentView = "home";

if (!CONFIG_IS_SET) {
  configWarning.classList.remove("hidden");
  configWarning.textContent =
    "⚠ Add your Firebase + TMDB keys in js/config.js — see README.md.";
  loader.classList.add("hidden");
}

// ---- Auth guard ----
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  avatarInitial.textContent = (user.email || "U")[0].toUpperCase();
  if (CONFIG_IS_SET) initApp();
});

document.getElementById("logout-btn").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 40);
});

searchToggle.addEventListener("click", () => {
  searchInput.classList.toggle("open");
  if (searchInput.classList.contains("open")) searchInput.focus();
});

let searchDebounce;
searchInput.addEventListener("input", () => {
  clearTimeout(searchDebounce);
  const q = searchInput.value.trim();
  searchDebounce = setTimeout(() => {
    if (q.length > 1) runSearch(q);
    else loadView(currentView);
  }, 400);
});

navLinks.forEach((link) => {
  link.addEventListener("click", async (e) => {
    e.preventDefault();
    const view = link.dataset.view || "home";
    if (view === currentView) return;
    navLinks.forEach((a) => a.classList.remove("active"));
    link.classList.add("active");
    currentView = view;
    searchInput.value = "";
    searchInput.classList.remove("open");
    loader.classList.remove("hidden");
    try {
      await loadView(view);
    } finally {
      loader.classList.add("hidden");
    }
  });
});

async function tmdbGet(path) {
  const res = await fetch(`${TMDB_API}${path}`, { headers: tmdbHeaders });
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}

const VIEWS = {
  home: {
    heroPath: "/trending/movie/week",
    heroMediaType: "movie",
    rows: [
      { title: "Trending Now", path: "/trending/movie/week", mediaType: "movie" },
      { title: "Popular on StreamFlix", path: "/movie/popular", mediaType: "movie" },
      { title: "Top Rated", path: "/movie/top_rated", mediaType: "movie" },
      { title: "Action & Adventure", path: "/discover/movie?with_genres=28", mediaType: "movie" },
      { title: "Comedies", path: "/discover/movie?with_genres=35", mediaType: "movie" },
      { title: "Sci-Fi & Fantasy", path: "/discover/movie?with_genres=878", mediaType: "movie" },
      { title: "Horror", path: "/discover/movie?with_genres=27", mediaType: "movie" },
    ],
  },
  movies: {
    heroPath: "/movie/popular",
    heroMediaType: "movie",
    rows: [
      { title: "Popular Movies", path: "/movie/popular", mediaType: "movie" },
      { title: "Top Rated Movies", path: "/movie/top_rated", mediaType: "movie" },
      { title: "Now Playing", path: "/movie/now_playing", mediaType: "movie" },
      { title: "Action & Adventure", path: "/discover/movie?with_genres=28", mediaType: "movie" },
      { title: "Comedies", path: "/discover/movie?with_genres=35", mediaType: "movie" },
      { title: "Drama", path: "/discover/movie?with_genres=18", mediaType: "movie" },
      { title: "Horror", path: "/discover/movie?with_genres=27", mediaType: "movie" },
    ],
  },
  tv: {
    heroPath: "/trending/tv/week",
    heroMediaType: "tv",
    rows: [
      { title: "Trending TV Shows", path: "/trending/tv/week", mediaType: "tv" },
      { title: "Popular TV Shows", path: "/tv/popular", mediaType: "tv" },
      { title: "Top Rated TV Shows", path: "/tv/top_rated", mediaType: "tv" },
      { title: "Airing Today", path: "/tv/airing_today", mediaType: "tv" },
      { title: "Action & Adventure", path: "/discover/tv?with_genres=10759", mediaType: "tv" },
      { title: "Comedy", path: "/discover/tv?with_genres=35", mediaType: "tv" },
      { title: "Crime", path: "/discover/tv?with_genres=80", mediaType: "tv" },
    ],
  },
  new: {
    heroPath: "/trending/all/week",
    heroMediaType: "movie",
    rows: [
      { title: "Trending This Week", path: "/trending/all/week", mediaType: "movie" },
      { title: "New Movie Releases", path: "/movie/now_playing", mediaType: "movie" },
      { title: "Currently Airing", path: "/tv/on_the_air", mediaType: "tv" },
      { title: "Upcoming Movies", path: "/movie/upcoming", mediaType: "movie" },
    ],
  },
};

async function initApp() {
  try {
    await loadView("home");
  } catch (err) {
    console.error(err);
    rowsWrap.innerHTML = `<p class="row-empty">Couldn't load content. Check your TMDB token in js/config.js.</p>`;
  } finally {
    loader.classList.add("hidden");
  }
}

async function loadView(view) {
  const config = VIEWS[view] || VIEWS.home;
  try {
    const heroData = await tmdbGet(config.heroPath);
    const heroList = (heroData.results || []).map((m) => ({
      ...m,
      media_type: m.media_type || config.heroMediaType,
    }));
    renderHero(heroList);
    await renderRowSet(config.rows);
  } catch (err) {
    console.error(err);
    rowsWrap.innerHTML = `<p class="row-empty">Couldn't load this section. Check your TMDB token in js/config.js.</p>`;
  }
}

function renderHero(list) {
  const pick = list.filter((m) => m.backdrop_path)[
    Math.floor(Math.random() * Math.min(10, list.length))
  ];
  if (!pick) return;
  heroEl.style.backgroundImage = `url(${IMG_BASE}/original${pick.backdrop_path})`;
  heroEl.innerHTML = `
    <div class="hero-content">
      <div class="hero-eyebrow">Featured</div>
      <h1 class="hero-title">${escapeHtml(pick.title || pick.name)}</h1>
      <p class="hero-desc">${escapeHtml(pick.overview || "")}</p>
      <div class="hero-actions">
        <button class="hero-btn play" data-id="${pick.id}">▶ Play Trailer</button>
        <button class="hero-btn info" data-id="${pick.id}">ⓘ More Info</button>
      </div>
    </div>
  `;
  const heroType = pick.media_type || "movie";
  heroEl.querySelectorAll("[data-id]").forEach((btn) =>
    btn.addEventListener("click", () => openTrailer(pick.id, heroType, pick))
  );
}

async function renderRowSet(rows) {
  rowsWrap.innerHTML = "";
  for (const row of rows) {
    try {
      const data = await tmdbGet(row.path);
      renderRow(row.title, data.results || [], row.mediaType || "movie");
    } catch (err) {
      console.error(`Row failed: ${row.title}`, err);
    }
  }
}

function renderRow(title, items, mediaType = "movie") {
  const withPosters = items.filter((m) => m.poster_path);
  if (!withPosters.length) return;
  const section = document.createElement("div");
  section.className = "row";
  section.innerHTML = `
    <div class="row-title">${escapeHtml(title)}</div>
    <div class="row-track"></div>
  `;
  const track = section.querySelector(".row-track");
  withPosters.forEach((m) => {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <img loading="lazy" src="${IMG_BASE}/w500${m.poster_path}" alt="${escapeHtml(m.title || m.name)}" />
      <div class="card-meta">
        <div class="t">${escapeHtml(m.title || m.name)}</div>
        <div class="r">${m.vote_average ? "★ " + m.vote_average.toFixed(1) : ""}</div>
      </div>
    `;
    card.addEventListener("click", () => openTrailer(m.id, m.media_type || mediaType, m));
    track.appendChild(card);
  });
  rowsWrap.appendChild(section);
}

async function runSearch(query) {
  loader.classList.remove("hidden");
  try {
    const data = await tmdbGet(`/search/multi?query=${encodeURIComponent(query)}`);
    const results = (data.results || []).filter(
      (r) => r.media_type === "movie" || r.media_type === "tv"
    );
    rowsWrap.innerHTML = "";
    renderRow(`Results for "${query}"`, results, "movie");
    if (!results.length) {
      rowsWrap.innerHTML = `<p class="row-empty">No matches for "${escapeHtml(query)}".</p>`;
    }
  } catch (err) {
    console.error(err);
  } finally {
    loader.classList.add("hidden");
  }
}

// ---- Trailer modal player ----
const modal = document.getElementById("modal-overlay");
const modalVideoWrap = document.getElementById("modal-video-wrap");
const modalTitle = document.getElementById("modal-title");
const modalDesc = document.getElementById("modal-desc");
const modalTags = document.getElementById("modal-tags");
const modalClose = document.getElementById("modal-close");

async function openTrailer(id, mediaType, details) {
  modal.classList.add("open");
  modalVideoWrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">Loading trailer…</div>`;
  modalTitle.textContent = "";
  modalDesc.textContent = "";
  modalTags.innerHTML = "";

  try {
    const [videos, info] = await Promise.all([
      tmdbGet(`/${mediaType}/${id}/videos`),
      details ? Promise.resolve(details) : tmdbGet(`/${mediaType}/${id}`),
    ]);
    const trailer =
      videos.results.find((v) => v.type === "Trailer" && v.site === "YouTube") ||
      videos.results.find((v) => v.site === "YouTube");

    if (trailer) {
      modalVideoWrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1&rel=0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
    } else {
      modalVideoWrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">No trailer available for this title.</div>`;
    }

    modalTitle.textContent = info.title || info.name || "";
    modalDesc.textContent = info.overview || "";
    const year = (info.release_date || info.first_air_date || "").slice(0, 4);
    modalTags.innerHTML = [
      year,
      info.vote_average ? `★ ${info.vote_average.toFixed(1)}` : "",
      (info.genres || []).map((g) => g.name).join(", "),
    ]
      .filter(Boolean)
      .map((t) => `<span>${escapeHtml(t)}</span>`)
      .join("");
  } catch (err) {
    console.error(err);
    modalVideoWrap.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#888;">Couldn't load trailer.</div>`;
  }
}

function closeModal() {
  modal.classList.remove("open");
  modalVideoWrap.innerHTML = "";
}
modalClose.addEventListener("click", closeModal);
modal.addEventListener("click", (e) => {
  if (e.target === modal) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

function escapeHtml(str = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
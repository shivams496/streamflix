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
    else renderDefaultRows();
  }, 400);
});

async function tmdbGet(path) {
  const res = await fetch(`${TMDB_API}${path}`, { headers: tmdbHeaders });
  if (!res.ok) throw new Error(`TMDB error ${res.status}`);
  return res.json();
}

const ROWS = [
  { title: "Trending Now", path: "/trending/movie/week" },
  { title: "Popular on Netflix Clone", path: "/movie/popular" },
  { title: "Top Rated", path: "/movie/top_rated" },
  { title: "Action & Adventure", path: "/discover/movie?with_genres=28" },
  { title: "Comedies", path: "/discover/movie?with_genres=35" },
  { title: "Sci-Fi & Fantasy", path: "/discover/movie?with_genres=878" },
  { title: "Horror", path: "/discover/movie?with_genres=27" },
];

async function initApp() {
  try {
    const trending = await tmdbGet("/trending/movie/week");
    renderHero(trending.results);
    await renderDefaultRows();
  } catch (err) {
    console.error(err);
    rowsWrap.innerHTML = `<p class="row-empty">Couldn't load content. Check your TMDB token in js/config.js.</p>`;
  } finally {
    loader.classList.add("hidden");
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
  heroEl.querySelectorAll("[data-id]").forEach((btn) =>
    btn.addEventListener("click", () => openTrailer(pick.id, "movie"))
  );
}

async function renderDefaultRows() {
  rowsWrap.innerHTML = "";
  for (const row of ROWS) {
    try {
      const data = await tmdbGet(row.path);
      renderRow(row.title, data.results || []);
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
    card.addEventListener("click", () => openTrailer(m.id, mediaType, m));
    track.appendChild(card);
  });
  rowsWrap.appendChild(section);
}

async function runSearch(query) {
  loader.classList.remove("hidden");
  try {
    const data = await tmdbGet(`/search/movie?query=${encodeURIComponent(query)}`);
    rowsWrap.innerHTML = "";
    renderRow(`Results for "${query}"`, data.results || []);
    if (!data.results?.length) {
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

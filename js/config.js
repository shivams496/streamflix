// ============================================================
// CONFIG — fill these in with YOUR OWN free API keys.
// See README.md for exact step-by-step instructions.
// ============================================================

// 1) Firebase project config (Firebase Console > Project settings > General > Your apps > Web app)
var FIREBASE_CONFIG = {
  apiKey: "AIzaSyA4mG6iUcTdPGYdi1Uv-OITFnnayFl6ffY",
  authDomain: "streamflix-demo.firebaseapp.com",
  projectId: "streamflix-demo",
  appId: "1:395425732022:web:a65cbb04235d91dd229d17"
};

// 2) TMDB API Read Access Token (themoviedb.org > Settings > API > API Read Access Token (v4 auth))
var TMDB_TOKEN = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIxODkxZDg1OWM1OTNlODZiNzhmZDkxMGI3M2QyY2JiYyIsIm5iZiI6MTc4NjczODUwMS41NTksInN1YiI6IjZhN2Y3NzQ1YjU1YTdhN2M4MTZjODczMSIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.IP2SGrr5eDaH08U64KXMJHJhr3xQGy3cW_9EXC0c9cU";

var CONFIG_IS_SET =
  !FIREBASE_CONFIG.apiKey.startsWith("YOUR_") &&
  !TMDB_TOKEN.startsWith("YOUR_");

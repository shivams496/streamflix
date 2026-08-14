# StreamFlix — Netflix Clone

Plain HTML/CSS/JS. Real authentication (Firebase Auth) + real video playback
(TMDB API movie data and trailers, embedded via YouTube). No build step —
deploys to Vercel as a static site.

## 1. Get a free TMDB API key (5 min)

1. Create a free account at https://www.themoviedb.org/signup
2. Go to **Settings → API → Create → Developer**, fill the short form (for
   "Application" you can write "Student project / college assignment").
3. Once approved, copy the **API Read Access Token (v4 auth)** — it's a long
   string starting with `eyJ...`.
4. Open `js/config.js` and paste it into `TMDB_TOKEN`.

## 2. Create a free Firebase project for auth (5 min)

1. Go to https://console.firebase.google.com → **Add project** → name it
   anything (e.g. `streamflix-demo`) → skip Google Analytics → Create.
2. In the left sidebar: **Build → Authentication → Get started**.
3. Under **Sign-in method**, enable **Email/Password**.
4. Go to **Project settings (gear icon) → General → Your apps → Web (`</>`)**.
   Register an app (any nickname), and copy the `firebaseConfig` object shown.
5. Open `js/config.js` and paste the matching values into `FIREBASE_CONFIG`
   (`apiKey`, `authDomain`, `projectId`, `appId`).
6. Still in Authentication, go to **Settings → Authorized domains** and add
   your Vercel domain once you have it (step 3), e.g. `your-app.vercel.app`.
   `localhost` is already allowed by default for local testing.

## 3. Deploy to Vercel (2 min)

**Option A — via GitHub (recommended, matches "GitHub project link" + "Vercel
deployed link" fields on your form):**

```bash
git init
git add .
git commit -m "StreamFlix - Netflix clone"
git remote add origin https://github.com/shivams496/streamflix.git
git push -u origin main
```

Then at https://vercel.com → **Add New → Project → Import** your GitHub repo.
Framework preset: **Other** (it's static, no build command needed). Deploy.

**Option B — instant deploy without GitHub:**

```bash
npm i -g vercel
vercel
```

Follow the prompts; it deploys the current folder directly.

After deploying, go back to Firebase Authentication → Settings → Authorized
domains and add the `*.vercel.app` URL Vercel gives you (step 2.6 above),
otherwise sign-in will fail on the live site with an `auth/unauthorized-domain`
error.

## 4. Test locally before deploying

Since this uses ES modules (`type="module"`), open it via a local server, not
`file://`:

```bash
npx serve .
# or
python -m http.server 8080
```

Then visit `http://localhost:8080/login.html`.

## What's "real" here (for your defense/examiner)

- **Auth**: Firebase Authentication, email/password, actual account creation
  and session persistence — not a fake localStorage check.
- **Video playback via API**: TMDB's `/movie/{id}/videos` endpoint returns
  real YouTube trailer keys per title, played in an embedded YouTube iframe
  player — this is the same integration pattern most public Netflix-clone
  tutorials use, since Netflix's actual film catalog isn't licensable.
- **Data**: TMDB's live catalog (trending, popular, top rated, genre rows,
  search) — not hardcoded JSON.

If asked why it's trailers and not full films: full-length streaming rights
to real movies aren't available to license for a project like this, so TMDB
trailer playback is the standard, legitimate way to demonstrate a working
video-API integration.

## File structure

```
├── index.html          # Main browse page (auth-protected)
├── login.html          # Sign in / sign up
├── css/style.css
├── js/
│   ├── config.js        # ⚠ put your API keys here
│   ├── auth.js           # Firebase auth logic
│   └── app.js            # TMDB fetching, rendering, trailer modal
└── README.md
```

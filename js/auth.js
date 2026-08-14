import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

const app = initializeApp(FIREBASE_CONFIG);
const auth = getAuth(app);

const els = {
  warning: document.getElementById("config-warning"),
  loginForm: document.getElementById("login-form"),
  signupForm: document.getElementById("signup-form"),
  showSignup: document.getElementById("show-signup"),
  showLogin: document.getElementById("show-login"),
  loginError: document.getElementById("login-error"),
  signupError: document.getElementById("signup-error"),
  loginBtn: document.getElementById("login-btn"),
  signupBtn: document.getElementById("signup-btn"),
};

if (!CONFIG_IS_SET && els.warning) {
  els.warning.classList.remove("hidden");
  els.warning.textContent =
    "⚠ Add your Firebase + TMDB keys in js/config.js — see README.md.";
}

// Toggle between login / signup panels
els.showSignup?.addEventListener("click", () => {
  els.loginForm.classList.add("hidden");
  els.signupForm.classList.remove("hidden");
});
els.showLogin?.addEventListener("click", () => {
  els.signupForm.classList.add("hidden");
  els.loginForm.classList.remove("hidden");
});

function showError(el, message) {
  el.textContent = message;
  el.classList.add("show");
}
function clearError(el) {
  el.textContent = "";
  el.classList.remove("show");
}
function friendlyError(err) {
  const map = {
    "auth/invalid-email": "That email address looks invalid.",
    "auth/user-not-found": "No account found with that email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/email-already-in-use": "An account already exists with that email.",
    "auth/weak-password": "Password should be at least 6 characters.",
  };
  return map[err.code] || "Something went wrong. Please try again.";
}

els.loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError(els.loginError);
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  els.loginBtn.disabled = true;
  els.loginBtn.textContent = "Signing In...";
  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = "index.html";
  } catch (err) {
    showError(els.loginError, friendlyError(err));
    els.loginBtn.disabled = false;
    els.loginBtn.textContent = "Sign In";
  }
});

els.signupForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearError(els.signupError);
  const email = document.getElementById("signup-email").value.trim();
  const password = document.getElementById("signup-password").value;
  els.signupBtn.disabled = true;
  els.signupBtn.textContent = "Creating Account...";
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    window.location.href = "index.html";
  } catch (err) {
    showError(els.signupError, friendlyError(err));
    els.signupBtn.disabled = false;
    els.signupBtn.textContent = "Sign Up";
  }
});

// If already logged in, skip straight to the app
onAuthStateChanged(auth, (user) => {
  if (user && window.location.pathname.endsWith("login.html")) {
    window.location.href = "index.html";
  }
});

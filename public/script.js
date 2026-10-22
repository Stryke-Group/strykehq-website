/* Progressive enhancement only. No forms, API calls, telemetry or automatic sending. */
(function () {
  "use strict";
  const EMAIL = "hello@stryke.com.bd";
  const THEME_KEY = "stryke-theme";

  function chooseTheme(saved, prefersDark) {
    return saved === "light" || saved === "dark" ? saved : "dark";
  }

  function buildInquiry(input) {
    if (!input || typeof input !== "object") throw new TypeError("Describe your workflow first.");
    const values = {};
    for (const [key, max] of [["name", 80], ["company", 120], ["workflow", 2000]]) {
      if (input[key] !== undefined && typeof input[key] !== "string") throw new TypeError("Please use text in every field.");
      const value = (input[key] || "").trim();
      if (value.length > max) throw new RangeError(`${key} is too long.`);
      values[key] = value;
    }
    if (values.workflow.length < 12) throw new RangeError("Describe your workflow in at least 12 characters.");
    // User input is confined to the encoded body, never recipients or headers.
    const summary = ["Hello Stryke,", "", `Name: ${values.name || "Not provided"}`,
      `Company or team: ${values.company || "Not provided"}`, "", "The workflow I would like to improve:",
      values.workflow, "", "I would like to discuss whether a small, scoped pilot is a fit.",
      "Scope, timing and pricing are to be agreed."].join("\n");
    return Object.freeze({
      recipient: EMAIL,
      summary,
      href: `mailto:${EMAIL}?subject=Stryke%20workflow%20inquiry&body=${encodeURIComponent(summary)}`,
    });
  }

  const api = Object.freeze({ chooseTheme, buildInquiry });
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document === "undefined") return;

  document.documentElement.classList.add("js");
  const themeButton = document.querySelector("[data-theme-toggle]");
  const systemDark = window.matchMedia?.("(prefers-color-scheme: dark)");
  function savedTheme() {
    try { return localStorage.getItem(THEME_KEY); } catch (_) { return null; }
  }
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    if (!themeButton) return;
    themeButton.hidden = false;
    themeButton.textContent = theme === "dark" ? "Light mode" : "Dark mode";
    themeButton.setAttribute("aria-pressed", String(theme === "dark"));
    themeButton.setAttribute("aria-label", `Switch to ${theme === "dark" ? "light" : "dark"} mode`);
  }
  applyTheme(chooseTheme(savedTheme(), Boolean(systemDark?.matches)));
  themeButton?.addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem(THEME_KEY, next); } catch (_) { /* still usable without storage */ }
  });
  systemDark?.addEventListener("change", () => {
    applyTheme(chooseTheme(savedTheme(), Boolean(systemDark.matches)));
  });

  const navButton = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (navButton && nav) {
    navButton.hidden = false;
    function setMenu(open, restoreFocus = false) {
      nav.dataset.open = String(open);
      navButton.setAttribute("aria-expanded", String(open));
      if (restoreFocus) navButton.focus();
    }
    navButton.addEventListener("click", () => setMenu(nav.dataset.open !== "true"));
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.dataset.open === "true") setMenu(false, true);
    });
    nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setMenu(false)));
  }

  const prepare = document.getElementById("prepare-inquiry");
  if (prepare) {
    const workflow = document.getElementById("inquiry-workflow");
    const name = document.getElementById("inquiry-name");
    const company = document.getElementById("inquiry-company");
    const result = document.getElementById("inquiry-result");
    const status = document.getElementById("inquiry-status");
    const mailLink = document.getElementById("inquiry-mail-link");
    function invalidateDraft() {
      result.hidden = true;
      mailLink.removeAttribute("href");
      status.textContent = "";
      workflow.removeAttribute("aria-invalid");
    }
    [name, company, workflow].forEach((field) => field.addEventListener("input", invalidateDraft));
    prepare.hidden = false;
    prepare.addEventListener("click", () => {
      invalidateDraft();
      try {
        const draft = buildInquiry({ name: name.value, company: company.value, workflow: workflow.value });
        document.getElementById("inquiry-summary").textContent = draft.summary;
        mailLink.setAttribute("href", draft.href);
        result.hidden = false;
        status.textContent = "Email prepared on this device. Nothing has been sent. Review your message below.";
      } catch (error) {
        status.textContent = error.message;
        workflow.setAttribute("aria-invalid", "true");
        workflow.focus();
      }
    });
  }

  // Keep the existing site's service-worker capability, not a product/service claim.
  // Local preview deliberately avoids persistent SW caching during review.
  if ("serviceWorker" in navigator && window.location.hostname === "strykehq.com") {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        console.warn("Offline support is unavailable; the website still works online.");
      });
    });
  }
})();

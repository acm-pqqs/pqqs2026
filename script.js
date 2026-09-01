function setupDropdowns() {
  const dropdowns = Array.from(document.querySelectorAll(".dropdown"));
  const triggers = dropdowns
    .map((d) => d.querySelector(".dropdown-toggle"))
    .filter(Boolean);

  function closeAll(except = null) {
    dropdowns.forEach((d) => {
      if (d === except) return;
      d.classList.remove("open");
      const btn = d.querySelector(".dropdown-toggle");
      if (btn) btn.setAttribute("aria-expanded", "false");
    });
  }

  triggers.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const parent = btn.closest(".dropdown");
      if (!parent) return;
      const willOpen = !parent.classList.contains("open");
      closeAll(parent);
      parent.classList.toggle("open", willOpen);
      btn.setAttribute("aria-expanded", String(willOpen));
    });

    btn.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeAll();
        btn.blur();
      }
    });
  });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Node)) return;
    const inside = dropdowns.some((d) => d.contains(target));
    if (!inside) closeAll();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeAll();
  });

  document.querySelectorAll(".dropdown-menu a").forEach((a) => {
    a.addEventListener("click", () => closeAll());
  });
}

function setupMobileNav() {
  const header = document.querySelector(".site-header");
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector("#primary-nav");
  if (!header || !toggle || !nav) return;

  function setOpen(open) {
    header.classList.toggle("nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    document.body.classList.toggle("nav-lock", open);
  }

  toggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setOpen(!header.classList.contains("nav-open"));
  });

  nav.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => setOpen(false));
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") setOpen(false);
  });

  document.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof Node)) return;
    if (!header.contains(target)) setOpen(false);
  });

  window.addEventListener("resize", () => {
    if (window.matchMedia("(min-width: 961px)").matches) setOpen(false);
  });
}

function setupDatedListColors() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  document.querySelectorAll(".dated-list-deadlines .dated-list-date[data-date]").forEach((el) => {
    const raw = el.getAttribute("data-date");
    if (!raw) return;
    const parts = raw.split("-").map(Number);
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) return;
    const date = new Date(parts[0], parts[1] - 1, parts[2]);
    date.setHours(0, 0, 0, 0);
    el.classList.toggle("is-past", date < today);
    el.closest("li")?.classList.toggle("is-past", date < today);
  });
}

function init() {
  setupDropdowns();
  setupMobileNav();
  setupDatedListColors();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

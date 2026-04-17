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

function setupSlideshow() {
  const containers = Array.from(document.querySelectorAll(".slideshow"));
  if (containers.length === 0) return;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const intervalMs = 5500;

  containers.forEach((container) => {
    const slides = Array.from(container.querySelectorAll(".slide"));
    if (slides.length === 0) return;

    let current = slides.findIndex((s) => s.classList.contains("is-active"));
    if (current < 0) current = 0;
    slides.forEach((s, idx) => s.classList.toggle("is-active", idx === current));

    function setActive(next) {
      const clamped = ((next % slides.length) + slides.length) % slides.length;
      slides.forEach((s, idx) => s.classList.toggle("is-active", idx === clamped));
      current = clamped;
    }

    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => setActive(current + 1), intervalMs);
    container.dataset.timer = String(timer);
  });
}

function init() {
  setupDropdowns();
  setupSlideshow();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}


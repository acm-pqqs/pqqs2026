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

function speakerSlug(name) {
  return name
    .toLowerCase()
    .replace(/\b(dr|prof|professor)\b\.?/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function setupSpeakerHovers() {
  const triggers = Array.from(document.querySelectorAll(".speaker-ref"));
  if (!triggers.length) return;

  const popover = document.createElement("div");
  popover.className = "speaker-popover";
  popover.hidden = true;
  popover.setAttribute("role", "dialog");
  popover.setAttribute("aria-label", "Speaker biography");
  popover.innerHTML =
    '<img class="speaker-popover-photo" alt="" />' +
    '<div class="speaker-popover-copy">' +
    '<p class="speaker-popover-name"></p>' +
    '<p class="speaker-popover-affil"></p>' +
    '<p class="speaker-popover-bio"></p>' +
    "</div>";
  document.body.appendChild(popover);

  const photoEl = popover.querySelector(".speaker-popover-photo");
  const nameEl = popover.querySelector(".speaker-popover-name");
  const affilEl = popover.querySelector(".speaker-popover-affil");
  const bioEl = popover.querySelector(".speaker-popover-bio");

  const catalog = new Map();
  let loadPromise = null;
  let openTrigger = null;
  let hideTimer = 0;
  let lastPointer = "mouse";
  let photoRequest = 0;

  function loadCatalog() {
    if (loadPromise) return loadPromise;
    const pages = ["team/keynote-speaker.html", "team/invited-speaker.html", "team/panels.html"];
    loadPromise = Promise.all(
      pages.map((path) => {
        const pageUrl = new URL(path, document.baseURI).href;
        return fetch(pageUrl)
          .then((response) => (response.ok ? response.text() : ""))
          .then((html) => html)
          .catch(() => "");
      })
    ).then((docs) => {
      docs.forEach((html) => {
        if (!html) return;
        const doc = new DOMParser().parseFromString(html, "text/html");
        doc.querySelectorAll(".speaker-profile").forEach((article) => {
          const details = article.querySelector(".speaker-details");
          const heading = details && details.querySelector("h3");
          if (!heading) return;
          const name = heading.textContent.replace(/\s+/g, " ").trim();
          const slug = speakerSlug(name);
          if (!slug || catalog.has(slug)) return;

          let affiliation = "";
          const bioParts = [];
          let inBio = false;
          details.querySelectorAll("p").forEach((paragraph) => {
            const text = paragraph.textContent.replace(/\s+/g, " ").trim();
            if (!text) return;
            if (/^affiliation:/i.test(text)) {
              affiliation = text.replace(/^affiliation:\s*/i, "");
              return;
            }
            if (/^biography:/i.test(text)) {
              inBio = true;
              bioParts.push(text.replace(/^biography:\s*/i, ""));
              return;
            }
            if (inBio) bioParts.push(text);
          });

          const image = details.querySelector("img.speaker-photo");
          let photo = "";
          let photoAlt = "";
          if (image && image.getAttribute("src")) {
            photo = new URL(image.getAttribute("src"), document.baseURI).href;
            photoAlt = image.getAttribute("alt") || "";
            const preload = new Image();
            preload.src = photo;
          }

          catalog.set(slug, {
            name,
            affiliation,
            bio: bioParts.join("\n\n"),
            photo,
            photoAlt,
          });
        });
      });
    });
    return loadPromise;
  }

  function place(anchor) {
    const margin = 10;
    const header = document.querySelector(".site-header");
    const minTop = (header ? header.getBoundingClientRect().bottom : 0) + 8;
    popover.style.left = "0px";
    popover.style.top = "0px";
    const rect = anchor.getBoundingClientRect();
    const popRect = popover.getBoundingClientRect();
    let left = rect.left;
    let top = rect.bottom + margin;
    if (left + popRect.width > window.innerWidth - 12) {
      left = window.innerWidth - popRect.width - 12;
    }
    if (left < 12) left = 12;
    if (top + popRect.height > window.innerHeight - 12) {
      top = rect.top - popRect.height - margin;
    }
    if (top < minTop) top = minTop;
    popover.style.left = left + "px";
    popover.style.top = top + "px";
  }

  function hide() {
    clearTimeout(hideTimer);
    popover.hidden = true;
    if (openTrigger) openTrigger.setAttribute("aria-expanded", "false");
    openTrigger = null;
  }

  function scheduleHide() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
      if (popover.matches(":hover")) return;
      const active = document.activeElement;
      if (active && active.closest && active.closest(".speaker-ref, .speaker-popover")) return;
      hide();
    }, 180);
  }

  function show(trigger) {
    clearTimeout(hideTimer);
    const slug = trigger.getAttribute("data-speaker");
    const speaker = catalog.get(slug);
    if (!speaker || (!speaker.photo && !speaker.bio)) return;

    if (openTrigger && openTrigger !== trigger) {
      openTrigger.setAttribute("aria-expanded", "false");
    }
    openTrigger = trigger;
    trigger.setAttribute("aria-expanded", "true");
    nameEl.textContent = speaker.name;
    affilEl.textContent = speaker.affiliation;
    affilEl.hidden = !speaker.affiliation;
    bioEl.textContent = speaker.bio;
    const request = ++photoRequest;
    photoEl.onload = null;
    photoEl.onerror = null;
    photoEl.removeAttribute("src");
    photoEl.alt = "";
    if (speaker.photo) {
      photoEl.hidden = false;
      popover.classList.remove("speaker-popover--no-photo");
      const loader = new Image();
      loader.onload = () => {
        if (request !== photoRequest) return;
        photoEl.alt = speaker.photoAlt || "";
        photoEl.src = speaker.photo;
      };
      loader.onerror = () => {
        if (request !== photoRequest) return;
        photoEl.hidden = true;
        popover.classList.add("speaker-popover--no-photo");
      };
      loader.src = speaker.photo;
    } else {
      photoEl.hidden = true;
      popover.classList.add("speaker-popover--no-photo");
    }
    popover.hidden = false;
    place(trigger);
  }

  triggers.forEach((trigger) => {
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-haspopup", "dialog");

    trigger.addEventListener("pointerdown", (event) => {
      lastPointer = event.pointerType || "mouse";
    });

    trigger.addEventListener("pointerenter", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      loadCatalog().then(() => {
        if (!trigger.matches(":hover")) return;
        show(trigger);
      });
    });

    trigger.addEventListener("pointerleave", (event) => {
      if (event.pointerType && event.pointerType !== "mouse") return;
      scheduleHide();
    });

    trigger.addEventListener("focus", () => {
      loadCatalog().then(() => {
        if (document.activeElement !== trigger) return;
        show(trigger);
      });
    });

    trigger.addEventListener("blur", scheduleHide);

    trigger.addEventListener("click", (event) => {
      if (lastPointer === "mouse" || event.detail === 0) return;
      event.preventDefault();
      loadCatalog().then(() => {
        if (openTrigger === trigger) hide();
        else show(trigger);
      });
    });
  });

  popover.addEventListener("pointerenter", () => clearTimeout(hideTimer));
  popover.addEventListener("pointerleave", scheduleHide);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide();
  });

  window.addEventListener("resize", () => {
    if (openTrigger) place(openTrigger);
  });

  window.addEventListener(
    "scroll",
    () => {
      if (openTrigger) place(openTrigger);
    },
    true
  );

  loadCatalog();
}

function init() {
  setupDropdowns();
  setupMobileNav();
  setupDatedListColors();
  setupSpeakerHovers();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init, { once: true });
} else {
  init();
}

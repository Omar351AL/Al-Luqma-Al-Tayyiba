(function () {
  const isCoarsePointer = matchMedia("(pointer: coarse)").matches;
  let revealObserver = null;
  let cursor = null;
  let cursorDot = null;

  function setReady() {
    document.body.classList.add("ready");
  }

  function setupScrollProgress() {
    const scrollProgress = document.getElementById("scrollProgress");
    if (!scrollProgress) return;

    function updateProgress() {
      const height = document.documentElement.scrollHeight - innerHeight;
      const progress = height > 0 ? (scrollY / height) * 100 : 0;
      scrollProgress.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }

    addEventListener("scroll", updateProgress, { passive: true });
    addEventListener("resize", updateProgress, { passive: true });
    updateProgress();
  }

  function ensureRevealObserver() {
    if (revealObserver) return revealObserver;

    if (!("IntersectionObserver" in window)) {
      return null;
    }

    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -60px 0px" });

    return revealObserver;
  }

  function observeReveal(element) {
    if (!element || element.dataset.revealBound === "true") return;
    const delay = element.dataset.delay || 0;
    element.style.setProperty("--delay", `${delay}ms`);
    element.dataset.revealBound = "true";

    const observer = ensureRevealObserver();
    if (!observer) {
      element.classList.add("is-visible");
      return;
    }
    observer.observe(element);
  }

  function setupReveals(root = document) {
    root.querySelectorAll(".reveal").forEach(observeReveal);
  }

  function setupCardTilt(cards) {
    if (isCoarsePointer) return;
    cards.forEach((card) => {
      if (card.dataset.tiltBound === "true") return;
      card.dataset.tiltBound = "true";

      card.addEventListener("mousemove", (event) => {
        if (card.classList.contains("is-hidden")) return;
        const rect = card.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const rotateY = ((x / rect.width) - 0.5) * -12;
        const rotateX = ((y / rect.height) - 0.5) * 12;
        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.035)`;
      });

      card.addEventListener("mouseleave", () => {
        card.style.transform = "";
      });
    });
  }

  function refreshHoverTargets(root = document) {
    if (!cursor) return;
    root.querySelectorAll("a, button, .menu-card").forEach((item) => {
      if (item.dataset.cursorBound === "true") return;
      item.dataset.cursorBound = "true";
      item.addEventListener("mouseenter", () => cursor.classList.add("is-hovering"));
      item.addEventListener("mouseleave", () => cursor.classList.remove("is-hovering"));
    });
  }

  function setupCustomCursor() {
    if (isCoarsePointer) return;

    cursor = document.getElementById("cursor");
    cursorDot = document.getElementById("cursorDot");
    if (!cursor || !cursorDot) return;

    document.body.classList.add("has-custom-cursor");

    let cursorX = innerWidth / 2;
    let cursorY = innerHeight / 2;
    let dotX = cursorX;
    let dotY = cursorY;
    let lastTrail = 0;
    cursor.style.left = `${cursorX}px`;
    cursor.style.top = `${cursorY}px`;
    cursorDot.style.left = `${cursorX}px`;
    cursorDot.style.top = `${cursorY}px`;

    addEventListener("mousemove", (event) => {
      if (!document.body.classList.contains("ready")) return;
      cursorX = event.clientX;
      cursorY = event.clientY;
      cursor.style.opacity = "1";
      cursorDot.style.opacity = "1";

      const now = performance.now();
      if (now - lastTrail > 45) {
        lastTrail = now;
        const trail = document.createElement("span");
        trail.className = "trail";
        trail.style.left = `${cursorX}px`;
        trail.style.top = `${cursorY}px`;
        document.body.appendChild(trail);
        trail.addEventListener("animationend", () => trail.remove(), { once: true });
      }
    }, { passive: true });

    function animateCursor() {
      dotX += (cursorX - dotX) * 0.28;
      dotY += (cursorY - dotY) * 0.28;
      cursor.style.left = `${dotX}px`;
      cursor.style.top = `${dotY}px`;
      cursorDot.style.left = `${cursorX}px`;
      cursorDot.style.top = `${cursorY}px`;
      requestAnimationFrame(animateCursor);
    }

    animateCursor();

    addEventListener("mouseleave", () => {
      cursor.style.opacity = "0";
      cursorDot.style.opacity = "0";
    });

    refreshHoverTargets();
  }

  window.SiteUI = {
    setReady,
    setupReveals,
    observeReveal,
    setupCardTilt,
    refreshHoverTargets
  };

  document.addEventListener("DOMContentLoaded", () => {
    setupScrollProgress();
    setupReveals();
    setupCustomCursor();
    if (!document.getElementById("splash")) {
      setReady();
    }
  });
})();

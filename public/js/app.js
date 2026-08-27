(function () {
  const splash = document.getElementById("splash");
  const splashCanvas = document.getElementById("splashCanvas");
  const flameCanvas = document.getElementById("flameCanvas");
  const menuGrid = document.getElementById("menuGrid");
  const tabs = document.querySelectorAll(".tab-btn");
  const modal = document.getElementById("itemModal");
  const modalPanel = modal ? modal.querySelector(".item-modal-panel") : null;
  const modalImage = document.getElementById("modalImage");
  const modalBadge = document.getElementById("modalBadge");
  const modalTitle = document.getElementById("modalTitle");
  const modalDescription = document.getElementById("modalDescription");
  const modalUnitPrice = document.getElementById("modalUnitPrice");
  const modalTotalPrice = document.getElementById("modalTotalPrice");
  const quantityInput = document.getElementById("quantityInput");
  const quantityMinus = document.getElementById("quantityMinus");
  const quantityPlus = document.getElementById("quantityPlus");
  const modalAddButton = document.getElementById("modalAddButton");
  const SPLASH_SEEN_KEY = "alLuqmaSplashSeen";
  let menuItems = [];
  let activeFilter = "all";
  let activeItem = null;

  function hasSeenSplash() {
    try {
      return sessionStorage.getItem(SPLASH_SEEN_KEY) === "1";
    } catch {
      return false;
    }
  }

  function markSplashSeen() {
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, "1");
    } catch {
      // Ignore storage failures and keep the page usable.
    }
  }

  function setupCanvas(canvas) {
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(devicePixelRatio || 1, 2);

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    addEventListener("resize", resize, { passive: true });
    return { ctx };
  }

  function startSplash() {
    if (!splash || !splashCanvas) return;

    if (hasSeenSplash()) {
      splash.classList.add("is-done");
      splash.remove();
      window.SiteUI.setReady();
      return;
    }

    const splashLayer = setupCanvas(splashCanvas);
    const sparks = Array.from({ length: 95 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 2.7 + 0.8,
      vy: Math.random() * 1.8 + 0.55,
      vx: (Math.random() - 0.5) * 0.7,
      glow: Math.random() * 0.75 + 0.25
    }));

    function drawSparks() {
      const ctx = splashLayer.ctx;
      const w = splashCanvas.clientWidth;
      const h = splashCanvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      sparks.forEach((spark) => {
        spark.x += spark.vx;
        spark.y += spark.vy;
        if (spark.y > h + 18) {
          spark.y = -18;
          spark.x = Math.random() * w;
        }
        if (spark.x < -12) spark.x = w + 12;
        if (spark.x > w + 12) spark.x = -12;

        const gradient = ctx.createRadialGradient(spark.x, spark.y, 0, spark.x, spark.y, spark.r * 6);
        gradient.addColorStop(0, `rgba(255, 208, 134, ${spark.glow})`);
        gradient.addColorStop(0.38, `rgba(247, 148, 29, ${spark.glow * 0.72})`);
        gradient.addColorStop(1, "rgba(247, 148, 29, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(spark.x, spark.y, spark.r * 6, 0, Math.PI * 2);
        ctx.fill();
      });

      if (!splash.classList.contains("is-done")) requestAnimationFrame(drawSparks);
    }

    drawSparks();

    setTimeout(() => {
      splash.classList.add("is-exiting");
      setTimeout(() => {
        markSplashSeen();
        splash.classList.add("is-done");
        splash.remove();
        window.SiteUI.setReady();
      }, 1400);
    }, 4000);
  }

  function startHeroEmbers() {
    if (!flameCanvas) return;

    const flameLayer = setupCanvas(flameCanvas);
    const embers = Array.from({ length: 70 }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * Math.max(1, flameCanvas.getBoundingClientRect().height),
      r: Math.random() * 2 + 0.6,
      vx: (Math.random() - 0.5) * 0.38,
      vy: Math.random() * -0.42 - 0.12,
      alpha: Math.random() * 0.55 + 0.12
    }));

    function drawEmbers() {
      const ctx = flameLayer.ctx;
      const w = flameCanvas.clientWidth;
      const h = flameCanvas.clientHeight;
      ctx.clearRect(0, 0, w, h);

      embers.forEach((ember) => {
        ember.x += ember.vx;
        ember.y += ember.vy;
        if (ember.y < -12) {
          ember.y = h + Math.random() * 80;
          ember.x = Math.random() * w;
        }
        if (ember.x < -10) ember.x = w + 10;
        if (ember.x > w + 10) ember.x = -10;

        const gradient = ctx.createRadialGradient(ember.x, ember.y, 0, ember.x, ember.y, ember.r * 5);
        gradient.addColorStop(0, `rgba(255, 208, 134, ${ember.alpha})`);
        gradient.addColorStop(0.48, `rgba(247, 148, 29, ${ember.alpha * 0.55})`);
        gradient.addColorStop(1, "rgba(247, 148, 29, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(ember.x, ember.y, ember.r * 5, 0, Math.PI * 2);
        ctx.fill();
      });

      requestAnimationFrame(drawEmbers);
    }

    drawEmbers();
  }

  function hasImage(item) {
    return Boolean(String(item && item.image ? item.image : "").trim());
  }

  function createImagePlaceholder(className) {
    const placeholder = document.createElement("div");
    placeholder.className = className;
    placeholder.textContent = "بدون صورة";
    return placeholder;
  }

  function createMenuCard(item, index) {
    const card = document.createElement("article");
    card.className = "menu-card reveal";
    card.dataset.delay = String(index * 80);
    card.dataset.category = item.category;

    if (hasImage(item)) {
      const image = document.createElement("img");
      image.src = window.AppPaths.asset(item.image);
      image.alt = item.name;
      card.appendChild(image);
    } else {
      card.appendChild(createImagePlaceholder("menu-image-placeholder"));
    }

    if (item.badge) {
      const badge = document.createElement("span");
      badge.className = "menu-badge";
      badge.textContent = item.badge;
      card.appendChild(badge);
    }

    const info = document.createElement("div");
    info.className = "menu-info";

    const title = document.createElement("h3");
    title.textContent = item.name;

    const description = document.createElement("p");
    description.textContent = item.description;

    const bottom = document.createElement("div");
    bottom.className = "menu-bottom";

    const price = document.createElement("span");
    price.className = "price";
    price.textContent = window.CartStore.formatPrice(item.price);

    const button = document.createElement("button");
    button.className = "add-btn";
    button.type = "button";
    button.textContent = "+";
    button.setAttribute("aria-label", `إضافة ${item.name}`);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openItemModal(item);
    });

    bottom.append(price, button);
    info.append(title, description, bottom);
    card.appendChild(info);
    return card;
  }

  function applyMenuFilter() {
    menuGrid.querySelectorAll(".menu-card").forEach((card) => {
      const categories = card.dataset.category.split(" ");
      const isVisible = activeFilter === "all" || categories.includes(activeFilter);
      card.classList.toggle("is-hidden", !isVisible);
      if (isVisible) card.style.transform = "";
    });
  }

  async function loadMenu() {
    if (!menuGrid) return;

    try {
      const response = await fetch(window.AppPaths.api("/api/menu"));
      if (!response.ok) throw new Error("تعذر تحميل القائمة.");
      const data = await response.json();
      menuItems = data.items || [];
      menuGrid.innerHTML = "";

      if (!menuItems.length) {
        const empty = document.createElement("div");
        empty.className = "menu-empty";
        empty.textContent = "لا توجد وجبات متاحة حاليًا.";
        menuGrid.appendChild(empty);
        return;
      }

      const cards = menuItems.map(createMenuCard);
      menuGrid.append(...cards);
      window.SiteUI.setupReveals(menuGrid);
      window.SiteUI.setupCardTilt(cards);
      window.SiteUI.refreshHoverTargets(menuGrid);
      applyMenuFilter();
    } catch (error) {
      menuGrid.innerHTML = "";
      const errorState = document.createElement("div");
      errorState.className = "menu-error";
      errorState.textContent = error.message;
      menuGrid.appendChild(errorState);
    }
  }

  function updateModalTotal() {
    if (!activeItem) return;
    const quantity = window.CartStore.normalizeQuantity(quantityInput.value);
    quantityInput.value = String(quantity);
    modalTotalPrice.textContent = window.CartStore.formatPrice(activeItem.price * quantity);
  }

  function openItemModal(item) {
    activeItem = item;
    quantityInput.value = "1";
    if (hasImage(item)) {
      modalImage.src = window.AppPaths.asset(item.image);
      modalImage.alt = item.name;
      modalImage.hidden = false;
      if (modalPanel) modalPanel.classList.remove("has-no-image");
    } else {
      modalImage.src = "";
      modalImage.alt = "";
      modalImage.hidden = true;
      if (modalPanel) modalPanel.classList.add("has-no-image");
    }
    modalBadge.textContent = item.badge || "";
    modalTitle.textContent = item.name;
    modalDescription.textContent = item.description;
    modalUnitPrice.textContent = `${window.CartStore.formatPrice(item.price)} للقطعة`;
    updateModalTotal();
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    quantityInput.focus();
  }

  function closeItemModal() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    activeItem = null;
  }

  function setupModal() {
    if (!modal) return;

    modal.querySelectorAll("[data-modal-close]").forEach((element) => {
      element.addEventListener("click", closeItemModal);
    });

    quantityMinus.addEventListener("click", () => {
      quantityInput.value = String(Math.max(1, window.CartStore.normalizeQuantity(quantityInput.value) - 1));
      updateModalTotal();
    });

    quantityPlus.addEventListener("click", () => {
      quantityInput.value = String(window.CartStore.normalizeQuantity(quantityInput.value) + 1);
      updateModalTotal();
    });

    quantityInput.addEventListener("input", updateModalTotal);
    quantityInput.addEventListener("blur", updateModalTotal);

    modalAddButton.addEventListener("click", () => {
      if (!activeItem) return;
      const quantity = window.CartStore.normalizeQuantity(quantityInput.value);
      window.CartStore.addItem(activeItem, quantity);
      closeItemModal();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && !modal.hidden) closeItemModal();
    });
  }

  function setupTabs() {
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        activeFilter = tab.dataset.filter;
        tabs.forEach((item) => item.classList.toggle("is-active", item === tab));
        applyMenuFilter();
      });
    });
  }

  function setupCountdown() {
    const hoursEl = document.getElementById("hours");
    const minutesEl = document.getElementById("minutes");
    const secondsEl = document.getElementById("seconds");
    if (!hoursEl || !minutesEl || !secondsEl) return;

    const offerDuration = 4 * 60 * 60 * 1000;
    let offerEnd = Date.now() + offerDuration;

    function two(value) {
      return String(value).padStart(2, "0");
    }

    function updateCountdown() {
      let remaining = offerEnd - Date.now();
      if (remaining <= 0) {
        offerEnd = Date.now() + offerDuration;
        remaining = offerDuration;
      }

      const totalSeconds = Math.floor(remaining / 1000);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;

      hoursEl.textContent = two(hours);
      minutesEl.textContent = two(minutes);
      secondsEl.textContent = two(seconds);
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }

  startSplash();
  startHeroEmbers();
  setupTabs();
  setupModal();
  setupCountdown();
  loadMenu();
})();

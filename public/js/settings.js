(function () {
  let settings = {};
  let resolveReady;
  const ready = new Promise((resolve) => {
    resolveReady = resolve;
  });

  function apiUrl(path) {
    if (window.AppPaths && typeof window.AppPaths.api === "function") {
      return window.AppPaths.api(path);
    }

    const value = String(path || "");
    return `/al-luqma-al-tayyiba${value.startsWith("/") ? value : `/${value}`}`;
  }

  function get(key) {
    return String(settings[key] || "");
  }

  function all() {
    return { ...settings };
  }

  function normalizePhone(phone) {
    return String(phone || "").replace(/[^\d]/g, "");
  }

  function isHttpUrl(value) {
    return /^https?:\/\//.test(String(value || ""));
  }

  function whatsappUrl(message) {
    const phone = normalizePhone(get("whatsappPhone"));
    if (!phone) return "#";
    const text = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${phone}${text}`;
  }

  function applySettings() {
    document.querySelectorAll("[data-setting-text]").forEach((element) => {
      const value = get(element.dataset.settingText);
      element.textContent = value;
      const card = element.closest("[data-setting-card]");
      if (card) card.hidden = !value;
    });

    document.querySelectorAll("[data-social-link]").forEach((link) => {
      const value = get(link.dataset.socialLink);
      link.hidden = !isHttpUrl(value);
      link.href = isHttpUrl(value) ? value : "#";
    });

    document.querySelectorAll(".socials").forEach((group) => {
      group.hidden = !group.querySelector("[data-social-link]:not([hidden])");
    });

    document.querySelectorAll("[data-whatsapp-link]").forEach((link) => {
      const href = whatsappUrl(link.dataset.whatsappMessage || "");
      link.href = href;
      link.hidden = href === "#";
    });
  }

  async function load() {
    try {
      const response = await fetch(apiUrl("/api/settings"), { credentials: "same-origin" });
      if (!response.ok) throw new Error("تعذر تحميل إعدادات التواصل.");
      const data = await response.json();
      settings = data.settings || {};
    } catch {
      settings = {};
    }

    applySettings();
    resolveReady(settings);
    window.dispatchEvent(new CustomEvent("settings:updated", { detail: { settings: all() } }));
    return settings;
  }

  window.AppSettings = {
    ready,
    load,
    get,
    all,
    normalizePhone,
    whatsappUrl,
    apply: applySettings
  };

  document.addEventListener("DOMContentLoaded", applySettings);
  load();
})();

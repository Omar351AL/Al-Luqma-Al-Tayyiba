(function () {
  const BASE_PATH = "/al-luqma-al-tayyiba";

  function normalizePath(path) {
    const value = String(path || "");
    if (!value || value === "/") return `${BASE_PATH}/`;
    if (/^(https?:|mailto:|tel:|#)/.test(value)) return value;
    if (value.startsWith(`${BASE_PATH}/`) || value === BASE_PATH) return value;
    return `${BASE_PATH}${value.startsWith("/") ? value : `/${value}`}`;
  }

  function asset(path) {
    const value = String(path || "");
    if (!value) return "";
    if (/^(https?:|data:|blob:)/.test(value)) return value;
    return normalizePath(value);
  }

  window.AppPaths = {
    BASE_PATH,
    api: normalizePath,
    page: normalizePath,
    asset
  };
})();

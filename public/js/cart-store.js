(function () {
  const CART_KEY = "al_luqma_cart";
  const WHATSAPP_PHONE = "963999000000";

  function formatPrice(value) {
    const amount = Number(value) || 0;
    return `${amount.toLocaleString("en-US")} ل.س`;
  }

  function normalizeQuantity(value) {
    const quantity = Number.parseInt(value, 10);
    if (!Number.isFinite(quantity) || quantity < 1) return 1;
    return quantity;
  }

  function getItems() {
    try {
      const parsed = JSON.parse(localStorage.getItem(CART_KEY) || "[]");
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => ({
          productId: String(item.productId),
          name: String(item.name || ""),
          price: Number(item.price) || 0,
          image: String(item.image || ""),
          quantity: normalizeQuantity(item.quantity)
        }))
        .filter((item) => item.productId && item.name && item.price > 0);
    } catch {
      return [];
    }
  }

  function saveItems(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    updateIndicators();
    window.dispatchEvent(new CustomEvent("cart:updated", { detail: { items } }));
  }

  function addItem(product, quantity) {
    const safeQuantity = normalizeQuantity(quantity);
    const productId = String(product.productId || product.id);
    const items = getItems();
    const existing = items.find((item) => item.productId === productId);

    if (existing) {
      existing.quantity += safeQuantity;
    } else {
      items.push({
        productId,
        name: String(product.name),
        price: Number(product.price),
        image: String(product.image || ""),
        quantity: safeQuantity
      });
    }

    saveItems(items);
    return items;
  }

  function setQuantity(productId, quantity) {
    const safeQuantity = normalizeQuantity(quantity);
    const items = getItems().map((item) => {
      if (item.productId !== String(productId)) return item;
      return { ...item, quantity: safeQuantity };
    });
    saveItems(items);
    return items;
  }

  function removeItem(productId) {
    const items = getItems().filter((item) => item.productId !== String(productId));
    saveItems(items);
    return items;
  }

  function clear() {
    saveItems([]);
  }

  function countItems(items = getItems()) {
    return items.reduce((sum, item) => sum + normalizeQuantity(item.quantity), 0);
  }

  function total(items = getItems()) {
    return items.reduce((sum, item) => sum + item.price * normalizeQuantity(item.quantity), 0);
  }

  function buildWhatsAppMessage(items = getItems()) {
    const lines = ["مرحبًا، أريد طلب:", ""];
    for (const item of items) {
      lines.push(`${item.quantity} × ${item.name} — ${formatPrice(item.price * item.quantity)}`);
    }
    lines.push("", `الإجمالي: ${formatPrice(total(items))}`);
    return lines.join("\n");
  }

  function whatsappUrl(items = getItems()) {
    return `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(buildWhatsAppMessage(items))}`;
  }

  function updateIndicators() {
    const count = countItems();
    document.querySelectorAll("[data-cart-count]").forEach((element) => {
      element.textContent = String(count);
      element.setAttribute("aria-label", `${count} عنصر في السلة`);
    });
  }

  window.CartStore = {
    formatPrice,
    normalizeQuantity,
    getItems,
    saveItems,
    addItem,
    setQuantity,
    removeItem,
    clear,
    countItems,
    total,
    buildWhatsAppMessage,
    whatsappUrl,
    updateIndicators,
    WHATSAPP_PHONE
  };

  document.addEventListener("DOMContentLoaded", updateIndicators);
  window.addEventListener("storage", updateIndicators);
})();

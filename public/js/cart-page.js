(function () {
  const emptyState = document.getElementById("cartEmpty");
  const cartContent = document.getElementById("cartContent");
  const cartItems = document.getElementById("cartItems");
  const cartTotal = document.getElementById("cartTotal");
  const clearCartButton = document.getElementById("clearCart");
  const whatsappOrder = document.getElementById("whatsappOrder");

  function createQuantityControl(item) {
    const control = document.createElement("div");
    control.className = "quantity-control";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", `إنقاص كمية ${item.name}`);

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.inputMode = "numeric";
    input.value = String(item.quantity);
    input.setAttribute("aria-label", `كمية ${item.name}`);

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", `زيادة كمية ${item.name}`);

    minus.addEventListener("click", () => {
      const nextQuantity = Math.max(1, window.CartStore.normalizeQuantity(input.value) - 1);
      window.CartStore.setQuantity(item.productId, nextQuantity);
    });

    plus.addEventListener("click", () => {
      const nextQuantity = window.CartStore.normalizeQuantity(input.value) + 1;
      window.CartStore.setQuantity(item.productId, nextQuantity);
    });

    input.addEventListener("change", () => {
      window.CartStore.setQuantity(item.productId, input.value);
    });

    control.append(minus, input, plus);
    return control;
  }

  function createCartItem(item) {
    const row = document.createElement("article");
    row.className = "cart-item";

    const thumb = document.createElement("div");
    thumb.className = "cart-thumb";
    const image = document.createElement("img");
    image.src = item.image;
    image.alt = item.name;
    thumb.appendChild(image);

    const main = document.createElement("div");
    main.className = "cart-item-main";
    const title = document.createElement("h3");
    title.textContent = item.name;
    const unitPrice = document.createElement("span");
    unitPrice.textContent = window.CartStore.formatPrice(item.price);
    main.append(title, unitPrice);

    const actions = document.createElement("div");
    actions.className = "cart-item-actions";
    const quantity = createQuantityControl(item);
    const lineTotal = document.createElement("strong");
    lineTotal.className = "line-total";
    lineTotal.textContent = window.CartStore.formatPrice(item.price * item.quantity);

    const remove = document.createElement("button");
    remove.className = "danger-btn";
    remove.type = "button";
    remove.textContent = "حذف";
    remove.addEventListener("click", () => {
      window.CartStore.removeItem(item.productId);
      renderCart();
    });

    actions.append(quantity, lineTotal, remove);
    row.append(thumb, main, actions);
    return row;
  }

  function renderCart() {
    const items = window.CartStore.getItems();
    const hasItems = items.length > 0;

    emptyState.hidden = hasItems;
    cartContent.hidden = !hasItems;
    cartItems.innerHTML = "";

    if (!hasItems) {
      whatsappOrder.href = "#";
      cartTotal.textContent = window.CartStore.formatPrice(0);
      return;
    }

    cartItems.append(...items.map(createCartItem));
    cartTotal.textContent = window.CartStore.formatPrice(window.CartStore.total(items));
    whatsappOrder.href = window.CartStore.whatsappUrl(items);
    window.CartStore.updateIndicators();
    window.SiteUI.refreshHoverTargets(cartContent);
  }

  clearCartButton.addEventListener("click", () => {
    if (!window.CartStore.getItems().length) return;
    if (!confirm("هل أنت متأكد من إفراغ السلة؟")) return;
    window.CartStore.clear();
    renderCart();
  });

  whatsappOrder.addEventListener("click", (event) => {
    if (!window.CartStore.getItems().length) {
      event.preventDefault();
    }
  });

  window.addEventListener("cart:updated", renderCart);
  renderCart();
})();

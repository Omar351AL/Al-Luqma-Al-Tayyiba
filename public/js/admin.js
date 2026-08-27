(function () {
  const loginView = document.getElementById("loginView");
  const adminView = document.getElementById("adminView");
  const loginForm = document.getElementById("loginForm");
  const loginMessage = document.getElementById("loginMessage");
  const adminMessage = document.getElementById("adminMessage");
  const adminGreeting = document.getElementById("adminGreeting");
  const logoutButton = document.getElementById("logoutButton");
  const openFormButton = document.getElementById("openFormButton");
  const cancelFormButton = document.getElementById("cancelFormButton");
  const formPanel = document.getElementById("formPanel");
  const formTitle = document.getElementById("formTitle");
  const menuForm = document.getElementById("menuForm");
  const itemId = document.getElementById("itemId");
  const itemName = document.getElementById("itemName");
  const itemDescription = document.getElementById("itemDescription");
  const itemPrice = document.getElementById("itemPrice");
  const itemBadge = document.getElementById("itemBadge");
  const itemImage = document.getElementById("itemImage");
  const imagePreview = document.getElementById("imagePreview");
  const imagePreviewImg = imagePreview.querySelector("img");
  const adminList = document.getElementById("adminList");
  const itemsCount = document.getElementById("itemsCount");
  let items = [];

  async function requestJson(url, options = {}) {
    const response = await fetch(window.AppPaths.api(url), {
      credentials: "same-origin",
      headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
      ...options
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 401) showLogin();
      throw new Error(data.error || "تعذر تنفيذ العملية.");
    }

    return data;
  }

  function showMessage(element, message, isError = false) {
    element.textContent = message;
    element.classList.toggle("is-error", isError);
    element.classList.add("is-visible");
  }

  function clearMessage(element) {
    element.textContent = "";
    element.classList.remove("is-visible", "is-error");
  }

  function showLogin() {
    loginView.hidden = false;
    adminView.hidden = true;
    closeForm();
  }

  function showAdmin(username) {
    loginView.hidden = true;
    adminView.hidden = false;
    adminGreeting.textContent = `مرحبًا ${username}`;
    window.SiteUI.setupReveals(adminView);
  }

  function selectedCategories() {
    return [...menuForm.querySelectorAll('input[name="category"]:checked')].map((input) => input.value);
  }

  function setSelectedCategories(categoryText) {
    const selected = new Set(String(categoryText || "").split(" ").filter(Boolean));
    menuForm.querySelectorAll('input[name="category"]').forEach((input) => {
      input.checked = selected.has(input.value);
    });
  }

  function openForm(item = null) {
    clearMessage(adminMessage);
    menuForm.reset();
    itemImage.required = !item;
    itemId.value = item ? item.id : "";
    formTitle.textContent = item ? "تعديل الوجبة" : "إضافة وجبة جديدة";

    if (item) {
      itemName.value = item.name;
      itemDescription.value = item.description;
      itemPrice.value = item.price;
      itemBadge.value = item.badge || "";
      setSelectedCategories(item.category);
      showPreview(window.AppPaths.asset(item.image));
    } else {
      setSelectedCategories("burger");
      hidePreview();
    }

    formPanel.hidden = false;
    formPanel.classList.add("is-open");
    formPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function closeForm() {
    formPanel.classList.remove("is-open");
    formPanel.hidden = true;
    menuForm.reset();
    hidePreview();
  }

  function showPreview(src) {
    imagePreviewImg.src = src;
    imagePreview.classList.add("is-visible");
  }

  function hidePreview() {
    imagePreviewImg.src = "";
    imagePreview.classList.remove("is-visible");
  }

  function createAdminCard(item) {
    const card = document.createElement("article");
    card.className = "admin-product-card";

    const thumb = document.createElement("div");
    thumb.className = "admin-thumb";
    const image = document.createElement("img");
    image.src = window.AppPaths.asset(item.image);
    image.alt = item.name;
    thumb.appendChild(image);

    const main = document.createElement("div");
    main.className = "admin-product-main";
    const title = document.createElement("h3");
    title.textContent = item.name;

    const description = document.createElement("p");
    description.textContent = item.description;

    const meta = document.createElement("div");
    meta.className = "admin-meta";
    const price = document.createElement("span");
    price.textContent = window.CartStore.formatPrice(item.price);
    const category = document.createElement("span");
    category.textContent = item.category;
    const badge = document.createElement("span");
    badge.textContent = item.badge ? `Badge: ${item.badge}` : "بدون Badge";
    meta.append(price, category, badge);
    main.append(title, description, meta);

    const actions = document.createElement("div");
    actions.className = "admin-actions";
    const edit = document.createElement("button");
    edit.className = "link-button";
    edit.type = "button";
    edit.textContent = "Edit";
    edit.addEventListener("click", () => openForm(item));

    const remove = document.createElement("button");
    remove.className = "danger-btn";
    remove.type = "button";
    remove.textContent = "Delete";
    remove.addEventListener("click", () => deleteItem(item));

    actions.append(edit, remove);
    card.append(thumb, main, actions);
    return card;
  }

  async function loadItems() {
    const data = await requestJson("/api/admin/menu");
    items = data.items || [];
    adminList.innerHTML = "";
    itemsCount.textContent = `${items.length} وجبة`;

    if (!items.length) {
      const empty = document.createElement("div");
      empty.className = "menu-empty";
      empty.textContent = "لا توجد وجبات بعد.";
      adminList.appendChild(empty);
      return;
    }

    adminList.append(...items.map(createAdminCard));
    window.SiteUI.refreshHoverTargets(adminList);
  }

  async function deleteItem(item) {
    if (!confirm("هل أنت متأكد من حذف هذه الوجبة؟")) return;

    try {
      await requestJson(`/api/admin/menu/${item.id}`, { method: "DELETE" });
      showMessage(adminMessage, "تم حذف الوجبة.");
      await loadItems();
    } catch (error) {
      showMessage(adminMessage, error.message, true);
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(loginMessage);
    const formData = new FormData(loginForm);

    try {
      const data = await requestJson("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({
          username: formData.get("username"),
          password: formData.get("password")
        })
      });
      showAdmin(data.username);
      await loadItems();
    } catch (error) {
      showMessage(loginMessage, error.message, true);
    }
  });

  logoutButton.addEventListener("click", async () => {
    try {
      await requestJson("/api/admin/logout", { method: "POST", body: JSON.stringify({}) });
    } finally {
      showLogin();
    }
  });

  openFormButton.addEventListener("click", () => openForm());
  cancelFormButton.addEventListener("click", closeForm);

  itemImage.addEventListener("change", () => {
    const file = itemImage.files[0];
    if (!file) return;
    showPreview(URL.createObjectURL(file));
  });

  menuForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    clearMessage(adminMessage);

    if (!selectedCategories().length) {
      showMessage(adminMessage, "اختر تصنيفًا واحدًا على الأقل.", true);
      return;
    }

    const formData = new FormData(menuForm);
    const editingId = itemId.value;

    try {
      await requestJson(editingId ? `/api/admin/menu/${editingId}` : "/api/admin/menu", {
        method: editingId ? "PUT" : "POST",
        body: formData
      });
      showMessage(adminMessage, editingId ? "تم تعديل الوجبة." : "تمت إضافة الوجبة.");
      closeForm();
      await loadItems();
    } catch (error) {
      showMessage(adminMessage, error.message, true);
    }
  });

  async function init() {
    try {
      const session = await requestJson("/api/admin/session");
      if (!session.authenticated) {
        showLogin();
        return;
      }
      showAdmin(session.username);
      await loadItems();
    } catch {
      showLogin();
    }
  }

  init();
})();

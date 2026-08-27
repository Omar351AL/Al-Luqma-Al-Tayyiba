require("dotenv").config({ quiet: true });

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const multer = require("multer");
const {
  getDatabase,
  listMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getSettings,
  updateSettings
} = require("./server/database");
const { verifyPassword } = require("./server/auth");

const app = express();
const port = Number(process.env.PORT || 3000);
const BASE_PATH = normalizeBasePath(process.env.BASE_PATH || "/al-luqma-al-tayyiba");
const publicDir = path.join(__dirname, "public");
const uploadDir = path.join(publicDir, "uploads", "menu");
const allowedCategories = new Set(["burger", "chicken", "meals", "drinks"]);
const allowedMimeTypes = new Map([
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/webp", ".webp"]
]);
const maxImageSize = 3 * 1024 * 1024;

fs.mkdirSync(uploadDir, { recursive: true });
getDatabase();

app.set("trust proxy", process.env.TRUST_PROXY === "1");
app.use(helmet({ contentSecurityPolicy: false }));

app.use((req, res, next) => {
  if (BASE_PATH === "/") {
    next();
    return;
  }

  const [pathname, query = ""] = req.url.split("?");
  if (pathname === BASE_PATH) {
    res.redirect(308, `${BASE_PATH}/${query ? `?${query}` : ""}`);
    return;
  }
  if (pathname.startsWith(`${BASE_PATH}/`)) {
    req.url = `${pathname.slice(BASE_PATH.length)}${query ? `?${query}` : ""}`;
  }
  next();
});

app.use(express.json({ limit: "128kb" }));
app.use(express.urlencoded({ extended: false, limit: "128kb" }));
app.use(
  session({
    name: "al_luqma_admin",
    secret: process.env.SESSION_SECRET || "development-only-change-this-session-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.COOKIE_SECURE === "true",
      path: BASE_PATH,
      maxAge: 1000 * 60 * 60 * 8
    }
  })
);

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, uploadDir);
  },
  filename: (req, file, callback) => {
    const extension = allowedMimeTypes.get(file.mimetype);
    callback(null, `${Date.now()}-${crypto.randomUUID()}${extension}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: maxImageSize,
    files: 1
  },
  fileFilter: (req, file, callback) => {
    req.uploadedImageCount = (req.uploadedImageCount || 0) + 1;
    if (req.uploadedImageCount > 1) {
      callback(new multer.MulterError("LIMIT_UNEXPECTED_FILE", file.fieldname));
      return;
    }

    if (!allowedMimeTypes.has(file.mimetype)) {
      callback(new Error("نوع الصورة غير مدعوم. استخدم JPG أو PNG أو WebP."));
      return;
    }
    callback(null, true);
  }
});

function normalizeBasePath(value) {
  const text = String(value || "").trim();
  if (!text || text === "/") return "/";
  return `/${text.replace(/^\/+|\/+$/g, "")}`;
}

function cleanText(value, maxLength) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  return text.slice(0, maxLength);
}

function parsePrice(value) {
  const normalized = String(value || "").replace(/[^\d]/g, "");
  const price = Number(normalized);
  if (!Number.isInteger(price) || price <= 0 || price > 100000000) {
    throw validationError("السعر غير صالح.");
  }
  return price;
}

function parseCategories(value) {
  const values = Array.isArray(value) ? value : String(value || "").split(/[\s,]+/);
  const unique = [...new Set(values.map((item) => cleanText(item, 24)).filter(Boolean))];
  if (!unique.length) {
    throw validationError("اختر تصنيفًا واحدًا على الأقل.");
  }
  const invalid = unique.find((item) => !allowedCategories.has(item));
  if (invalid) {
    throw validationError("التصنيف غير صالح.");
  }
  return unique.join(" ");
}

function validationError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validateMenuPayload(body) {
  const name = cleanText(body.name, 90);
  const description = cleanText(body.description, 320);
  const badge = cleanText(body.badge, 36);

  if (name.length < 2) {
    throw validationError("اسم الوجبة قصير جدًا.");
  }
  if (description.length < 6) {
    throw validationError("وصف الوجبة قصير جدًا.");
  }

  return {
    name,
    description,
    price: parsePrice(body.price),
    category: parseCategories(body.category),
    badge
  };
}

function cleanUrl(value, label) {
  const text = cleanText(value, 240);
  if (!text) return "";

  let parsed;
  try {
    parsed = new URL(text);
  } catch {
    throw validationError(`${label} غير صالح.`);
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw validationError(`${label} يجب أن يبدأ بـ http أو https.`);
  }

  return parsed.toString();
}

function cleanPhone(value, label) {
  const text = cleanText(value, 40);
  if (!text) {
    throw validationError(`${label} مطلوب.`);
  }
  if (!/^[+\d\s().-]+$/.test(text)) {
    throw validationError(`${label} يحتوي على رموز غير صالحة.`);
  }
  return text;
}

function validateSettingsPayload(body) {
  return {
    whatsappPhone: cleanPhone(body.whatsappPhone, "رقم واتساب"),
    displayPhone: cleanPhone(body.displayPhone, "رقم الهاتف الظاهر"),
    facebookUrl: cleanUrl(body.facebookUrl, "رابط فيسبوك"),
    instagramUrl: cleanUrl(body.instagramUrl, "رابط إنستغرام"),
    tiktokUrl: cleanUrl(body.tiktokUrl, "رابط تيك توك"),
    telegramUrl: cleanUrl(body.telegramUrl, "رابط تيليجرام"),
    address: cleanText(body.address, 120),
    hours: cleanText(body.hours, 120)
  };
}

function shouldRemoveImage(body) {
  return body.removeImage === "1" || body.removeImage === "true" || body.removeImage === true;
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.admin) {
    next();
    return;
  }
  res.status(401).json({ error: "تسجيل الدخول مطلوب." });
}

function handleImageUpload(req, res, next) {
  upload.single("image")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (req.file) deleteLocalUpload(uploadUrl(req.file));

    const message = error.code === "LIMIT_FILE_SIZE"
      ? "حجم الصورة يجب ألا يتجاوز 3MB."
      : error.code === "LIMIT_UNEXPECTED_FILE" || error.code === "LIMIT_FILE_COUNT"
        ? "يسمح بصورة واحدة فقط لكل وجبة."
        : error.message || "تعذر رفع الصورة.";
    res.status(400).json({ error: message });
  });
}

function uploadUrl(file) {
  return `/uploads/menu/${file.filename}`;
}

function localUploadPath(imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("/uploads/menu/")) return null;
  const filename = path.basename(imageUrl);
  const fullPath = path.join(uploadDir, filename);
  const normalizedUploadDir = path.resolve(uploadDir) + path.sep;
  const normalizedFullPath = path.resolve(fullPath);
  if (!normalizedFullPath.startsWith(normalizedUploadDir)) return null;
  return normalizedFullPath;
}

function deleteLocalUpload(imageUrl) {
  const fullPath = localUploadPath(imageUrl);
  if (!fullPath) return;
  try {
    fs.rmSync(fullPath, { force: true });
  } catch {
    // Ignore deletion failures so a missing local file never breaks menu updates.
  }
}

function sendError(res, error) {
  const status = error.statusCode || 500;
  res.status(status).json({
    error: status >= 500 ? "حدث خطأ في السيرفر." : error.message
  });
}

app.get("/api/menu", (req, res) => {
  res.json({ items: listMenuItems() });
});

app.get("/api/settings", (req, res) => {
  res.json({ settings: getSettings() });
});

app.get("/api/menu/:id", (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(404).json({ error: "الوجبة غير موجودة." });
    return;
  }

  const item = getMenuItem(id);
  if (!item) {
    res.status(404).json({ error: "الوجبة غير موجودة." });
    return;
  }
  res.json({ item });
});

app.get("/api/admin/session", (req, res) => {
  res.json({
    authenticated: Boolean(req.session && req.session.admin),
    username: req.session && req.session.admin ? req.session.admin.username : null
  });
});

app.post("/api/admin/login", (req, res) => {
  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedHash = process.env.ADMIN_PASSWORD_HASH;
  const username = cleanText(req.body.username, 80);
  const password = String(req.body.password || "");

  if (!expectedHash) {
    res.status(500).json({ error: "لم يتم إعداد كلمة مرور الإدارة على السيرفر." });
    return;
  }

  if (username !== expectedUsername || !verifyPassword(password, expectedHash)) {
    res.status(401).json({ error: "بيانات الدخول غير صحيحة." });
    return;
  }

  req.session.admin = { username };
  req.session.save((error) => {
    if (error) {
      sendError(res, error);
      return;
    }

    res.json({ authenticated: true, username });
  });
});

app.post("/api/admin/logout", requireAdmin, (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      sendError(res, error);
      return;
    }

    res.clearCookie("al_luqma_admin", { path: BASE_PATH });
    res.json({ authenticated: false });
  });
});

app.get("/api/admin/menu", requireAdmin, (req, res) => {
  res.json({ items: listMenuItems() });
});

app.get("/api/admin/settings", requireAdmin, (req, res) => {
  res.json({ settings: getSettings() });
});

app.put("/api/admin/settings", requireAdmin, (req, res) => {
  try {
    const settings = updateSettings(validateSettingsPayload(req.body));
    res.json({ settings });
  } catch (error) {
    sendError(res, error);
  }
});

app.post("/api/admin/menu", requireAdmin, handleImageUpload, (req, res) => {
  try {
    if (!req.file) {
      throw validationError("صورة الوجبة مطلوبة.");
    }

    const payload = validateMenuPayload(req.body);
    const item = createMenuItem({
      ...payload,
      image: uploadUrl(req.file)
    });
    res.status(201).json({ item });
  } catch (error) {
    if (req.file) deleteLocalUpload(uploadUrl(req.file));
    sendError(res, error);
  }
});

app.put("/api/admin/menu/:id", requireAdmin, handleImageUpload, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    if (req.file) deleteLocalUpload(uploadUrl(req.file));
    res.status(404).json({ error: "الوجبة غير موجودة." });
    return;
  }

  try {
    const current = getMenuItem(id);
    if (!current) {
      if (req.file) deleteLocalUpload(uploadUrl(req.file));
      res.status(404).json({ error: "الوجبة غير موجودة." });
      return;
    }

    const payload = validateMenuPayload(req.body);
    const removeImage = shouldRemoveImage(req.body);
    const nextImage = req.file ? uploadUrl(req.file) : removeImage ? "" : current.image;
    const item = updateMenuItem(id, {
      ...payload,
      image: nextImage
    });

    if (req.file || removeImage) deleteLocalUpload(current.image);
    res.json({ item });
  } catch (error) {
    if (req.file) deleteLocalUpload(uploadUrl(req.file));
    sendError(res, error);
  }
});

app.delete("/api/admin/menu/:id", requireAdmin, (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    res.status(404).json({ error: "الوجبة غير موجودة." });
    return;
  }

  const item = deleteMenuItem(id);
  if (!item) {
    res.status(404).json({ error: "الوجبة غير موجودة." });
    return;
  }
  deleteLocalUpload(item.image);
  res.json({ deleted: true, item });
});

app.use(express.static(publicDir));

app.get("/cart", (req, res) => {
  res.sendFile(path.join(publicDir, "cart.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(publicDir, "admin.html"));
});

app.use((req, res) => {
  res.status(404).json({ error: "المسار غير موجود." });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }
  sendError(res, error);
});

app.listen(port, () => {
  console.log(`Al-Luqma Al-Tayyiba is running on http://localhost:${port}${BASE_PATH === "/" ? "/" : `${BASE_PATH}/`}`);
});

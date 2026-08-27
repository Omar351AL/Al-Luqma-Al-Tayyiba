const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const rootDir = path.join(__dirname, "..");
const databasePath = path.resolve(rootDir, process.env.DATABASE_PATH || "data/al-luqma.sqlite");

const seedItems = [
  {
    name: "برغر كلاسيك",
    description: "قطعة لحم مشوية مع جبنة ذائبة وخضار مقرمشة وصلصة البيت.",
    price: 25000,
    category: "burger",
    image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=85&fit=crop&auto=format",
    badge: "الأكثر طلباً"
  },
  {
    name: "دبل برغر",
    description: "طبقتان من اللحم والجبنة مع صوص مدخن ولمسة بصل مكرمل.",
    price: 35000,
    category: "burger",
    image: "https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=500&q=85&fit=crop&auto=format",
    badge: "جديد"
  },
  {
    name: "برغر تشيز سبيشيال",
    description: "جبنة غنية، صوص خاص، وخبز بريوش محمص بنكهة الزبدة.",
    price: 30000,
    category: "burger",
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&q=85&fit=crop&auto=format",
    badge: "عرض"
  },
  {
    name: "وجبة دجاج مقلي",
    description: "قطع دجاج ذهبية مع بطاطا وصوص كريمي بنكهة غنية.",
    price: 28000,
    category: "chicken meals",
    image: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&q=85&fit=crop&auto=format",
    badge: "الأكثر طلباً"
  },
  {
    name: "بيتزا مارغريتا",
    description: "عجينة طرية، جبنة موزاريلا، صلصة طماطم، ورائحة ريحان خفيفة.",
    price: 22000,
    category: "meals",
    image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=85&fit=crop&auto=format",
    badge: "جديد"
  },
  {
    name: "بطاطا مقلية سبيشيال",
    description: "بطاطا مقرمشة مع بهارات دافئة وصوص جبنة كريمي.",
    price: 12000,
    category: "meals",
    image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=500&q=85&fit=crop&auto=format",
    badge: "عرض"
  },
  {
    name: "شاورما دجاج",
    description: "شرائح دجاج متبلة، ثوم كريمي، مخلل، وخبز ملفوف ساخن.",
    price: 20000,
    category: "chicken meals",
    image: "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=500&q=85&fit=crop&auto=format",
    badge: "جديد"
  },
  {
    name: "مشروبات باردة",
    description: "اختيارات باردة ومنعشة تكمل الوجبة وتوازن النكهات الغنية.",
    price: 8000,
    category: "drinks",
    image: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&q=85&fit=crop&auto=format",
    badge: "منعش"
  }
];

const defaultSettings = {
  whatsappPhone: "963999000000",
  displayPhone: "+963 999 000 000",
  facebookUrl: "",
  instagramUrl: "",
  tiktokUrl: "",
  telegramUrl: "",
  address: "دمشق، شارع المطاعم",
  hours: "يومياً 12 ظهراً - 2 ليلاً"
};

let database;

function normalizeRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: row.price,
    category: row.category,
    image: row.image,
    badge: row.badge || "",
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function getDatabase() {
  if (database) return database;

  fs.mkdirSync(path.dirname(databasePath), { recursive: true });
  database = new DatabaseSync(databasePath);
  database.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price INTEGER NOT NULL CHECK (price >= 0),
      category TEXT NOT NULL,
      image TEXT NOT NULL,
      badge TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  seedDatabase();
  seedSettings();
  return database;
}

function seedDatabase() {
  const row = database.prepare("SELECT COUNT(*) AS count FROM menu_items").get();
  if (row.count > 0) return;

  const insert = database.prepare(`
    INSERT INTO menu_items (name, description, price, category, image, badge)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  database.exec("BEGIN");
  try {
    for (const item of seedItems) {
      insert.run(item.name, item.description, item.price, item.category, item.image, item.badge);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function seedSettings() {
  const insert = database.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)");

  database.exec("BEGIN");
  try {
    for (const [key, value] of Object.entries(defaultSettings)) {
      insert.run(key, value);
    }
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function listMenuItems() {
  return getDatabase()
    .prepare("SELECT * FROM menu_items ORDER BY id ASC")
    .all()
    .map(normalizeRow);
}

function getMenuItem(id) {
  return normalizeRow(getDatabase().prepare("SELECT * FROM menu_items WHERE id = ?").get(id));
}

function createMenuItem(item) {
  return normalizeRow(
    getDatabase()
      .prepare(`
        INSERT INTO menu_items (name, description, price, category, image, badge)
        VALUES (?, ?, ?, ?, ?, ?)
        RETURNING *
      `)
      .get(item.name, item.description, item.price, item.category, item.image, item.badge || "")
  );
}

function updateMenuItem(id, item) {
  return normalizeRow(
    getDatabase()
      .prepare(`
        UPDATE menu_items
        SET name = ?, description = ?, price = ?, category = ?, image = ?, badge = ?, updated_at = datetime('now')
        WHERE id = ?
        RETURNING *
      `)
      .get(item.name, item.description, item.price, item.category, item.image, item.badge || "", id)
  );
}

function deleteMenuItem(id) {
  const item = getMenuItem(id);
  if (!item) return null;
  getDatabase().prepare("DELETE FROM menu_items WHERE id = ?").run(id);
  return item;
}

function getSettings() {
  const rows = getDatabase().prepare("SELECT key, value FROM settings").all();
  const settings = { ...defaultSettings };
  for (const row of rows) {
    if (Object.hasOwn(defaultSettings, row.key)) {
      settings[row.key] = row.value;
    }
  }
  return settings;
}

function updateSettings(nextSettings) {
  const current = getSettings();
  const upsert = getDatabase().prepare(`
    INSERT INTO settings (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `);

  getDatabase().exec("BEGIN");
  try {
    for (const key of Object.keys(defaultSettings)) {
      const value = Object.hasOwn(nextSettings, key) ? nextSettings[key] : current[key];
      upsert.run(key, String(value || ""));
    }
    getDatabase().exec("COMMIT");
  } catch (error) {
    getDatabase().exec("ROLLBACK");
    throw error;
  }

  return getSettings();
}

module.exports = {
  databasePath,
  defaultSettings,
  getDatabase,
  listMenuItems,
  getMenuItem,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getSettings,
  updateSettings
};

import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (db) return db;
  db = await Database.load("sqlite:invoice.db");
  return db;
}

export async function initDb() {
  const db = await getDb();

  // Companies table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      gst TEXT,
      phone TEXT,
      email TEXT,
      bankDetails TEXT,
      logo TEXT,
      signature TEXT,
      digitalSignatureName TEXT,
      consigneeName TEXT,
      consigneeAddress TEXT,
      consigneeGst TEXT,
      consigneeState TEXT
    )
  `);

  // Customers table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      address TEXT,
      gst TEXT,
      phone TEXT,
      email TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Invoices table — all fields persisted
  await db.execute(`
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoiceNumber TEXT NOT NULL,
      date TEXT NOT NULL,
      customerId TEXT,
      items TEXT,
      remarks TEXT,
      total REAL,
      amountInWords TEXT,
      consigneeName TEXT,
      consigneeGst TEXT,
      consigneeState TEXT,
      buyerName TEXT,
      buyerAddress TEXT,
      buyerGst TEXT,
      buyerState TEXT,
      deliveryNote TEXT,
      modeOfPayment TEXT,
      referenceNo TEXT,
      otherReferences TEXT,
      buyersOrderNo TEXT,
      buyersOrderDate TEXT,
      dispatchDocNo TEXT,
      deliveryNoteDate TEXT,
      dispatchedThrough TEXT,
      destination TEXT,
      termsOfDelivery TEXT,
      status TEXT DEFAULT 'draft',
      exportFileName TEXT,
      exportFolder TEXT,
      exportDate TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Preferences table — key/value store for UI state
  await db.execute(`
    CREATE TABLE IF NOT EXISTS preferences (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `);

  // Migrate: add missing columns to existing invoices table
  const columns = [
    "consigneeName TEXT", "consigneeGst TEXT", "consigneeState TEXT",
    "buyerName TEXT", "buyerAddress TEXT", "buyerGst TEXT", "buyerState TEXT",
    "deliveryNote TEXT", "modeOfPayment TEXT", "referenceNo TEXT", "otherReferences TEXT",
    "buyersOrderNo TEXT", "buyersOrderDate TEXT", "dispatchDocNo TEXT", "deliveryNoteDate TEXT",
    "dispatchedThrough TEXT", "destination TEXT", "termsOfDelivery TEXT",
    "status TEXT DEFAULT 'draft'", "exportFileName TEXT", "exportFolder TEXT", "exportDate TEXT",
    "created_at TEXT", "updated_at TEXT",
  ];

  const companyColumns = [
    "digitalSignatureName TEXT", "consigneeName TEXT", "consigneeAddress TEXT",
    "consigneeGst TEXT", "consigneeState TEXT", "signatureOffsetX REAL", "signatureOffsetY REAL"
  ];

  for (const col of columns) {
    const colName = col.split(" ")[0];
    try {
      await db.execute(`ALTER TABLE invoices ADD COLUMN ${col}`);
    } catch {
      // Column already exists, ignore
    }
  }

  for (const col of companyColumns) {
    try {
      await db.execute(`ALTER TABLE companies ADD COLUMN ${col}`);
    } catch {
      // Column already exists, ignore
    }
  }
}

// Preferences helpers
export async function getPreference(key: string): Promise<string | null> {
  const db = await getDb();
  const result = await db.select<{ value: string }[]>(
    "SELECT value FROM preferences WHERE key = $1",
    [key]
  );
  return result.length > 0 ? result[0].value : null;
}

export async function setPreference(key: string, value: string): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO preferences (key, value) VALUES ($1, $2)
     ON CONFLICT(key) DO UPDATE SET value=excluded.value`,
    [key, value]
  );
}

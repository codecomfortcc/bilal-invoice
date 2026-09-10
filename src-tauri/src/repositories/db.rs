use rusqlite::Connection;
use tauri::{AppHandle, Manager};
use crate::errors::Result;
use crate::state::AppState;
use std::sync::Mutex;

pub fn init_db(app_handle: &AppHandle) -> Result<()> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .expect("Failed to get app data dir");
    std::fs::create_dir_all(&app_dir).unwrap_or_default();

    let db_path = app_dir.join("invoice.db");
    let conn = Connection::open(db_path)?;

    // Create tables
    conn.execute(
        "CREATE TABLE IF NOT EXISTS companies (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            addressLine1 TEXT,
            addressLine2 TEXT,
            city TEXT,
            pincode TEXT,
            address TEXT,
            gst TEXT,
            phone TEXT,
            email TEXT,
            bankDetails TEXT,
            logo TEXT,
            signature TEXT,
            digitalSignatureName TEXT,
            consigneeName TEXT,
            consigneeAddressLine1 TEXT,
            consigneeAddressLine2 TEXT,
            consigneeCity TEXT,
            consigneePincode TEXT,
            consigneeAddress TEXT,
            consigneeGst TEXT,
            consigneeState TEXT,
            signatureOffsetX REAL,
            signatureOffsetY REAL,
            signatureScale REAL,
            termsOfDelivery TEXT,
            modeOfPayment TEXT,
            buyerName TEXT,
            buyerAddressLine1 TEXT,
            buyerAddressLine2 TEXT,
            buyerCity TEXT,
            buyerPincode TEXT,
            buyerAddress TEXT,
            buyerGst TEXT,
            buyerState TEXT,
            buyerStateCode TEXT,
            deliveryNote TEXT,
            referenceNo TEXT,
            otherReferences TEXT,
            buyersOrderNo TEXT,
            dispatchDocNo TEXT,
            dispatchedThrough TEXT,
            destination TEXT,
            invoiceNumber TEXT,
            numberFormat TEXT,
            fieldStyles TEXT,
            master_font TEXT,
            master_font_variant TEXT,
            custom_labels TEXT,
            master_color TEXT,
            lockedFields TEXT,
            columnWidths TEXT,
            showBankDetails INTEGER,
            showDigitalSignature INTEGER,
            showSignatureImage INTEGER,
            autoSaveProducts INTEGER,
            billSize TEXT,
            dateFormat TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            address TEXT,
            gst TEXT,
            phone TEXT,
            email TEXT,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS invoices (
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
            buyerAddressLine1 TEXT,
            buyerAddressLine2 TEXT,
            buyerCity TEXT,
            buyerPincode TEXT,
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
            updated_at TEXT DEFAULT (datetime('now')),
            consigneeAddressLine1 TEXT,
            consigneeAddressLine2 TEXT,
            consigneeCity TEXT,
            consigneePincode TEXT,
            consigneeAddress TEXT,
            consigneeStateCode TEXT,
            buyerStateCode TEXT
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS preferences (
            key TEXT PRIMARY KEY,
            value TEXT
        )",
        [],
    )?;

    // Run migrations safely
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN addressLine1 TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN addressLine2 TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN city TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN pincode TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN consigneeAddressLine1 TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN consigneeAddressLine2 TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN consigneeCity TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN consigneePincode TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN signatureScale REAL", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN termsOfDelivery TEXT", []);

    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN buyerAddressLine1 TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN buyerAddressLine2 TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN buyerCity TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN buyerPincode TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN buyerStateCode TEXT", []);

    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN consigneeAddressLine1 TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN consigneeAddressLine2 TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN consigneeCity TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN consigneePincode TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN consigneeAddress TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN consigneeStateCode TEXT", []);
    
    // New fields for immutable invoice snapshots
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_name TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_address_line_1 TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_address_line_2 TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_city TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_pincode TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_state TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_state_code TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_gst TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_email TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_phone TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN seller_logo TEXT", []);
    
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN bank_name TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN bank_account_number TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN bank_ifsc_code TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN bank_account_name TEXT", []);
    
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN signature_image TEXT", []);
    let _ = conn.execute("ALTER TABLE invoices ADD COLUMN digital_signature_name TEXT", []);
    
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN consigneeStateCode TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN modeOfPayment TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN buyerName TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN buyerAddressLine1 TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN buyerAddressLine2 TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN buyerCity TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN buyerPincode TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN buyerAddress TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN buyerGst TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN buyerState TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN buyerStateCode TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN deliveryNote TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN referenceNo TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN otherReferences TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN buyersOrderNo TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN dispatchDocNo TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN dispatchedThrough TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN destination TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN invoiceNumber TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN numberFormat TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN fieldStyles TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN master_font TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN master_font_variant TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN custom_labels TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN master_color TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN lockedFields TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN columnWidths TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN showBankDetails INTEGER", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN showDigitalSignature INTEGER", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN showSignatureImage INTEGER", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN autoSaveProducts INTEGER", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN billSize TEXT", []);
    let _ = conn.execute("ALTER TABLE companies ADD COLUMN dateFormat TEXT", []);
    conn.execute(
        "CREATE TABLE IF NOT EXISTS inventory_items (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            hsnSac TEXT,
            rate REAL,
            unit TEXT,
            deleted BOOLEAN DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now')),
            updated_at TEXT DEFAULT (datetime('now'))
        )",
        [],
    )?;

    let _ = conn.execute(
        "ALTER TABLE inventory_items ADD COLUMN deleted BOOLEAN DEFAULT 0",
        [],
    );

    // We'll manage state in Tauri
    app_handle.manage(AppState {
        db: Mutex::new(conn),
    });

    Ok(())
}

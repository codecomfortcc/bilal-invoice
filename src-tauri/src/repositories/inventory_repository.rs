use rusqlite::{params, Connection};
use crate::domain::models::InventoryItem;
use crate::errors::Result;

pub fn get_inventory_items(conn: &Connection) -> Result<Vec<InventoryItem>> {
    let mut stmt = conn.prepare("SELECT id, title, hsnSac, rate, unit FROM inventory_items WHERE deleted = 0 ORDER BY title ASC")?;
    let rows = stmt.query_map([], |row| {
        Ok(InventoryItem {
            id: row.get(0)?,
            title: row.get(1)?,
            hsn_sac: row.get(2)?,
            rate: row.get(3)?,
            unit: row.get(4)?,
        })
    })?;

    let mut items = Vec::new();
    for row in rows {
        items.push(row?);
    }

    Ok(items)
}

pub fn save_inventory_item(conn: &Connection, item: &InventoryItem) -> Result<()> {
    conn.execute(
        "INSERT INTO inventory_items (id, title, hsnSac, rate, unit, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, datetime('now'))
         ON CONFLICT(id) DO UPDATE SET 
         title=excluded.title, hsnSac=excluded.hsnSac, rate=excluded.rate, unit=excluded.unit, updated_at=datetime('now')",
        params![item.id, item.title, item.hsn_sac, item.rate, item.unit],
    )?;
    Ok(())
}

pub fn delete_inventory_item(conn: &Connection, id: &str) -> Result<()> {
    conn.execute(
        "UPDATE inventory_items SET deleted = 1 WHERE id = ?1",
        params![id],
    )?;
    Ok(())
}

use rusqlite::Connection;
use crate::domain::models::InventoryItem;
use crate::repositories::inventory_repository;
use crate::errors::Result;

pub fn get_inventory_items(conn: &Connection) -> Result<Vec<InventoryItem>> {
    inventory_repository::get_inventory_items(conn)
}

pub fn save_inventory_item(conn: &Connection, item: &InventoryItem) -> Result<()> {
    inventory_repository::save_inventory_item(conn, item)
}

pub fn delete_inventory_item(conn: &Connection, id: &str) -> Result<()> {
    inventory_repository::delete_inventory_item(conn, id)
}

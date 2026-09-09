use crate::domain::models::InventoryItem;
use crate::services::inventory_service;
use crate::state::AppState;
use crate::errors::Result;
use tauri::State;

#[tauri::command]
pub fn get_inventory_items(
    state: State<'_, AppState>,
) -> Result<Vec<InventoryItem>> {
    let conn = state.db.lock().unwrap();
    inventory_service::get_inventory_items(&conn)
}

#[tauri::command]
pub fn save_inventory_item(
    item: InventoryItem,
    state: State<'_, AppState>,
) -> Result<()> {
    let conn = state.db.lock().unwrap();
    inventory_service::save_inventory_item(&conn, &item)
}

#[tauri::command]
pub fn delete_inventory_item(
    id: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let conn = state.db.lock().unwrap();
    inventory_service::delete_inventory_item(&conn, &id)
}

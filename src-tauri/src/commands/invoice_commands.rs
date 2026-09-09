use crate::domain::models::Invoice;
use crate::services::invoice_service;
use crate::state::AppState;
use crate::errors::Result;
use tauri::State;

#[tauri::command]
pub fn get_invoice(
    id: String,
    state: State<'_, AppState>,
) -> Result<Option<Invoice>> {
    let conn = state.db.lock().unwrap();
    invoice_service::get_invoice(&conn, &id)
}

#[tauri::command]
pub fn list_invoices(
    state: State<'_, AppState>,
) -> Result<Vec<Invoice>> {
    let conn = state.db.lock().unwrap();
    invoice_service::list_invoices(&conn)
}

#[tauri::command]
pub fn save_invoice(
    mut invoice: Invoice,
    state: State<'_, AppState>,
) -> Result<Invoice> {
    let conn = state.db.lock().unwrap();
    invoice_service::save_invoice(&conn, &mut invoice)?;
    Ok(invoice)
}

#[tauri::command]
pub fn delete_invoice(
    id: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let conn = state.db.lock().unwrap();
    invoice_service::delete_invoice(&conn, &id)
}

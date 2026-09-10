use crate::domain::models::Invoice;
use crate::services::invoice_service;
use crate::state::AppState;
use crate::errors::Result;
use tauri::State;

#[tauri::command]
pub fn initialize_invoice(
    template: Option<Invoice>,
    state: State<'_, AppState>,
) -> Result<Invoice> {
    let conn = state.db.lock().unwrap();
    invoice_service::initialize_invoice(&conn, template)
}

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

#[derive(serde::Serialize, serde::Deserialize)]
struct ExportData {
    version: String,
    #[serde(rename = "invoiceData")]
    invoice_data: Invoice,
    company: Option<crate::domain::models::Company>,
    timestamp: String,
}

#[tauri::command]
pub fn export_invoice_to_file(
    invoice_id: String,
    file_path: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let conn = state.db.lock().unwrap();
    if let Some(invoice) = invoice_service::get_invoice(&conn, &invoice_id)? {
        let company = crate::repositories::settings_repository::get_company_settings(&conn, "default_company").unwrap_or(None);
        let export_data = ExportData {
            version: "1.0".to_string(),
            invoice_data: invoice,
            company,
            timestamp: chrono::Utc::now().to_rfc3339(),
        };
        let json_str = serde_json::to_string_pretty(&export_data).map_err(|e| crate::errors::AppError::Io(e.to_string()))?;
        std::fs::write(&file_path, json_str)?;
    }
    Ok(())
}

#[tauri::command]
pub fn import_invoice_from_file(
    file_path: String,
    state: State<'_, AppState>,
) -> Result<Invoice> {
    let json_str = std::fs::read_to_string(&file_path)?;
    let export_data: ExportData = serde_json::from_str(&json_str).map_err(|e| crate::errors::AppError::Io(e.to_string()))?;
    
    let mut invoice = export_data.invoice_data;
    // Generate new ID so we don't overwrite existing
    invoice.id = format!("inv_{}", chrono::Local::now().timestamp_millis());
    
    let conn = state.db.lock().unwrap();
    invoice_service::save_invoice(&conn, &mut invoice)?;
    
    if let Some(company) = export_data.company {
        let _ = crate::repositories::settings_repository::save_company_settings(&conn, &company);
    }
    
    Ok(invoice)
}

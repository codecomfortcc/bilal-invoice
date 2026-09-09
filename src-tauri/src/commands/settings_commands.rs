use crate::domain::models::Company;
use crate::services::settings_service;
use crate::state::AppState;
use crate::errors::Result;
use tauri::State;

#[tauri::command]
pub fn get_company_settings(
    id: String,
    state: State<'_, AppState>,
) -> Result<Option<Company>> {
    let conn = state.db.lock().unwrap();
    settings_service::get_company_settings(&conn, &id)
}

#[tauri::command]
pub fn save_company_settings(
    company: Company,
    state: State<'_, AppState>,
) -> Result<()> {
    let conn = state.db.lock().unwrap();
    settings_service::save_company_settings(&conn, &company)
}

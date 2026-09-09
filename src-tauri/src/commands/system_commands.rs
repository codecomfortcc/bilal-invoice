use crate::services::preference_service;
use crate::infrastructure::pdf_service::{self, PdfResult};
use crate::infrastructure::font_service::{self, FontInfo};
use crate::state::AppState;
use crate::errors::Result;
use tauri::{AppHandle, State};

#[tauri::command]
pub fn get_preference(
    key: String,
    state: State<'_, AppState>,
) -> Result<Option<String>> {
    let conn = state.db.lock().unwrap();
    preference_service::get_preference(&conn, &key)
}

#[tauri::command]
pub fn set_preference(
    key: String,
    value: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let conn = state.db.lock().unwrap();
    preference_service::set_preference(&conn, &key, &value)
}

#[tauri::command]
pub fn get_system_fonts() -> Vec<FontInfo> {
    font_service::get_system_fonts()
}

#[tauri::command]
pub fn save_pdf_export(
    app_handle: AppHandle,
    pdf_bytes: Vec<u8>,
    default_filename: String,
    folder_hint: Option<String>,
    file_hint: Option<String>,
) -> Result<PdfResult> {
    pdf_service::save_pdf_export(&app_handle, pdf_bytes, &default_filename, folder_hint, file_hint)
}

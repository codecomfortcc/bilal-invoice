use crate::services::preference_service;
use crate::infrastructure::pdf_service::{self, PdfResult};
use crate::infrastructure::font_service::{self, FontInfo};
use crate::state::AppState;
use crate::errors::Result;
use tauri::{AppHandle, Manager, State};

#[derive(serde::Serialize, serde::Deserialize, Debug)]
pub struct ShortcutBinding {
    pub id: String,
    pub keys: Vec<String>,
    pub key_char: String,
    pub ctrl_key: bool,
    pub shift_key: bool,
    pub alt_key: bool,
}

#[tauri::command]
pub fn open_devtools(app: AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if !window.is_devtools_open() {
            window.open_devtools();
        }
    }
}

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
pub fn get_shortcut_bindings(
    state: State<'_, AppState>,
) -> Result<Vec<ShortcutBinding>> {
    let conn = state.db.lock().unwrap();
    let mut stmt = conn.prepare("SELECT key, value FROM preferences WHERE key LIKE 'shortcut_%'")?;
    let rows = stmt.query_map([], |row| {
        let key: String = row.get(0)?;
        let value: String = row.get(1)?;
        Ok((key, value))
    })?;

    let mut bindings = Vec::new();
    for item in rows {
        if let Ok((key, value)) = item {
            let id = key.trim_start_matches("shortcut_").to_string();
            if let Ok(parsed) = serde_json::from_str::<serde_json::Value>(&value) {
                let keys = parsed["keys"]
                    .as_array()
                    .map(|arr| {
                        arr.iter()
                            .filter_map(|v| v.as_str().map(String::from))
                            .collect()
                    })
                    .unwrap_or_default();
                let key_char = parsed["keyChar"].as_str().unwrap_or("").to_string();
                let ctrl_key = parsed["modifiers"]["ctrlKey"].as_bool().unwrap_or(false);
                let shift_key = parsed["modifiers"]["shiftKey"].as_bool().unwrap_or(false);
                let alt_key = parsed["modifiers"]["altKey"].as_bool().unwrap_or(false);

                bindings.push(ShortcutBinding {
                    id,
                    keys,
                    key_char,
                    ctrl_key,
                    shift_key,
                    alt_key,
                });
            }
        }
    }

    Ok(bindings)
}

#[tauri::command]
pub fn save_shortcut_binding(
    id: String,
    keys: Vec<String>,
    key_char: String,
    ctrl_key: bool,
    shift_key: bool,
    alt_key: bool,
    state: State<'_, AppState>,
) -> Result<()> {
    let conn = state.db.lock().unwrap();
    let key = format!("shortcut_{}", id);
    let payload = serde_json::json!({
        "keys": keys,
        "keyChar": key_char,
        "modifiers": {
            "ctrlKey": ctrl_key,
            "shiftKey": shift_key,
            "altKey": alt_key
        }
    })
    .to_string();

    preference_service::set_preference(&conn, &key, &payload)
}

#[tauri::command]
pub fn reset_shortcut_binding(
    id: String,
    state: State<'_, AppState>,
) -> Result<()> {
    let conn = state.db.lock().unwrap();
    let key = format!("shortcut_{}", id);
    let _ = conn.execute("DELETE FROM preferences WHERE key = ?1", rusqlite::params![key]);
    Ok(())
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

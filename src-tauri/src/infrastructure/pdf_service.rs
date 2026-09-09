use serde::Serialize;
use std::path::PathBuf;
use tauri::AppHandle;
use tauri_plugin_dialog::DialogExt;
use crate::errors::{Result};

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PdfResult {
    pub success: bool,
    pub filename: Option<String>,
    pub folder: Option<String>,
    pub date: Option<String>,
    pub error: Option<String>,
}

pub fn save_pdf_export(
    app_handle: &AppHandle,
    pdf_bytes: Vec<u8>,
    default_filename: &str,
    folder_hint: Option<String>,
    file_hint: Option<String>,
) -> Result<PdfResult> {
    let mut save_path: Option<PathBuf> = None;
    let mut final_folder = String::new();
    let mut final_filename = String::new();

    if let (Some(folder), Some(file)) = (folder_hint, file_hint) {
        let mut path = PathBuf::from(&folder);
        path.push(&file);
        save_path = Some(path);
        final_folder = folder;
        final_filename = file;
    } else {
        let selected_path = app_handle
            .dialog()
            .file()
            .add_filter("PDF Document", &["pdf"])
            .set_file_name(default_filename)
            .blocking_save_file();

        if let Some(path) = selected_path {
            if let Ok(path_buf) = path.into_path() {
                save_path = Some(path_buf.clone());

                if let Some(parent) = path_buf.parent() {
                    final_folder = parent.to_string_lossy().into_owned();
                }
                if let Some(file_name) = path_buf.file_name() {
                    final_filename = file_name.to_string_lossy().into_owned();
                }
            }
        }
    }

    if let Some(path) = save_path {
        if let Err(e) = std::fs::write(&path, pdf_bytes) {
            return Ok(PdfResult {
                success: false,
                filename: None,
                folder: None,
                date: None,
                error: Some(format!("Failed to write file: {}", e)),
            });
        }

        Ok(PdfResult {
            success: true,
            filename: Some(final_filename),
            folder: Some(final_folder),
            date: Some(chrono::Local::now().to_rfc3339()),
            error: None,
        })
    } else {
        Ok(PdfResult {
            success: false,
            filename: None,
            folder: None,
            date: None,
            error: Some("Export cancelled".to_string()),
        })
    }
}

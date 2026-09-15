use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Emitter};
use tauri_plugin_updater::UpdaterExt;

#[derive(Clone, Serialize, Deserialize)]
pub struct UpdateInfo {
    pub version: String,
    pub body: Option<String>,
}

#[derive(Clone, Serialize)]
pub struct ProgressPayload {
    pub downloaded: u64,
    pub total: Option<u64>,
}

fn get_update_file_path(version: &str) -> PathBuf {
    let mut path = env::temp_dir();
    path.push(format!("bilal_update_{}.bin", version));
    path
}

#[tauri::command]
pub async fn check_for_updates(app: AppHandle) -> Result<Option<UpdateInfo>, String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    
    match updater.check().await {
        Ok(Some(update)) => {
            Ok(Some(UpdateInfo {
                version: update.version.clone(),
                body: update.body.clone(),
            }))
        }
        Ok(None) => Ok(None),
        Err(e) => Err(format!("Failed to check for updates: {}", e)),
    }
}

#[tauri::command]
pub async fn check_downloaded_update(version: String) -> Result<bool, String> {
    let path = get_update_file_path(&version);
    Ok(path.exists())
}

#[tauri::command]
pub async fn download_update(app: AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    
    match updater.check().await {
        Ok(Some(update)) => {
            let app_clone = app.clone();
            let version = update.version.clone();
            
            // Download the update bytes
            let bytes = update.download(
                move |chunk_length, content_length| {
                    let _ = app_clone.emit("updater-progress", ProgressPayload {
                        downloaded: chunk_length as u64,
                        total: content_length.map(|l| l as u64),
                    });
                },
                || {
                    let _ = app.emit("updater-status", "downloaded");
                }
            ).await.map_err(|e| e.to_string())?;

            // Store bytes to physical temp file so it persists across app restarts
            let path = get_update_file_path(&version);
            fs::write(&path, bytes).map_err(|e| format!("Failed to save update to disk: {}", e))?;
            
            Ok(())
        }
        Ok(None) => Err("No update available to download.".to_string()),
        Err(e) => Err(format!("Failed to check for updates: {}", e)),
    }
}

#[tauri::command]
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    
    match updater.check().await {
        Ok(Some(update)) => {
            let path = get_update_file_path(&update.version);
            if !path.exists() {
                return Err("Update file not found on disk. Please download it again.".to_string());
            }

            let bytes = fs::read(&path).map_err(|e| format!("Failed to read update file: {}", e))?;
            
            // Install the update using the bytes from disk
            update.install(bytes).map_err(|e| e.to_string())?;
            
            // Clean up the temp file after successful install initiation
            let _ = fs::remove_file(path);
            
            app.restart();
            Ok(())
        }
        Ok(None) => Err("No update metadata available to install.".to_string()),
        Err(e) => Err(format!("Failed to check for updates before install: {}", e)),
    }
}

use serde::{Deserialize, Serialize};
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
pub async fn install_update(app: AppHandle) -> Result<(), String> {
    let updater = app.updater().map_err(|e| e.to_string())?;
    
    match updater.check().await {
        Ok(Some(mut update)) => {
            let app_clone = app.clone();
            
            // Download and install the update
            update.download_and_install(
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

            // Restart after successful installation
            app.restart();
            Ok(())
        }
        Ok(None) => Err("No update available to install.".to_string()),
        Err(e) => Err(format!("Failed to check for updates: {}", e)),
    }
}

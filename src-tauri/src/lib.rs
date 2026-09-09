mod commands;
mod domain;
mod errors;
mod infrastructure;
mod repositories;
mod services;
mod state;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .setup(|app| {
            repositories::db::init_db(app.handle()).expect("Failed to initialize database");
            Ok(())
        })
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::settings_commands::get_company_settings,
            commands::settings_commands::save_company_settings,
            commands::system_commands::get_preference,
            commands::system_commands::set_preference,
            commands::invoice_commands::save_invoice,
            commands::invoice_commands::get_invoice,
            commands::invoice_commands::list_invoices,
            commands::invoice_commands::delete_invoice,
            commands::inventory_commands::get_inventory_items,
            commands::inventory_commands::save_inventory_item,
            commands::inventory_commands::delete_inventory_item,
            commands::system_commands::save_pdf_export,
            commands::system_commands::get_system_fonts,
            commands::updater_commands::check_for_updates,
            commands::updater_commands::install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

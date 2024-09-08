// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use state::AppStateInner;
use tauri::Manager;
use tokio::sync::Mutex;

pub mod commands;
pub mod error;
pub mod events;
pub mod platforms;
pub mod repo;
pub mod settings;
pub mod state;
pub mod submodule;
pub mod utils;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    let app_state = Mutex::new(AppStateInner::new().await?);

    sqlx::migrate!().run(&app_state.lock().await.pool).await?;

    tauri::Builder::default()
        .setup(|app| {
            app.manage(app_state);
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            get_version,
            commands::repo::add_repo,
            commands::repo::get_repo_list
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

#[tauri::command]
fn get_version<'a>() -> &'a str {
    env!("CARGO_PKG_VERSION")
}

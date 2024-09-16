// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use error::AppResult;
use state::AppStateInner;
use tauri::Manager;
use tokio::sync::Mutex;
use tracing_error::ErrorLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt, Layer};
use utils::dirs::get_cache_dir;

pub mod commands;
pub mod error;
pub mod events;
pub mod platforms;
pub mod repo;
pub mod settings;
pub mod state;
pub mod submodule;
pub mod user;
pub mod utils;

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let app_state = Mutex::new(AppStateInner::new().await?);

    init_tracing().expect("failed to initialize tracing");

    sqlx::migrate!()
        .run(&app_state.lock().await.pool)
        .await
        .expect("failed to run sqlx migrations");

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
            commands::repo::get_repo_list,
            commands::repo::get_repo,
            commands::repo::remove_repo,
            commands::settings::get_settings,
            commands::settings::set_theme,
            commands::user::get_user,
            commands::user::remove_user,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");

    Ok(())
}

#[tauri::command]
fn get_version<'a>() -> &'a str {
    env!("CARGO_PKG_VERSION")
}

fn init_tracing() -> AppResult<()> {
    std::env::set_var("RUST_LOG", "INFO");

    let log_path = get_cache_dir().join("debug.log");
    let log_file = std::fs::File::create(log_path)?;

    let file_subscriber = tracing_subscriber::fmt::layer()
        .with_file(true)
        .with_line_number(true)
        .with_writer(log_file)
        .with_target(false)
        .with_ansi(false)
        .with_filter(tracing_subscriber::filter::EnvFilter::from_default_env());

    let terminal_subscriber = tracing_subscriber::fmt::layer()
        .with_file(true)
        .with_line_number(true)
        .with_writer(std::io::stdout)
        .with_target(false)
        .with_ansi(true)
        .with_filter(tracing_subscriber::filter::EnvFilter::from_default_env());

    tracing_subscriber::registry()
        .with(file_subscriber)
        .with(terminal_subscriber)
        .with(ErrorLayer::default())
        .init();

    Ok(())
}

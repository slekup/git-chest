use std::str::FromStr;

use tokio::time::Instant;
use tracing::info;

use crate::{
    error::AppResult,
    settings::{load_settings, Settings, Theme},
};

#[tauri::command(rename_all = "snake_case")]
pub async fn get_settings() -> AppResult<Settings> {
    let start = Instant::now();
    let settings = load_settings().await?;
    info!("got settings in {:?}", start.elapsed());
    Ok(settings)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn set_theme(theme: String) -> AppResult<Settings> {
    let start = Instant::now();
    let mut settings = load_settings().await?;
    settings.theme = Theme::from_str(&theme)?;
    info!("updated settings in {:?}", start.elapsed());
    Ok(settings)
}

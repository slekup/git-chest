use std::str::FromStr;

use serde::{Deserialize, Serialize};
use tokio::fs;

use crate::{
    error::{AppError, AppResult},
    utils::dirs::get_config_dir,
};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Theme {
    Dark,
    Light,
}

impl FromStr for Theme {
    type Err = AppError;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "dark" => Ok(Self::Dark),
            "light" => Ok(Self::Light),
            _ => AppError::new(&format!("No theme found: {s}")),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct AuthSettings {
    pub github_token: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct Settings {
    pub theme: Theme,
    pub auto_sync: bool,
    pub auth: AuthSettings,
}

const DEFAULT_SETTINGS: Settings = Settings {
    theme: Theme::Dark,
    auto_sync: false,
    auth: AuthSettings { github_token: None },
};

pub async fn load_settings() -> AppResult<Settings> {
    let path = get_config_dir().join("settings.json");

    if !path.exists() {
        save_settings(&DEFAULT_SETTINGS).await?;
    }

    let file = fs::read_to_string(path).await?;
    let settings: Settings = serde_json::from_str(&file)?;
    Ok(settings)
}

pub async fn save_settings(settings: &Settings) -> AppResult<()> {
    let path = get_config_dir().join("settings.json");
    let file = serde_json::to_string(settings)?;
    fs::write(path, file).await?;
    Ok(())
}

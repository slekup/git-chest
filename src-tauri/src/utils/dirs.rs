use std::path::PathBuf;

use tokio::fs;
use tracing::info;

use crate::error::AppResult;

/// Where the application configuration files are stored.
pub fn get_config_dir() -> PathBuf {
    dirs::config_local_dir().unwrap().join("big-brain")
}

/// Where the non-cache data for the application is stored.
pub fn get_data_dir() -> PathBuf {
    dirs::data_local_dir().unwrap().join("big-brain")
}

/// Where the cache data for the application is stored.
pub fn get_cache_dir() -> PathBuf {
    dirs::cache_dir().unwrap().join("big-brain")
}

/// Ensure that a directory and all parent directories are created.
pub async fn ensure_dir(dir: &PathBuf) -> AppResult<()> {
    if !fs::try_exists(dir).await? {
        let dir_str = dir.to_str().unwrap();
        info!("Creating non-existent directory: {:?}", dir_str);
        fs::create_dir_all(dir).await?;
    }
    Ok(())
}

/// Ensure that the list of application directories are created.
pub async fn ensure_dirs() -> AppResult<()> {
    let config_dir = get_config_dir();
    let data_dir = get_data_dir();
    let cache_dir = get_cache_dir();

    let dirs = [config_dir, data_dir.join("images"), cache_dir];

    for dir in dirs {
        ensure_dir(&dir).await?;
    }

    Ok(())
}

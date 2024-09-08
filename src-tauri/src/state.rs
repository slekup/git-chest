use sqlx::{migrate::MigrateDatabase, Sqlite, SqlitePool};
use tokio::sync::Mutex;
use tracing::info;

use crate::{
    error::AppResult,
    platforms::github::api::GitHubAPI,
    utils::dirs::{ensure_dirs, get_data_dir},
};

pub struct APIs {
    pub github: GitHubAPI,
}

pub struct AppStateInner {
    pub pool: SqlitePool,
    pub apis: APIs,
}

pub type AppState = Mutex<AppStateInner>;

impl AppStateInner {
    pub async fn new() -> AppResult<Self> {
        ensure_dirs().await?;
        let data_dir = get_data_dir();

        let db_path = data_dir.join("data.db");
        let db_path_str = db_path.to_str().unwrap();

        if !Sqlite::database_exists(db_path_str).await.unwrap_or(false) {
            info!("Creating non-existent database \"{}\"", db_path_str);
            match Sqlite::create_database(db_path_str).await {
                Ok(_) => info!("Created DB successfully"),
                Err(error) => panic!("Failed to create DB: {}", error),
            }
        }

        let pool = SqlitePool::connect(db_path_str).await?;

        info!("Connected to sqlite database");

        Ok(Self {
            pool,
            apis: APIs {
                github: GitHubAPI::init(),
            },
        })
    }
}

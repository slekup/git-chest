use serde::Serialize;
use sqlx::prelude::FromRow;

/// Basic repository data.
#[derive(Serialize, FromRow)]
pub struct Repo {
    id: i64,
    platform: String,
    user: String,
    repo: String,
    clone_data: bool,
    /// 0 = disabled, 1 = enabled, 2 = use global setting.
    auto_sync: u8,
    created_at: String,
    updated_at: String,
}


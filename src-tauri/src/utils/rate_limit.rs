use chrono::{DateTime, Utc};
use sqlx::{prelude::FromRow, SqlitePool};
use tracing::error;

use crate::error::{AppError, AppResult};

#[derive(FromRow)]
pub struct RateLimit {
    pub max: i32,
    pub remaining: i32,
    pub used: i32,
    pub reset_at: i64,
    pub resource: String,
}

impl RateLimit {
    fn to_reset_datetime(&self) -> DateTime<Utc> {
        DateTime::from_timestamp(self.reset_at, 0).unwrap_or_else(Utc::now)
    }
}

async fn get_rate_limit(id: &str, resource: &str, pool: &SqlitePool) -> AppResult<RateLimit> {
    let rate_limit = sqlx::query_as::<_, RateLimit>(
        "SELECT max, remaining, used, reset_at, resource FROM rate_limit WHERE id = ? AND resource = ?",
    )
    .bind(id)
    .bind(resource)
    .fetch_one(pool)
    .await?;
    Ok(rate_limit)
}

pub async fn update_rate_limit(
    id: &str,
    max: i64,
    remaining: i64,
    used: i64,
    reset_at: i64,
    resource: &str,
    pool: &SqlitePool,
) -> AppResult<()> {
    let query =
        "INSERT OR REPLACE INTO rate_limit (id, max, remaining, used, reset_at, resource) VALUES (?, ?, ?, ?, ?, ?)";
    sqlx::query(query)
        .bind(id)
        .bind(max)
        .bind(remaining)
        .bind(used)
        .bind(reset_at)
        .bind(resource)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error updating rate limit in database"
        })?;
    Ok(())
}

pub async fn check_rate_limit(id: &str, resource: &str, pool: &SqlitePool) -> AppResult<()> {
    let rate_limit = get_rate_limit(id, resource, pool).await;

    if let Ok(rate_limit) = rate_limit {
        let reset_at = rate_limit.to_reset_datetime();
        let now = Utc::now();
        if rate_limit.remaining <= 0 && reset_at > now {
            return AppError::new("rate limit exceeded");
        }
    }

    Ok(())
}

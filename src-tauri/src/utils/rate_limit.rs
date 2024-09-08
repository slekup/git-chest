use chrono::{DateTime, Utc};
use sqlx::{prelude::FromRow, SqlitePool};

use crate::error::{AppError, AppResult};

#[derive(FromRow)]
pub struct RateLimit {
    pub limit_value: i32,
    pub remaining: i32,
    pub reset_value: i64,
}

impl RateLimit {
    fn to_reset_datetime(&self) -> DateTime<Utc> {
        DateTime::from_timestamp(self.reset_value, 0).unwrap_or_else(Utc::now)
    }
}

async fn get_rate_limit(id: &str, pool: &SqlitePool) -> AppResult<RateLimit> {
    let rate_limit = sqlx::query_as::<_, RateLimit>(
        "SELECT limit_value, remaining, reset_value FROM rate_limit WHERE id = ?",
    )
    .bind(id)
    .fetch_one(pool)
    .await?;
    Ok(rate_limit)
}

pub async fn update_rate_limit(
    id: &str,
    limit: i64,
    remaining: i64,
    reset: i64,
    pool: &SqlitePool,
) -> Result<(), sqlx::Error> {
    let query =
        "INSERT OR REPLACE INTO rate_limit (id, limit_value, remaining, reset_value) VALUES (?, ?, ?, ?)";
    sqlx::query(query)
        .bind(id)
        .bind(limit)
        .bind(remaining)
        .bind(reset)
        .execute(pool)
        .await?;
    Ok(())
}

pub async fn check_rate_limit(id: &str, pool: &SqlitePool) -> AppResult<()> {
    let rate_limit = get_rate_limit(id, pool).await;

    if let Ok(rate_limit) = rate_limit {
        let reset_time = rate_limit.to_reset_datetime();
        let now = Utc::now();
        if rate_limit.remaining <= 0 && reset_time > now {
            return AppError::new("rate limit exceeded");
        }
    }

    Ok(())
}

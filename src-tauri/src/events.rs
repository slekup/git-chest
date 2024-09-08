use serde::Serialize;
use sqlx::SqlitePool;
use tokio::time::Instant;
use tracing::info;

use crate::error::{AppError, AppResult};

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
enum RepoEvent {
    Branch,
    Contributor,
    Commit,
    Discussion,
    Fork,
    Issue,
    PullRequest,
    Release,
    Star,
    Tag,
}

impl std::fmt::Display for RepoEvent {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(
            f,
            "{}",
            serde_json::to_string(self)
                .unwrap()
                .as_str()
                .trim_matches('"')
        )
    }
}

impl RepoEvent {
    pub const LIST: [Self; 10] = [
        Self::Branch,
        Self::Contributor,
        Self::Commit,
        Self::Discussion,
        Self::Fork,
        Self::Issue,
        Self::PullRequest,
        Self::Release,
        Self::Star,
        Self::Tag,
    ];

    pub fn is_valid(event: &str) -> bool {
        Self::LIST.iter().any(|e| e.to_string() == event)
    }
}

async fn watch_repo_event(repo_id: i64, event: &str, pool: &SqlitePool) -> AppResult<()> {
    if !RepoEvent::is_valid(event) {
        return AppError::new(&format!("Invalid repo event \"{}\"", event));
    }

    let query = "INSERT INTO watch_repo_event (repo_id, event) VALUES (?, ?)";
    sqlx::query(query)
        .bind(repo_id)
        .bind(event)
        .execute(pool)
        .await?
        .last_insert_rowid();

    Ok(())
}

pub async fn watch_repo_events(
    repo_id: i64,
    events: Vec<String>,
    pool: &SqlitePool,
) -> AppResult<()> {
    let start = Instant::now();

    for event in events.iter() {
        watch_repo_event(repo_id, event, pool).await?;
    }

    info!(
        "added watch events {} to repo {} in {:?}",
        events
            .iter()
            .map(|e| e.as_str())
            .collect::<Vec<&str>>()
            .join(", "),
        repo_id,
        start.elapsed()
    );

    Ok(())
}

use std::str::FromStr;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tauri::{AppHandle, Emitter, State};
use tokio::time::Instant;
use tracing::info;

use crate::{
    error::{AppError, AppResult},
    events::watch_repo_events,
    platforms::github::add_github_repo,
    repo::{Platform, Repo},
    state::AppState,
};

#[derive(Deserialize)]
pub struct AddRepoData {
    platform: String,
    user: String,
    repo: String,
    /// Whether to add submodules as repos.
    clone_data: bool,
    auto_sync: u8,
    add_submodules: bool,
    watch_events: Vec<String>,
}

/// Check if the repo already exists.
async fn check_repo_exists(user: &str, repo: &str, pool: &SqlitePool) -> AppResult<bool> {
    let exists = sqlx::query("SELECT id FROM repo WHERE user = ? AND repo = ?")
        .bind(user)
        .bind(repo)
        .fetch_optional(pool)
        .await?;
    Ok(exists.is_some())
}

#[derive(Serialize, Clone)]
pub struct AddRepoProgress {
    progress: u8,
    step: String,
}

impl AddRepoProgress {
    pub fn from(progress: u8, step: &str) -> Self {
        Self {
            progress,
            step: step.to_string(),
        }
    }
}

#[tauri::command(rename_all = "snake_case")]
pub async fn add_repo(
    repo: AddRepoData,
    state: State<'_, AppState>,
    app: AppHandle,
) -> AppResult<i64> {
    let start = Instant::now();
    let state = state.lock().await;

    if check_repo_exists(&repo.user, &repo.repo, &state.pool).await? {
        return AppError::new("Repository already exists.");
    }

    let query =
        "INSERT INTO repo (platform, user, repo, clone_data, auto_sync, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)";
    let repo_id = sqlx::query(query)
        .bind(&repo.platform)
        .bind(&repo.user)
        .bind(&repo.repo)
        .bind(repo.clone_data)
        .bind(repo.auto_sync)
        .bind(Utc::now().to_rfc3339())
        .bind(Utc::now().to_rfc3339())
        .execute(&state.pool)
        .await?
        .last_insert_rowid();

    app.emit(
        "add-repo-progress",
        AddRepoProgress::from(100, "insert_basic_info"),
    )
    .unwrap();

    match Platform::from_str(&repo.platform)? {
        Platform::Bitbucket => {}
        Platform::GitHub => {
            add_github_repo(
                repo_id,
                &repo.user,
                &repo.repo,
                &state.apis.github,
                &state.pool,
                &app,
            )
            .await?
        }
        Platform::GitLab => {}
        Platform::Gitea => {}
    }

    if repo.clone_data {
        // TODO: Clone the repository file contents.
    }

    if !repo.watch_events.is_empty() {
        watch_repo_events(repo_id, repo.watch_events, &state.pool).await?;
    }

    if repo.add_submodules {
        // TODO: Add the submodules in the repo with the same configuration.
        // 1. Fetch the tree from API.
        // 2. Extract submodules.
        // 3. Fetch submodules and add the same way as repo.
    }

    info!(
        "added repo {}/{} in {:?}",
        repo.user,
        repo.repo,
        start.elapsed()
    );

    Ok(repo_id)
}

#[derive(Serialize)]
pub struct RepoPreview {
    id: i64,
    platform: String,
    user: String,
    repo: String,
    clone_data: bool,
    auto_sync: u8,
    updated_at: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_repo_list(state: State<'_, AppState>) -> AppResult<Vec<RepoPreview>> {
    let start = Instant::now();
    let state = state.lock().await;

    let query = "SELECT * FROM repo LIMIT 100";
    let repos = sqlx::query_as::<_, Repo>(query)
        .fetch_all(&state.pool)
        .await?;

    let repos = repos
        .into_iter()
        .map(|r| RepoPreview {
            id: r.id,
            platform: r.platform,
            user: r.user,
            repo: r.repo,
            clone_data: r.clone_data,
            auto_sync: r.auto_sync,
            updated_at: r.updated_at,
        })
        .collect();

    info!("fetched repos in {:?}", start.elapsed());

    Ok(repos)
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_repo(state: State<'_, AppState>) -> AppResult<Vec<Repo>> {
    let start = Instant::now();
    let state = state.lock().await;

    let query = "SELECT * FROM repo LIMIT 100";
    let repos = sqlx::query_as::<_, Repo>(query)
        .fetch_all(&state.pool)
        .await?;

    info!("fetched repos in {:?}", start.elapsed());

    Ok(repos)
}

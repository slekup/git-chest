use std::str::FromStr;

use chrono::Utc;
use serde::{Deserialize, Serialize};
use sqlx::{prelude::FromRow, SqlitePool};
use tauri::{AppHandle, Emitter, State};
use tokio::time::Instant;
use tracing::{error, info};

use crate::{
    error::{AppError, AppResult},
    events::watch_repo_events,
    platforms::{
        github::{add_github_repo, get_github_repo, get_github_repo_preview},
        Platform,
    },
    repo::{PlatformRepoData, Repo, RepoTree, RepoTreeItem},
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
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error checking if repository exists in database"
        })?;
    Ok(exists.is_some())
}

#[derive(Serialize, Clone)]
struct AddRepoProgressData {
    platform: String,
    user: String,
    repo: String,
    percentage: u8,
    task_id: AddRepoProgress,
    step: u64,
    total_steps: u64,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "snake_case")]
pub enum AddRepoProgress {
    Metadata,
    FetchTree,
    InsertTree,
    Readme,
    Owner,
}

impl AddRepoProgress {
    #[allow(clippy::too_many_arguments)]
    pub fn send(
        self,
        platform: &str,
        user: &str,
        repo: &str,
        percentage: u8,
        step: u64,
        total_steps: u64,
        app: &AppHandle,
    ) {
        app.emit(
            "add-repo-progress",
            AddRepoProgressData {
                platform: platform.to_string(),
                user: user.to_string(),
                repo: repo.to_string(),
                task_id: self,
                percentage,
                step,
                total_steps,
            },
        )
        .unwrap();
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
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error adding repository data into database"
        })?
        .last_insert_rowid();

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
pub struct RepoPreviewOwner {
    pub id: i64,
    pub user: String,
    pub avatar: String,
}

#[derive(Serialize)]
pub struct RepoPreview {
    id: i64,
    platform: String,
    repo: String,
    clone_data: bool,
    updated_at: String,
    owner: RepoPreviewOwner,
    description: String,
    stars: i32,
    forks: i32,
    issues: i32,
    pull_requests: i32,
}

#[derive(FromRow)]
pub struct DbRepoPreview {
    id: i64,
    platform: String,
    repo: String,
    clone_data: bool,
    updated_at: String,
}

#[derive(FromRow)]
pub struct DbPlatformRepo {
    pub description: String,
    pub stars: i32,
    pub forks: i32,
    pub issues: i32,
    pub pull_requests: i32,
    pub visibility: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_repo_list(state: State<'_, AppState>) -> AppResult<Vec<RepoPreview>> {
    let start = Instant::now();
    let state = state.lock().await;
    let mut repos: Vec<RepoPreview> = Vec::new();

    let query = "SELECT id, platform, repo, clone_data, updated_at FROM repo LIMIT 100";
    let db_repos = sqlx::query_as::<_, DbRepoPreview>(query)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting repositories from database"
        })?;

    for repo in db_repos {
        // let (platform_repo, platform_owner) = match Platform::from_str(&repo.platform)? {
        //     _ => get_github_repo_preview(repo.id, &state.pool).await?,
        // };

        let (platform_repo, platform_owner) = get_github_repo_preview(repo.id, &state.pool).await?;

        repos.push(RepoPreview {
            id: repo.id,
            platform: repo.platform,
            repo: repo.repo,
            clone_data: repo.clone_data,
            updated_at: repo.updated_at,
            owner: platform_owner,
            description: platform_repo.description,
            stars: platform_repo.stars,
            forks: platform_repo.forks,
            issues: platform_repo.issues,
            pull_requests: platform_repo.pull_requests,
        });
    }

    info!("fetched repos in {:?}", start.elapsed());

    Ok(repos)
}

#[derive(Serialize)]
pub struct FullRepo {
    repo: Repo,
    platform_repo: PlatformRepoData,
    tree: RepoTree,
    tree_items: Vec<RepoTreeItem>,
    readme: Option<String>,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_repo(
    id: i64,
    tree_id: Option<i64>,
    state: State<'_, AppState>,
) -> AppResult<FullRepo> {
    let start = Instant::now();
    let state = state.lock().await;

    let query = "SELECT * FROM repo WHERE id = ?";
    let repo = sqlx::query_as::<_, Repo>(query)
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting repository from database"
        })?;

    let platform_repo = match Platform::from_str(&repo.platform)? {
        Platform::Bitbucket => PlatformRepoData::Bitbucket,
        Platform::GitHub => {
            let a = get_github_repo(id, &state.pool).await?;
            PlatformRepoData::GitHub(a)
        }
        Platform::GitLab => PlatformRepoData::GitLab,
        Platform::Gitea => PlatformRepoData::Gitea,
    };

    let tree_query = "SELECT sha, truncated FROM repo_tree WHERE repo_id = ?";
    let tree = sqlx::query_as(tree_query)
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting repository tree from database"
        })?;

    let parent_id_query = if let Some(tree_id) = tree_id {
        &format!("parent_id = {}", tree_id)
    } else {
        "parent_id IS NULL"
    };
    let tree_items_query = format!(
        "
        SELECT *
        FROM repo_tree_item
        WHERE repo_id = ? AND {}
        ORDER BY
            CASE
                WHEN type = 'tree' THEN 0
                ELSE 1
            END;
        ",
        parent_id_query
    );
    let tree_items = sqlx::query_as::<_, RepoTreeItem>(&tree_items_query)
        .bind(id)
        .fetch_all(&state.pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting repository tree items from database"
        })?;

    let readme_query = "SELECT content FROM repo_readme WHERE repo_id = ?";
    let readme = sqlx::query_scalar::<_, String>(readme_query)
        .bind(id)
        .fetch_optional(&state.pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error querying optional repository readme from database"
        })?;

    info!(
        "fetched full repo \"{}/{}\" in {:?}",
        repo.user,
        repo.repo,
        start.elapsed()
    );

    Ok(FullRepo {
        repo,
        platform_repo,
        tree,
        tree_items,
        readme,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn remove_repo(id: i64, state: State<'_, AppState>) -> AppResult<()> {
    let start = Instant::now();
    let state = state.lock().await;

    let query = "DELETE FROM repo WHERE id = ?";
    sqlx::query(query)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error deleting repository from database"
        })?;

    info!("deleted repo \"{id}\" in {:?}", start.elapsed());

    Ok(())
}

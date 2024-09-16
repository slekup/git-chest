use std::str::FromStr;

use serde::Serialize;
use sqlx::FromRow;
use tauri::State;
use tokio::time::Instant;
use tracing::error;
use tracing::info;

use crate::platforms::github::get_github_user;
use crate::platforms::github::models::GitHubUserData;
use crate::platforms::Platform;
use crate::{error::AppResult, state::AppState};

pub enum PlatformUser {
    GitHub(),
}

#[derive(FromRow)]
pub struct User {
    platform: String,
    created_at: String,
    updated_at: String,
}

#[derive(Serialize)]
#[serde(tag = "type", content = "data")]
#[allow(clippy::large_enum_variant)]
pub enum PlatformUserData {
    Bitbucket,
    GitHub(GitHubUserData),
    GitLab,
    Gitea,
}

#[derive(Serialize)]
pub struct FullUser {
    platform_user: PlatformUserData,
    avatar_id: i64,
    created_at: String,
    updated_at: String,
}

#[tauri::command(rename_all = "snake_case")]
pub async fn get_user(id: i64, state: State<'_, AppState>) -> AppResult<FullUser> {
    let start = Instant::now();
    let state = state.lock().await;

    let query = "SELECT * FROM user WHERE id = ?";
    let user = sqlx::query_as::<_, User>(query)
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting user from database"
        })?;

    let avatar_id_query = "SELECT id FROM user_avatar WHERE user_id = ?";
    let avatar_id = sqlx::query_scalar::<_, i64>(avatar_id_query)
        .bind(id)
        .fetch_one(&state.pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting user avatar id from database"
        })?;

    let platform_user = match Platform::from_str(&user.platform)? {
        Platform::Bitbucket => PlatformUserData::Bitbucket,
        Platform::GitHub => {
            let github_user = get_github_user(id, &state.pool).await?;
            PlatformUserData::GitHub(github_user)
        }
        Platform::GitLab => PlatformUserData::GitLab,
        Platform::Gitea => PlatformUserData::Gitea,
    };

    info!("fetched full user \"{}\" in {:?}", id, start.elapsed());

    Ok(FullUser {
        platform_user,
        avatar_id,
        created_at: user.created_at,
        updated_at: user.updated_at,
    })
}

#[tauri::command(rename_all = "snake_case")]
pub async fn remove_user(id: i64, state: State<'_, AppState>) -> AppResult<()> {
    let start = Instant::now();
    let state = state.lock().await;

    let query = "DELETE FROM user WHERE id = ?";
    sqlx::query(query)
        .bind(id)
        .execute(&state.pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error deleting user from database"
        })?;

    info!("deleted user \"{id}\" in {:?}", start.elapsed());

    Ok(())
}

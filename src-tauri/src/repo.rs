use std::str::FromStr;

use serde::Serialize;
use sqlx::prelude::FromRow;

use crate::{error::AppError, platforms::github::models::GitHubRepoData};

/// Basic repository data.
#[derive(Serialize, FromRow)]
pub struct Repo {
    pub id: i64,
    pub platform: String,
    pub user: String,
    pub repo: String,
    pub clone_data: bool,
    /// 0 = disabled, 1 = enabled, 2 = use global setting.
    pub auto_sync: u8,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize)]
#[serde(rename_all = "snake_case")]
pub enum Platform {
    Bitbucket,
    GitHub,
    GitLab,
    Gitea,
}

impl FromStr for Platform {
    type Err = AppError;
    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "bitbucket" => Ok(Platform::Bitbucket),
            "github" => Ok(Platform::GitHub),
            "gitlab" => Ok(Platform::GitLab),
            "gitea" => Ok(Platform::Gitea),
            _ => AppError::new("Invalid platform"),
        }
    }
}

impl std::fmt::Display for Platform {
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

#[derive(Serialize)]
#[serde(tag = "kind", content = "data")]
#[allow(clippy::large_enum_variant)]
pub enum PlatformRepoData {
    // TODO: Add other platform variants.
    Bitbucket,
    GitHub(GitHubRepoData),
    GitLab,
    Gitea,
}

#[derive(Serialize, FromRow)]
pub struct RepoTreeItem {
    path: String,
    mode: String,
    r#type: String,
    sha: String,
    size: Option<i32>,
}

#[derive(Serialize, FromRow)]
pub struct RepoTree {
    sha: String,
    truncated: bool,
}

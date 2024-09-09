use std::str::FromStr;

use serde::Serialize;
use sqlx::prelude::FromRow;

use crate::{error::AppError, platforms::github::models::GitHubRepo};

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
        match s.to_lowercase().as_str() {
            "bitbucket" => Ok(Platform::Bitbucket),
            "github" => Ok(Platform::GitHub),
            "gitlab" => Ok(Platform::GitLab),
            "gitea" => Ok(Platform::Gitea),
            _ => AppError::new("Unknown platform"),
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
pub enum PlatformRepoData {
    GitHub(GitHubRepo),
    // TODO: Add other platform variants.
}

#[derive(FromRow)]
pub struct RepoTreeItem {
    repo_id: i64,
    parent_id: Option<i64>,
    path: String,
    mode: String,
    r#type: String,
    sha: String,
    size: Option<i32>,
}

#[derive(FromRow)]
pub struct RepoTree {
    repo_id: i64,
    sha: String,
    tree: Vec<RepoTreeItem>,
    truncated: bool,
}

pub struct RepoReadme {
    repo_id: i64,
    content: String,
}

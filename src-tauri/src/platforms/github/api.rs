use sqlx::SqlitePool;
use tauri::http::HeaderMap;
use tokio::time::Instant;
use tracing::info;

use crate::{
    error::{AppError, AppResult},
    platforms::github::api_models::GitHubAPIRepoTree,
    utils::{
        data::parse_header,
        rate_limit::{check_rate_limit, update_rate_limit},
    },
};

use super::api_models::{GitHubAPIRepo, GitHubAPIRepoReadMe};

pub struct GitHubAPI {
    client: reqwest::Client,
    base_url: &'static str,
    base_content_url: &'static str,
}

impl GitHubAPI {
    pub fn init() -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: "https://api.github.com",
            base_content_url: "https://raw.githubusercontent.com",
        }
    }

    pub async fn update_rate_limit(&self, headers: &HeaderMap, pool: &SqlitePool) -> AppResult<()> {
        let limit = parse_header(headers, "X-RateLimit-Limit").unwrap_or(0);
        let remaining = parse_header(headers, "X-RateLimit-Remaining").unwrap_or(0);
        let reset = parse_header(headers, "X-RateLimit-Reset").unwrap_or(0);
        update_rate_limit("github", limit, remaining, reset, pool).await?;
        Ok(())
    }

    async fn check_rate_limit(&self, pool: &SqlitePool) -> AppResult<()> {
        check_rate_limit("github", pool).await
    }

    /// Fetch a GitHub repository.
    pub async fn fetch_repo(
        &self,
        user: &str,
        repo: &str,
        pool: &SqlitePool,
    ) -> AppResult<GitHubAPIRepo> {
        self.check_rate_limit(pool).await?;
        let start = Instant::now();

        let res = self
            .client
            .get(format!("{}/repos/{}/{}", self.base_url, user, repo))
            .header("Accept", "application/vnd.github+json")
            .header("User-Agent", "Git Chest")
            .send()
            .await?;

        info!("Status: {}", &res.status());

        if let Err(error) = res.error_for_status_ref() {
            tracing::error!("{}", res.text().await?);
            return AppError::new(&error.to_string());
        }

        self.update_rate_limit(res.headers(), pool).await?;

        let data = res.json::<GitHubAPIRepo>().await?;

        info!("fetching github repo took {:?}", start.elapsed());

        Ok(data)
    }

    pub async fn fetch_repo_tree(
        &self,
        user: &str,
        repo: &str,
        branch: &str,
        pool: &SqlitePool,
    ) -> AppResult<GitHubAPIRepoTree> {
        self.check_rate_limit(pool).await?;
        let start = Instant::now();

        let res = self
            .client
            .get(format!(
                "{}/repos/{}/{}/git/trees/{}?recursive=true",
                self.base_url, user, repo, branch
            ))
            .header("Accept", "application/vnd.github+json")
            .header("User-Agent", "Git Chest")
            .send()
            .await?;

        self.update_rate_limit(res.headers(), pool).await?;

        let data = res.json::<GitHubAPIRepoTree>().await?;

        info!("fetching github repo tree took {:?}", start.elapsed());

        Ok(data)
    }

    pub async fn fetch_repo_readme(
        &self,
        user: &str,
        repo: &str,
        branch: &str,
        filename: &str,
        pool: &SqlitePool,
    ) -> AppResult<String> {
        self.check_rate_limit(pool).await?;
        let start = Instant::now();

        let res = self
            .client
            .get(format!(
                "{}/{}/{}/{}/{}",
                self.base_content_url, user, repo, branch, filename
            ))
            .send()
            .await?;

        self.update_rate_limit(res.headers(), pool).await?;

        let data = res.text().await?;

        info!("fetching github repo readme took {:?}", start.elapsed());

        Ok(data)
    }
}

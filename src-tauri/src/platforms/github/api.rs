use sqlx::SqlitePool;
use tauri::http::HeaderMap;
use tokio::time::Instant;
use tracing::{error, info};

use crate::{
    error::{AppError, AppResult},
    platforms::github::api_models::GitHubAPIRepoTree,
    utils::{
        data::{parse_body, parse_header, parse_header_num},
        rate_limit::{check_rate_limit, update_rate_limit},
    },
};

use super::api_models::GitHubAPIRepo;

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
        let max = parse_header_num(headers, "X-RateLimit-Limit").unwrap_or(0);
        let remaining = parse_header_num(headers, "X-RateLimit-Remaining").unwrap_or(0);
        let used = parse_header_num(headers, "X-RateLimit-Used").unwrap_or(0);
        let reset_at = parse_header_num(headers, "X-RateLimit-Reset").unwrap_or(0);
        let resource = parse_header(headers, "X-RateLimit-Resource").unwrap();
        update_rate_limit("github", max, remaining, used, reset_at, resource, pool).await?;
        Ok(())
    }

    async fn check_rate_limit(&self, resource: &str, pool: &SqlitePool) -> AppResult<()> {
        check_rate_limit("github", resource, pool).await
    }

    /// Fetch a GitHub repository.
    pub async fn fetch_repo(
        &self,
        user: &str,
        repo: &str,
        pool: &SqlitePool,
    ) -> AppResult<GitHubAPIRepo> {
        self.check_rate_limit("core", pool).await?;
        let start = Instant::now();

        let res = self
            .client
            .get(format!("{}/repos/{user}/{repo}", self.base_url))
            .header("Accept", "application/vnd.github+json")
            .header("User-Agent", "Git Chest")
            .send()
            .await
            .map_err(|e| {
                error!("{:?}", e);
                "Error fetching repository from GitHub API"
            })?;

        if let Err(error) = res.error_for_status_ref() {
            tracing::error!("{:?}", res.text().await?);
            return AppError::new(&error.to_string());
        }

        self.update_rate_limit(res.headers(), pool).await?;

        let body = res.text().await?;
        let json_body: GitHubAPIRepo =
            parse_body(&body, "Error parsing repository from GitHub API")?;

        info!("fetching github repo took {:?}", start.elapsed());

        Ok(json_body)
    }

    pub async fn fetch_repo_tree(
        &self,
        user: &str,
        repo: &str,
        branch: &str,
        pool: &SqlitePool,
    ) -> AppResult<GitHubAPIRepoTree> {
        self.check_rate_limit("core", pool).await?;
        let start = Instant::now();

        let res = self
            .client
            .get(format!(
                "{}/repos/{user}/{repo}/git/trees/{branch}?recursive=true",
                self.base_url,
            ))
            .header("Accept", "application/vnd.github+json")
            .header("User-Agent", "Git Chest")
            .send()
            .await
            .map_err(|e| {
                error!("{:?}", e);
                "Error fetching repository tree from GitHub API"
            })?;

        self.update_rate_limit(res.headers(), pool).await?;

        let data = res.json::<GitHubAPIRepoTree>().await.map_err(|e| {
            error!("{:?}", e);
            "Error parsing repository tree from GitHub API"
        })?;

        info!("fetching github repo tree took {:?}", start.elapsed());

        Ok(data)
    }

    pub async fn fetch_repo_readme(
        &self,
        user: &str,
        repo: &str,
        branch: &str,
        filename: &str,
    ) -> AppResult<String> {
        let start = Instant::now();

        let res = self
            .client
            .get(format!(
                "{}/{user}/{repo}/{branch}/{filename}",
                self.base_content_url,
            ))
            .header("Host", "raw.githubusercontent.com")
            .header("Accept", "*/*")
            .header("User-Agent", "Git Chest")
            .send()
            .await
            .map_err(|e| {
                error!("{:?}", e);
                "Error fetching repository README from GitHub API"
            })?;

        let data = res.text().await.map_err(|e| {
            error!("{:?}", e);
            "Error parsing repository README from GitHub API"
        })?;

        info!("fetching github repo readme took {:?}", start.elapsed());

        Ok(data)
    }
}

use std::collections::HashMap;

use regex::Regex;
use serde::Serialize;
use sqlx::{prelude::FromRow, SqlitePool};
use tauri::AppHandle;
use tokio::{fs, io::AsyncWriteExt};
use tracing::error;

use crate::{
    commands::repo::AddRepoProgress,
    error::AppResult,
    platforms::github::models::GitHubRepoData,
    utils::{
        data::progress_percentage,
        dirs::{ensure_dir, get_data_dir},
        image::download_image,
    },
};

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
#[serde(tag = "type", content = "data")]
#[allow(clippy::large_enum_variant)]
pub enum PlatformRepoData {
    Bitbucket,
    GitHub(GitHubRepoData),
    GitLab,
    Gitea,
}

#[derive(Serialize, FromRow)]
pub struct RepoTreeItem {
    id: i64,
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

pub async fn download_readme_assets(
    text: &str,
    repo_id: i64,
    platform: &str,
    user: &str,
    repo: &str,
    pool: &SqlitePool,
    app: &AppHandle,
) -> AppResult<String> {
    let mut new_text = text.to_string();
    let images = parse_images(text);

    let total_steps = (images.len() + 2) as u64;
    let initial_progress = progress_percentage(2, total_steps as usize);
    AddRepoProgress::Readme.send(platform, user, repo, initial_progress, 2, total_steps, app);

    let dir = get_data_dir().join(&format!("assets/repos/{user}/{repo}/readme"));
    ensure_dir(&dir).await?;

    for (i, image) in images.into_iter().enumerate() {
        let (bytes, ext) = download_image(&image.url).await?;
        let ext_str = ext
            .as_ref()
            .map(|e| format!(".{e}"))
            .unwrap_or("".to_string());

        let query =
            "INSERT INTO repo_readme_asset (repo_id, type, ext, url, alt) VALUES (?, ?, ?, ?, ?)";
        let id = sqlx::query(query)
            .bind(repo_id)
            .bind("image")
            .bind(&ext)
            .bind(&image.alt)
            .bind(&image.url)
            .execute(pool)
            .await
            .map_err(|e| {
                error!("{:?}", e);
                "Error inserting README asset into database"
            })?
            .last_insert_rowid();

        let path = dir.join(&format!("{}{}", id, ext_str));
        let path_str = path.to_str().unwrap();
        let mut file = fs::File::create(&path).await.map_err(|e| {
            error!("{:?}", e);
            "Error creating local README asset file"
        })?;
        file.write_all(&bytes).await?;

        match image.kind {
            ReadmeImageKind::Markdown => {
                let alt = image.alt.unwrap_or("".to_string());
                new_text = new_text.replace(
                    &format!("[{}]({})", alt, image.url),
                    &format!("[{}]({})", alt, path_str),
                );
            }
            ReadmeImageKind::MarkdownVar(var) => {
                let old = format!("[{}]: {}", var, image.url);
                let new = format!("[{}]: {}", var, path_str);
                new_text = new_text.replace(&old, &new);
            }
            ReadmeImageKind::Html => {
                new_text = new_text.replace(
                    &format!("src=\"{}\"", image.url),
                    &format!("src=\"{}\"", path_str),
                );
            }
        }

        let progress = progress_percentage(i + 2, total_steps as usize);
        AddRepoProgress::Readme.send(
            platform,
            user,
            repo,
            progress,
            (i + 3) as u64,
            total_steps,
            app,
        );
    }

    AddRepoProgress::Readme.send(platform, user, repo, 100, total_steps, total_steps, app);

    Ok(new_text)
}

enum ReadmeImageKind {
    Markdown,
    MarkdownVar(String),
    Html,
}

struct ParsedReadmeImage {
    url: String,
    alt: Option<String>,
    kind: ReadmeImageKind,
}

fn parse_images(text: &str) -> Vec<ParsedReadmeImage> {
    let mut images = Vec::new();

    let markdown_re = Regex::new(r"!\[(?P<alt>[^\]]*)\]\((?P<src>[^)]+)\)").unwrap();
    for cap in markdown_re.captures_iter(text) {
        let alt = &cap["alt"];
        let optional_alt = if alt.is_empty() {
            None
        } else {
            Some(alt.to_string())
        };
        let src = &cap["src"];

        if !src.starts_with("https://") {
            // The following two for loops account for images with variable links.
            continue;
        }

        images.push(ParsedReadmeImage {
            url: src.to_string(),
            alt: optional_alt,
            kind: ReadmeImageKind::Markdown,
        });
    }

    let image_re = Regex::new(r"\[!\[(.*?)\]\[(.*?)\]\]").unwrap();
    let link_re = Regex::new(r"\[(.*?)\]:\s*(\S+)").unwrap();
    let mut image_vars: HashMap<String, Option<String>> = HashMap::new();
    for cap in image_re.captures_iter(text) {
        let alt = cap[1].to_string();
        let optional_alt = if alt.is_empty() {
            None
        } else {
            Some(alt.to_string())
        };
        let url = cap[2].to_string();
        image_vars.insert(url, optional_alt);
    }
    for cap in link_re.captures_iter(text) {
        let var = &cap[1];
        let src = &cap[2];

        if let Some(alt) = image_vars.get(var) {
            images.push(ParsedReadmeImage {
                url: src.to_string(),
                alt: alt.to_owned(),
                kind: ReadmeImageKind::MarkdownVar(var.to_string()),
            })
        }
    }

    let html_re =
        Regex::new(r#"<img\s+[^>]*src="(?P<src>[^"]+)"[^>]*\balt="(?P<alt>[^"]*)""#).unwrap();
    for cap in html_re.captures_iter(text) {
        let alt = &cap["alt"];
        let optional_alt = if alt.is_empty() {
            None
        } else {
            Some(alt.to_string())
        };
        let src = &cap["src"];
        images.push(ParsedReadmeImage {
            url: src.to_string(),
            alt: optional_alt,
            kind: ReadmeImageKind::Html,
        });
    }

    images
}

use std::collections::HashMap;

use crate::utils::dirs::ensure_dir;
use api::GitHubAPI;
use api_models::{GitHubApiRepoLicense, GitHubApiRepoOrg, GitHubApiRepoOwner, GitHubApiRepoTree};
use chrono::Utc;
use models::{
    GitHubRepo, GitHubRepoCustomProperty, GitHubRepoData, GitHubRepoLicense, GitHubRepoOrg,
    GitHubRepoOwner, GitHubUser, GitHubUserData,
};
use sqlx::{prelude::FromRow, SqlitePool};
use tauri::AppHandle;
use tokio::{fs, io::AsyncWriteExt, time::Instant};
use tracing::{error, info};

use crate::{
    commands::repo::{AddRepoProgress, DbPlatformRepo, RepoPreviewOwner},
    error::AppResult,
    repo::download_readme_assets,
    utils::{data::progress_percentage, dirs::get_data_dir, image::download_image},
};

pub mod api;
pub mod api_models;
pub mod models;

async fn add_github_repo_owner(
    github_repo_id: i64,
    owner: GitHubApiRepoOwner,
    pool: &SqlitePool,
) -> AppResult<()> {
    let org_query = "
        INSERT OR REPLACE INTO github_repo_owner (
            github_repo_id, login, id, node_id, gravatar_id, type, site_admin
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ";
    sqlx::query(org_query)
        .bind(github_repo_id)
        .bind(owner.login)
        .bind(owner.id)
        .bind(owner.node_id)
        .bind(owner.gravatar_id)
        .bind(owner.r#type)
        .bind(owner.site_admin)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error adding GitHub repository owner to database"
        })?;

    Ok(())
}

async fn add_github_repo_org(
    github_repo_id: i64,
    org: Option<GitHubApiRepoOrg>,
    pool: &SqlitePool,
) -> AppResult<()> {
    if let Some(org) = org {
        let org_query = "
            INSERT OR REPLACE INTO github_repo_org (
                github_repo_id, login, id, node_id, gravatar_id, type, site_admin
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ";
        sqlx::query(org_query)
            .bind(github_repo_id)
            .bind(org.login)
            .bind(org.id)
            .bind(org.node_id)
            .bind(org.gravatar_id)
            .bind(org.r#type)
            .bind(org.site_admin)
            .execute(pool)
            .await
            .map_err(|e| {
                error!("{:?}", e);
                "Error adding GitHub repository organization to database"
            })?;
    }

    Ok(())
}

async fn add_github_repo_license(
    github_repo_id: i64,
    license: GitHubApiRepoLicense,
    pool: &SqlitePool,
) -> AppResult<()> {
    let license_query = "
        INSERT OR REPLACE INTO github_repo_license (
            github_repo_id, key, name, spdx_id, node_id
        )
        VALUES (?, ?, ?, ?, ?)
    ";
    sqlx::query(license_query)
        .bind(github_repo_id)
        .bind(license.key)
        .bind(license.name)
        .bind(license.spdx_id)
        .bind(license.node_id)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error adding GitHub repository license to database"
        })?;

    Ok(())
}

async fn add_github_repo_topics(
    github_repo_id: i64,
    topics: Vec<String>,
    pool: &SqlitePool,
) -> AppResult<()> {
    for topic in topics {
        let topic_query = "
            INSERT INTO github_repo_topic (
                github_repo_id, topic
            )
            VALUES (?, ?)
        ";
        sqlx::query(topic_query)
            .bind(github_repo_id)
            .bind(topic)
            .execute(pool)
            .await
            .map_err(|e| {
                error!("{:?}", e);
                "Error adding GitHub repository topic to database"
            })?;
    }

    Ok(())
}

async fn add_github_repo_custom_properties(
    github_repo_id: i64,
    custom_properties: Option<HashMap<String, String>>,
    pool: &SqlitePool,
) -> AppResult<()> {
    if let Some(custom_properties) = custom_properties {
        for custom_property in custom_properties {
            let custom_property_query = "
            INSERT INTO github_repo_custom_property (
                github_repo_id, key, value
            )
            VALUES (?, ?, ?)
        ";
            sqlx::query(custom_property_query)
                .bind(github_repo_id)
                .bind(custom_property.0)
                .bind(custom_property.1)
                .execute(pool)
                .await
                .map_err(|e| {
                    error!("{:?}", e);
                    "Error adding GitHub repository custom property to database"
                })?;
        }
    }

    Ok(())
}

async fn add_github_repo_tree(
    repo_id: i64,
    user: &str,
    repo: &str,
    tree: GitHubApiRepoTree,
    pool: &SqlitePool,
    app: &AppHandle,
) -> AppResult<()> {
    let query = "
        INSERT INTO repo_tree (
            repo_id, sha, truncated
        )
        VALUES (?, ?, ?)
    ";
    sqlx::query(query)
        .bind(repo_id)
        .bind(tree.sha)
        .bind(tree.truncated)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error adding GitHub repository tree to database"
        })?;

    let mut tree_ids: HashMap<&str, i64> = HashMap::new();
    let total_tree_items = tree.tree.len();

    for (i, item) in tree.tree.iter().enumerate() {
        let mut parent_id: Option<i64> = None;
        let path_parts: Vec<&str> = item.path.split("/").collect();
        // If a parent is found in the path.
        if path_parts.len() >= 2 {
            let parent_name = &path_parts[path_parts.len() - 2];
            parent_id = Some(*tree_ids.get(*parent_name).unwrap());
        }

        let item_query = "
            INSERT INTO repo_tree_item (
                repo_id, parent_id, path, mode, type, sha, size
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ";

        let item_id = sqlx::query(item_query)
            .bind(repo_id)
            .bind(parent_id)
            .bind(&item.path)
            .bind(&item.mode)
            .bind(&item.r#type)
            .bind(&item.sha)
            .bind(item.size)
            .execute(pool)
            .await
            .map_err(|e| {
                error!("{:?}", e);
                "Error adding GitHub repository tree item to database"
            })?
            .last_insert_rowid();

        if item.r#type == "tree" {
            let item_name = path_parts.last().unwrap();
            tree_ids.insert(*item_name, item_id);
        }

        let progress = progress_percentage(i, total_tree_items);
        AddRepoProgress::InsertTree.send(
            "github",
            user,
            repo,
            progress,
            (i + 1) as u64,
            total_tree_items as u64,
            app,
        );
    }

    Ok(())
}

async fn check_github_user_exists(user: &str, pool: &SqlitePool) -> AppResult<bool> {
    let exists_query = "SELECT id FROM github_user WHERE login = ?";
    let exists = sqlx::query(exists_query)
        .bind(user)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error checking if user exists in database"
        })?;
    Ok(exists.is_some())
}

async fn add_github_repo_owner_user(
    user: &str,
    repo: &str,
    api: &GitHubAPI,
    pool: &SqlitePool,
    app: &AppHandle,
) -> AppResult<()> {
    AddRepoProgress::Owner.send("github", user, repo, 0, 0, 5, app);

    let user_exists = check_github_user_exists(user, pool).await?;
    if user_exists {
        AddRepoProgress::Owner.send("github", user, repo, 100, 1, 1, app);
        return Ok(());
    }

    let github_user = api.fetch_user(user, pool).await?;
    AddRepoProgress::Owner.send("github", user, repo, 20, 1, 5, app);

    let user_query =
        "INSERT INTO user (platform, user, created_at, updated_at) VALUES (?, ?, ?, ?)";
    let user_id = sqlx::query(user_query)
        .bind("github")
        .bind(user)
        .bind(Utc::now().to_rfc3339())
        .bind(Utc::now().to_rfc3339())
        .execute(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error adding repository data into database"
        })?
        .last_insert_rowid();

    AddRepoProgress::Owner.send("github", user, repo, 40, 2, 5, app);

    let query = "
        INSERT INTO github_user (
            user_id, login, id, node_id, gravatar_id,
            type, site_admin, company, blog, location,
            hireable, bio, twitter_username, public_repos, public_gists,
            followers, following, created_at, updated_at
        )
        VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?
        )
    ";
    sqlx::query(query)
        .bind(user_id)
        .bind(github_user.login)
        .bind(github_user.id)
        .bind(github_user.node_id)
        .bind(github_user.gravatar_id)
        .bind(github_user.r#type)
        .bind(github_user.site_admin)
        .bind(github_user.company)
        .bind(github_user.blog)
        .bind(github_user.location)
        .bind(github_user.hireable)
        .bind(github_user.bio)
        .bind(github_user.twitter_username)
        .bind(github_user.public_repos)
        .bind(github_user.public_gists)
        .bind(github_user.followers)
        .bind(github_user.following)
        .bind(github_user.created_at)
        .bind(github_user.updated_at)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error adding GitHub user from database"
        })?
        .last_insert_rowid();

    AddRepoProgress::Owner.send("github", user, repo, 60, 3, 5, app);

    let (bytes, ext) = download_image(&github_user.avatar_url).await?;
    let avatar_query = "INSERT INTO user_avatar (user_id, platform, ext, url) VALUES (?, ?, ?, ?)";
    let avatar_id = sqlx::query(avatar_query)
        .bind(user_id)
        .bind("github")
        .bind(ext)
        .bind(&github_user.avatar_url)
        .execute(pool)
        .await?
        .last_insert_rowid();

    AddRepoProgress::Owner.send("github", user, repo, 80, 4, 5, app);

    let dir = get_data_dir().join("assets/avatars");
    ensure_dir(&dir).await?;
    let path = dir.join(avatar_id.to_string());
    let mut file = fs::File::create(&path).await.map_err(|e| {
        error!("{:?}", e);
        "Error creating avatar image file"
    })?;
    file.write_all(&bytes).await?;

    AddRepoProgress::Owner.send("github", user, repo, 100, 5, 5, app);

    Ok(())
}

pub async fn add_github_repo(
    repo_id: i64,
    user: &str,
    repo: &str,
    api: &GitHubAPI,
    pool: &SqlitePool,
    app: &AppHandle,
) -> AppResult<()> {
    AddRepoProgress::Metadata.send("github", user, repo, 0, 0, 2, app);
    let github_repo = api.fetch_repo(user, repo, pool).await?;
    AddRepoProgress::Metadata.send("github", user, repo, 50, 1, 2, app);

    let query = "
        INSERT INTO github_repo (
            repo_id, id, node_id, name, full_name, private,
            description, fork, created_at, updated_at, 
            pushed_at, homepage, size, stargazers_count, watchers_count,
            language, has_issues, has_projects, has_downloads, has_wiki,
            has_pages, has_discussions, forks_count, archived, disabled,
            open_issues_count, allow_forking, is_template, web_commit_signoff_required, visibility,
            forks, open_issues, watchers, default_branch, network_count,
            subscribers_count
        )
        VALUES (
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?
        )
    ";
    let github_repo_id = sqlx::query(query)
        .bind(repo_id)
        .bind(github_repo.id)
        .bind(github_repo.node_id)
        .bind(github_repo.name)
        .bind(github_repo.full_name)
        .bind(github_repo.private)
        .bind(github_repo.description)
        .bind(github_repo.fork)
        .bind(github_repo.created_at)
        .bind(github_repo.updated_at)
        .bind(github_repo.pushed_at)
        .bind(github_repo.homepage)
        .bind(github_repo.size)
        .bind(github_repo.stargazers_count)
        .bind(github_repo.watchers_count)
        .bind(github_repo.language)
        .bind(github_repo.has_issues)
        .bind(github_repo.has_projects)
        .bind(github_repo.has_downloads)
        .bind(github_repo.has_wiki)
        .bind(github_repo.has_pages)
        .bind(github_repo.has_discussions)
        .bind(github_repo.forks_count)
        .bind(github_repo.archived)
        .bind(github_repo.disabled)
        .bind(github_repo.open_issues_count)
        .bind(github_repo.allow_forking)
        .bind(github_repo.is_template)
        .bind(github_repo.web_commit_signoff_required)
        .bind(github_repo.visibility)
        .bind(github_repo.forks)
        .bind(github_repo.open_issues_count)
        .bind(github_repo.watchers)
        .bind(&github_repo.default_branch)
        .bind(github_repo.network_count)
        .bind(github_repo.subscribers_count)
        .execute(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error adding GitHub repository from database"
        })?
        .last_insert_rowid();

    add_github_repo_owner(github_repo_id, github_repo.owner, pool).await?;
    add_github_repo_org(github_repo_id, github_repo.org, pool).await?;
    add_github_repo_license(github_repo_id, github_repo.license, pool).await?;
    add_github_repo_topics(github_repo_id, github_repo.topics, pool).await?;
    add_github_repo_custom_properties(github_repo_id, github_repo.custom_properties, pool).await?;
    AddRepoProgress::Metadata.send("github", user, repo, 100, 2, 2, app);

    AddRepoProgress::FetchTree.send("github", user, repo, 0, 0, 1, app);
    let github_repo_tree = api
        .fetch_repo_tree(user, repo, &github_repo.default_branch, pool)
        .await?;
    AddRepoProgress::FetchTree.send("github", user, repo, 100, 1, 1, app);

    add_github_repo_tree(repo_id, user, repo, github_repo_tree, pool, app).await?;

    AddRepoProgress::Readme.send("github", user, repo, 0, 0, 1, app);
    let filename = sqlx::query_scalar::<_, String>(
        "SELECT path
        FROM repo_tree_item
        WHERE parent_id IS NULL
        AND (LOWER(path) LIKE '%readme%' OR LOWER(path) LIKE '%readme.md%')",
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| {
        error!("{:?}", e);
        "Error looking for optional repository tree item from database"
    })?;

    if let Some(filename) = filename {
        let readme_content = api
            .fetch_repo_readme(user, repo, &github_repo.default_branch, &filename)
            .await?;

        let parsed_readme_content =
            download_readme_assets(&readme_content, repo_id, "github", user, repo, pool, app)
                .await?;

        let readme_query = "INSERT INTO repo_readme (repo_id, content) VALUES (?, ?)";
        sqlx::query(readme_query)
            .bind(repo_id)
            .bind(parsed_readme_content)
            .execute(pool)
            .await
            .map_err(|e| {
                error!("{:?}", e);
                "Error adding repository README to database"
            })?;
    } else {
        AddRepoProgress::Readme.send("github", user, repo, 100, 2, 2, app);
    }

    add_github_repo_owner_user(user, repo, api, pool, app).await?;

    Ok(())
}

#[derive(FromRow)]
struct GitHubRepoPreview {
    id: i64,
    description: String,
    stargazers_count: i32,
    forks: i32,
    open_issues: i32,
    visibility: String,
}

#[derive(FromRow)]
pub struct DbRepoPreviewOwner {
    id: i64,
    login: String,
}

pub async fn get_github_repo_preview(
    repo_id: i64,
    pool: &SqlitePool,
) -> AppResult<(DbPlatformRepo, RepoPreviewOwner)> {
    let start = Instant::now();

    let query = "SELECT id, description, stargazers_count, forks, open_issues, visibility FROM github_repo WHERE repo_id = ?";
    let github_repo = sqlx::query_as::<_, GitHubRepoPreview>(query)
        .bind(repo_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting GitHub repository from database"
        })?;

    let owner_query = "SELECT id, login FROM github_repo_owner WHERE github_repo_id = ?";
    let owner = sqlx::query_as::<_, DbRepoPreviewOwner>(owner_query)
        .bind(github_repo.id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting GitHub repository owner from database"
        })?;

    let user_id_query = "SELECT user_id FROM github_user WHERE id = ?";
    let user_id = sqlx::query_scalar::<_, i64>(user_id_query)
        .bind(owner.id)
        .fetch_one(pool)
        .await?;

    let avatar_id_query = "SELECT id FROM user_avatar WHERE user_id = ?";
    let avatar_id = sqlx::query_scalar::<_, i64>(avatar_id_query)
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting user avatar id from database"
        })?;

    let dir = get_data_dir().join("assets/avatars");
    let path = dir.join(avatar_id.to_string());
    let avatar = path.to_str().unwrap().to_string();

    info!(
        "got github repo preview from database in {:?}",
        start.elapsed()
    );

    Ok((
        DbPlatformRepo {
            description: github_repo.description,
            stars: github_repo.stargazers_count,
            forks: github_repo.forks,
            issues: github_repo.open_issues,
            pull_requests: 0,
            visibility: github_repo.visibility,
        },
        RepoPreviewOwner {
            id: user_id,
            user: owner.login,
            avatar,
        },
    ))
}

pub async fn get_github_repo(repo_id: i64, pool: &SqlitePool) -> AppResult<GitHubRepoData> {
    let query = "SELECT * FROM github_repo WHERE repo_id = ?";
    let github_repo = sqlx::query_as::<_, GitHubRepo>(query)
        .bind(repo_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting github repository from database"
        })?;

    let owner_query = "SELECT * FROM github_repo_owner WHERE github_repo_id = ?";
    let owner = sqlx::query_as::<_, GitHubRepoOwner>(owner_query)
        .bind(github_repo.id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting github owner from database"
        })?;

    let org_query = "SELECT * FROM github_repo_org WHERE github_repo_id = ?";
    let org = sqlx::query_as::<_, GitHubRepoOrg>(org_query)
        .bind(github_repo.id)
        .fetch_optional(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting github organization from database"
        })?;

    let topics_query = "SELECT topic FROM github_repo_topic WHERE github_repo_id = ?";
    let topics = sqlx::query_scalar::<_, String>(topics_query)
        .bind(github_repo.id)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting github topics from database"
        })?;

    let license_query = "SELECT * FROM github_repo_license WHERE github_repo_id = ?";
    let license = sqlx::query_as::<_, GitHubRepoLicense>(license_query)
        .bind(github_repo.id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting github license from database"
        })?;

    let custom_properties_query =
        "SELECT * FROM github_repo_custom_property WHERE github_repo_id = ?";
    let custom_properties = sqlx::query_as::<_, GitHubRepoCustomProperty>(custom_properties_query)
        .bind(github_repo.id)
        .fetch_all(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting github custom properties from database"
        })?;

    Ok(GitHubRepoData {
        repo: github_repo,
        owner,
        org,
        topics,
        license,
        custom_properties,
    })
}

pub async fn get_github_user(user_id: i64, pool: &SqlitePool) -> AppResult<GitHubUserData> {
    let query = "SELECT * FROM github_user WHERE user_id = ?";
    let github_user = sqlx::query_as::<_, GitHubUser>(query)
        .bind(user_id)
        .fetch_one(pool)
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting github user from database"
        })?;

    Ok(GitHubUserData { user: github_user })
}

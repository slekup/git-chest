use std::collections::HashMap;

use api::GitHubAPI;
use api_models::{GitHubAPIRepoLicense, GitHubAPIRepoOrg, GitHubAPIRepoOwner, GitHubAPIRepoTree};
use models::{
    GitHubRepo, GitHubRepoCustomProperty, GitHubRepoData, GitHubRepoLicense, GitHubRepoOrg,
    GitHubRepoOwner,
};
use sqlx::SqlitePool;
use tauri::AppHandle;
use tracing::error;

use crate::{commands::repo::AddRepoProgress, error::AppResult, utils::data::progress_percentage};

pub mod api;
pub mod api_models;
pub mod models;

async fn add_github_repo_owner(
    github_repo_id: i64,
    owner: GitHubAPIRepoOwner,
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
    org: Option<GitHubAPIRepoOrg>,
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
    license: GitHubAPIRepoLicense,
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
    tree: GitHubAPIRepoTree,
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

        if !["tree".to_string(), "blob".to_string()].contains(&item.r#type) {
            error!("{:?}", &item.r#type);
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
        AddRepoProgress::InsertTree.send(progress, (i + 1) as u64, total_tree_items as u64, app);
    }

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
    AddRepoProgress::FetchMetadata.send(0, 0, 1, app);
    let github_repo = api.fetch_repo(user, repo, pool).await?;
    AddRepoProgress::FetchMetadata.send(100, 1, 1, app);

    AddRepoProgress::InsertMetadata.send(0, 0, 1, app);
    let query = "
        INSERT INTO github_repo (
            repo_id, id, node_id, name, full_name, private, description, fork, created_at,
            updated_at, pushed_at, homepage, size, stargazers_count, watchers_count, language,
            has_issues, has_projects, has_downloads, has_wiki, has_pages, has_discussions,
            forks_count, archived, disabled, open_issues_count, allow_forking, is_template,
            web_commit_signoff_required, visibility, forks, open_issues, watchers,
            default_branch, network_count, subscribers_count
        )
        VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?
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
    AddRepoProgress::InsertMetadata.send(17, 1, 6, app);
    add_github_repo_owner(github_repo_id, github_repo.owner, pool).await?;
    AddRepoProgress::InsertMetadata.send(34, 3, 6, app);
    add_github_repo_org(github_repo_id, github_repo.org, pool).await?;
    add_github_repo_license(github_repo_id, github_repo.license, pool).await?;
    AddRepoProgress::InsertMetadata.send(51, 3, 6, app);
    AddRepoProgress::InsertMetadata.send(68, 4, 6, app);
    add_github_repo_topics(github_repo_id, github_repo.topics, pool).await?;
    AddRepoProgress::InsertMetadata.send(85, 5, 6, app);
    add_github_repo_custom_properties(github_repo_id, github_repo.custom_properties, pool).await?;
    AddRepoProgress::InsertMetadata.send(100, 6, 6, app);

    AddRepoProgress::FetchTree.send(0, 0, 1, app);
    let github_repo_tree = api
        .fetch_repo_tree(user, repo, &github_repo.default_branch, pool)
        .await?;
    AddRepoProgress::FetchTree.send(100, 1, 1, app);

    add_github_repo_tree(repo_id, github_repo_tree, pool, app).await?;

    AddRepoProgress::FetchReadme.send(0, 0, 1, app);
    AddRepoProgress::InsertReadme.send(100, 0, 1, app);
    let filename = sqlx::query_scalar::<_, String>(
        "SELECT path
         FROM repo_tree_item
         WHERE path LIKE '%README%' OR path LIKE '%README.md%'",
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
        AddRepoProgress::FetchReadme.send(100, 1, 1, app);

        AddRepoProgress::InsertReadme.send(100, 0, 1, app);
        let readme_query = "INSERT INTO repo_readme (repo_id, content) VALUES (?, ?)";
        sqlx::query(readme_query)
            .bind(repo_id)
            .bind(readme_content)
            .execute(pool)
            .await
            .map_err(|e| {
                error!("{:?}", e);
                "Error adding repository README to database"
            })?;
        AddRepoProgress::InsertReadme.send(100, 1, 1, app);
    } else {
        AddRepoProgress::FetchReadme.send(100, 1, 1, app);
        AddRepoProgress::InsertReadme.send(100, 1, 1, app);
    }

    Ok(())
}

pub async fn get_github_repo(repo_id: i64, pool: &SqlitePool) -> AppResult<GitHubRepoData> {
    let query = "SELECT * FROM github_repo WHERE repo = ?";
    let github_repo = sqlx::query_as::<_, GitHubRepo>(query)
        .bind(repo_id)
        .fetch_one(pool)
        .await?;

    let owner_query = "SELECT * FROM github_repo_owner WHERE github_repo_id = ?";
    let owner = sqlx::query_as::<_, GitHubRepoOwner>(owner_query)
        .bind(github_repo.id)
        .fetch_one(pool)
        .await?;

    let org_query = "SELECT * FROM github_repo_org WHERE github_repo_id = ?";
    let org = sqlx::query_as::<_, GitHubRepoOrg>(org_query)
        .bind(github_repo.id)
        .fetch_optional(pool)
        .await?;

    let topics_query = "SELECT topic FROM github_repo_topic WHERE github_repo_id = ?";
    let topics = sqlx::query_scalar::<_, String>(topics_query)
        .bind(github_repo.id)
        .fetch_all(pool)
        .await?;

    let license_query = "SELECT * FROM github_repo_license WHERE github_repo_id = ?";
    let license = sqlx::query_as::<_, GitHubRepoLicense>(license_query)
        .bind(github_repo.id)
        .fetch_one(pool)
        .await?;

    let custom_properties_query =
        "SELECT * FROM github_repo_custom_property WHERE github_repo_id = ?";
    let custom_properties = sqlx::query_as::<_, GitHubRepoCustomProperty>(custom_properties_query)
        .bind(github_repo.id)
        .fetch_all(pool)
        .await?;

    Ok(GitHubRepoData {
        repo: github_repo,
        owner,
        org,
        topics,
        license,
        custom_properties,
    })
}

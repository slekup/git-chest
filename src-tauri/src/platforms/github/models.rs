use std::collections::HashMap;

use serde::Serialize;
use sqlx::prelude::FromRow;

/// Excluding `repo_id`.
#[derive(Serialize, FromRow)]
pub struct GitHubRepo {
    id: i32,
    node_id: String,
    name: String,
    full_name: String,
    private: bool,
    description: String,
    fork: bool,
    created_at: String,
    updated_at: String,
    pushed_at: String,
    homepage: Option<String>,
    size: i32,
    stargazers_count: i32,
    watchers_count: i32,
    language: String,
    has_issues: bool,
    has_projects: bool,
    has_downloads: bool,
    has_wiki: bool,
    has_pages: bool,
    has_discussions: bool,
    forks_count: i32,
    archived: bool,
    disabled: bool,
    open_issues_count: i32,
    allow_forking: bool,
    is_template: bool,
    web_commit_signoff_required: bool,
    visibility: String,
    forks: i32,
    open_issues: i32,
    watchers: i32,
    default_branch: String,
    network_count: i32,
    subscribers_count: i32,
}

/// Excluding `github_repo_id`.
#[derive(Serialize, FromRow)]
pub struct GitHubRepoOwner {
    login: String,
    id: i32,
    node_id: String,
    gravatar_id: String,
    r#type: String,
    site_admin: bool,
}

/// Excluding `github_repo_id`.
#[derive(Serialize, FromRow)]
pub struct GitHubRepoOrg {
    login: String,
    id: i32,
    node_id: String,
    gravatar_id: String,
    r#type: String,
    site_admin: bool,
}

/// Excluding `github_repo_id`.
#[derive(Serialize, FromRow)]
pub struct GitHubRepoTopic {
    topic: String,
}

/// Excluding `github_repo_id`.
#[derive(Serialize, FromRow)]
pub struct GitHubRepoLicense {
    key: String,
    name: String,
    spdx_id: String,
    node_id: String,
}

/// Excluding `github_repo_id`.
#[derive(Serialize, FromRow)]
pub struct GitHubRepoCustomProperty {
    key: String,
    value: String,
}

#[derive(Serialize)]
pub struct GitHubRepoData {
    repo: GitHubRepo,
    owner: GitHubRepoOwner,
    org: Option<GitHubRepoOrg>,
    topics: Vec<String>,
    license: GitHubRepoLicense,
    custom_properties: HashMap<String, String>,
}

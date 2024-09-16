use serde::Serialize;
use sqlx::prelude::FromRow;

/// Excluding `repo_id`.
#[derive(Serialize, FromRow)]
pub struct GitHubRepo {
    pub id: i32,
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
    pub repo: GitHubRepo,
    pub owner: GitHubRepoOwner,
    pub org: Option<GitHubRepoOrg>,
    pub topics: Vec<String>,
    pub license: GitHubRepoLicense,
    pub custom_properties: Vec<GitHubRepoCustomProperty>,
}

#[derive(Serialize, FromRow)]
pub struct GitHubUser {
    pub login: String,
    pub id: i32,
    pub node_id: String,
    pub gravatar_id: String,
    /// 'User' or 'Organization'
    pub r#type: String,
    pub site_admin: bool,
    pub name: Option<String>,
    pub company: Option<String>,
    pub blog: String,
    pub location: Option<String>,
    pub hireable: bool,
    pub bio: Option<String>,
    pub twitter_username: Option<String>,
    pub public_repos: i32,
    pub public_gists: i32,
    pub followers: i32,
    pub following: i32,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Serialize)]
pub struct GitHubUserData {
    pub user: GitHubUser,
}

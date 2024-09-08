use std::collections::HashMap;

use serde::Deserialize;

#[derive(Deserialize)]
pub struct GitHubAPIRepoOwner {
    pub login: String,
    pub id: i32,
    pub node_id: String,
    pub gravatar_id: String,
    pub r#type: String,
    pub site_admin: bool,
}

#[derive(Deserialize)]
pub struct GitHubAPIRepoLicense {
    pub key: String,
    pub name: String,
    pub spdx_id: String,
    pub node_id: String,
}

#[derive(Deserialize)]
pub struct GitHubAPIRepoOrganization {
    pub login: String,
    pub id: i32,
    pub node_id: String,
    pub gravatar_id: String,
    pub r#type: String,
    pub site_admin: bool,
}

/// URL-related properties are not included.
#[derive(Deserialize)]
pub struct GitHubAPIRepo {
    pub id: i32,
    pub node_id: String,
    pub name: String,
    pub full_name: String,
    pub private: bool,
    pub owner: GitHubAPIRepoOwner,
    pub description: String,
    pub fork: bool,
    pub created_at: String,
    pub updated_at: String,
    pub pushed_at: String,
    pub homepage: Option<String>,
    pub size: i32,
    pub stargazers_count: i32,
    pub watchers_count: i32,
    pub language: String,
    pub has_issues: bool,
    pub has_projects: bool,
    pub has_downloads: bool,
    pub has_wiki: bool,
    pub has_pages: bool,
    pub has_discussions: bool,
    pub forks_count: i32,
    pub archived: bool,
    pub disabled: bool,
    pub open_issues_count: i32,
    pub license: GitHubAPIRepoLicense,
    pub allow_forking: bool,
    pub is_template: bool,
    pub web_commit_signoff_required: bool,
    pub topics: Vec<String>,
    pub visibility: String,
    pub forks: i32,
    pub open_issues: i32,
    pub watchers: i32,
    pub default_branch: String,
    pub custom_properties: HashMap<String, String>,
    pub organization: Option<GitHubAPIRepoOrganization>,
    pub network_count: i32,
    pub subscribers_count: i32,
}

#[derive(Deserialize)]
pub struct GitHubAPIRepoTreeItem {
    pub path: String,
    pub mode: String,
    /// 'blob' (file) or 'tree' (directory).
    pub sha: String,
    pub r#type: String,
    pub size: Option<i32>,
}

#[derive(Deserialize)]
pub struct GitHubAPIRepoTree {
    pub sha: String,
    pub tree: Vec<GitHubAPIRepoTreeItem>,
    pub truncated: bool,
}

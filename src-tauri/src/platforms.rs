use std::str::FromStr;

use serde::Serialize;

use crate::error::AppError;

pub mod github;

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

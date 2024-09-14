use tracing::error;

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Anyhow: {0}")]
    Anyhow(#[from] anyhow::Error),

    #[error("IO: {0}")]
    Io(#[from] std::io::Error),

    #[error("SQLX: {0}")]
    Sqlx(#[from] sqlx::Error),

    #[error("Serde: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("Reqwest: {0}")]
    Reqwest(#[from] reqwest::Error),

    #[error("App: {0}")]
    Custom(String),
}

impl AppError {
    pub fn new<T>(message: &str) -> AppResult<T> {
        Err(AppError::Custom(message.to_string()))
    }
}

impl From<&str> for AppError {
    fn from(value: &str) -> Self {
        AppError::Custom(value.to_string())
    }
}

impl serde::Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type AppResult<T> = Result<T, AppError>;

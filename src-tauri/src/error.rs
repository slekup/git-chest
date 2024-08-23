#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Anyhow Error: {0}")]
    Anyhow(#[from] anyhow::Error),

    #[error("IO Error: {0}")]
    Io(#[from] std::io::Error),

    #[error("SQLX Error: {0}")]
    Sqlx(#[from] sqlx::Error),

    #[error("Serde Error: {0}")]
    Serde(#[from] serde_json::Error),

    #[error("Error: {0}")]
    Custom(String),
}

impl AppError {
    pub fn new<T>(message: &str) -> AppResult<T> {
        Err(AppError::Custom(message.to_string()))
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

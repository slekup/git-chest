use std::path::PathBuf;

use tokio::fs::{self};
use uuid::Uuid;

use crate::error::{AppError, AppResult};

use super::dirs::get_data_dir;

const VALID_IMAGE_EXTENSIONS: [&str; 4] = ["png", "jpg", "jpeg", "gif"];

pub enum AssetDir {
    Avatar,
    Block,
    Course,
    Module,
    Other,
}

impl AssetDir {
    fn as_str(&self) -> &str {
        match self {
            AssetDir::Avatar => "avatar",
            AssetDir::Block => "block",
            AssetDir::Course => "course",
            AssetDir::Module => "module",
            AssetDir::Other => "other",
        }
    }
}

pub struct AppImage {
    pub id: String,
    pub ext: String,
    pub subdir: AssetDir,
    pub src_path: Option<PathBuf>,
    pub data: Option<Vec<u8>>,
}

impl AppImage {
    /// Check if an image file extension is valid.
    pub fn valid_ext(ext: &str) -> bool {
        VALID_IMAGE_EXTENSIONS.contains(&ext)
    }

    fn filename(&self) -> String {
        format!("{}.{}", self.id, self.ext)
    }

    pub fn get_path(&self) -> PathBuf {
        get_data_dir()
            .join("assets")
            .join(self.subdir.as_str())
            .join(self.filename())
    }

    pub fn get_path_str(&self) -> String {
        self.get_path().to_string_lossy().to_string()
    }

    pub fn use_avatar_dir(mut self) -> Self {
        self.subdir = AssetDir::Avatar;
        self
    }

    pub fn use_block_dir(mut self) -> Self {
        self.subdir = AssetDir::Block;
        self
    }

    pub fn use_course_dir(mut self) -> Self {
        self.subdir = AssetDir::Course;
        self
    }

    pub fn use_module_dir(mut self) -> Self {
        self.subdir = AssetDir::Module;
        self
    }

    pub async fn copy(self) -> AppResult<Self> {
        if let Some(src_path) = &self.src_path {
            fs::copy(src_path, self.get_path()).await?;
            Ok(self)
        } else {
            AppError::new("No src_path provided")
        }
    }

    pub async fn save(self) -> AppResult<Self> {
        if let Some(data) = &self.data {
            fs::write(self.get_path(), data).await?;
            Ok(self)
        } else {
            AppError::new("No image data provided")
        }
    }
}

impl TryFrom<PathBuf> for AppImage {
    type Error = AppError;
    fn try_from(value: PathBuf) -> Result<Self, Self::Error> {
        let ext = value.extension().unwrap().to_string_lossy().to_string();
        if !Self::valid_ext(&ext) {
            let ext_str = VALID_IMAGE_EXTENSIONS.join(", ");
            return AppError::new(&format!("Invalid image type, must be one of: {}.", ext_str));
        }

        let id = Uuid::new_v4().to_string();

        Ok(Self {
            id,
            ext,
            subdir: AssetDir::Other,
            src_path: Some(value.to_owned()),
            data: None,
        })
    }
}

/// Try from [`std::String`] that represents a file path.
impl TryFrom<String> for AppImage {
    type Error = AppError;
    fn try_from(value: String) -> Result<Self, Self::Error> {
        let src_path = PathBuf::from(value);
        Self::try_from(src_path)
    }
}

/// Try from [`std::str`] that represents a file path.
impl TryFrom<&str> for AppImage {
    type Error = AppError;
    fn try_from(value: &str) -> Result<Self, Self::Error> {
        let src_path = PathBuf::from(value);
        Self::try_from(src_path)
    }
}

impl TryFrom<(Vec<u8>, &String)> for AppImage {
    type Error = AppError;
    fn try_from(value: (Vec<u8>, &String)) -> Result<Self, Self::Error> {
        let ext = value.1;
        if !Self::valid_ext(ext) {
            let ext_str = VALID_IMAGE_EXTENSIONS.join(", ");
            return AppError::new(&format!("Invalid image type, must be one of: {}.", ext_str));
        }

        let id = Uuid::new_v4().to_string();

        Ok(Self {
            id,
            ext: ext.to_string(),
            subdir: AssetDir::Other,
            src_path: None,
            data: Some(value.0.to_owned()),
        })
    }
}

impl TryFrom<(Vec<u8>, Option<String>)> for AppImage {
    type Error = AppError;
    fn try_from(value: (Vec<u8>, Option<String>)) -> Result<Self, Self::Error> {
        if let Some(ext) = value.1 {
            Self::try_from((value.0, &ext))
        } else {
            AppError::new("Image extension not provided")
        }
    }
}

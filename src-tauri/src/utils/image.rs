use tracing::error;

use crate::error::{AppError, AppResult};

fn ext_from_content_type(content_type: &str) -> Option<String> {
    let mut ext = None;
    let parts = content_type.split(';');

    for part in parts {
        if !part.starts_with("image/") {
            continue;
        }

        ext = match part {
            "image/png" => Some("png"),
            "image/jpeg" => Some("jpg"),
            "image/gif" => Some("gif"),
            "image/bmp" => Some("bmp"),
            "image/svg+xml" => Some("svg"),
            "image/webp" => Some("webp"),
            "image/tiff" => Some("tiff"),
            "image/x-icon" => Some("ico"),
            _ => None,
        }
        .map(|v| v.to_string());

        if ext.is_some() {
            break;
        }
    }

    ext
}

pub async fn download_image(url: &str) -> AppResult<(Vec<u8>, Option<String>)> {
    let res = reqwest::get(url).await.map_err(|e| {
        error!("{:?}", e);
        format!("Error downloading image: {}", url)
    })?;

    if let Err(error) = res.error_for_status_ref() {
        error!("{:?}", res.text().await?);
        return AppError::new(&error.to_string());
    }

    let file_ext = res
        .headers()
        .get("Content-Type")
        .and_then(|val| val.to_str().ok())
        .and_then(ext_from_content_type);

    let bytes = res
        .bytes()
        .await
        .map_err(|e| {
            error!("{:?}", e);
            "Error getting bytes from response"
        })?
        .to_vec();

    Ok((bytes, file_ext))
}

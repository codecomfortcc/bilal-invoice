use serde::Serialize;
use std::fmt;

#[derive(Debug, Serialize)]
pub enum AppError {
    Database(String),
    Io(String),

}

impl fmt::Display for AppError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AppError::Database(msg) => write!(f, "Database Error: {}", msg),
            AppError::Io(msg) => write!(f, "IO Error: {}", msg),
        }
    }
}

impl std::error::Error for AppError {}

impl From<rusqlite::Error> for AppError {
    fn from(err: rusqlite::Error) -> Self {
        AppError::Database(err.to_string())
    }
}

impl From<std::io::Error> for AppError {
    fn from(err: std::io::Error) -> Self {
        AppError::Io(err.to_string())
    }
}

pub type Result<T> = std::result::Result<T, AppError>;

use rusqlite::Connection;
use crate::repositories::preference_repository;
use crate::errors::Result;

pub fn get_preference(conn: &Connection, key: &str) -> Result<Option<String>> {
    preference_repository::get_preference(conn, key)
}

pub fn set_preference(conn: &Connection, key: &str, value: &str) -> Result<()> {
    preference_repository::set_preference(conn, key, value)
}

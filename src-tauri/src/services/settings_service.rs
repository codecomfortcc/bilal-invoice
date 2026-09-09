use rusqlite::Connection;
use crate::domain::models::Company;
use crate::repositories::settings_repository;
use crate::errors::Result;

pub fn get_company_settings(conn: &Connection, id: &str) -> Result<Option<Company>> {
    settings_repository::get_company_settings(conn, id)
}

pub fn save_company_settings(conn: &Connection, company: &Company) -> Result<()> {
    settings_repository::save_company_settings(conn, company)
}

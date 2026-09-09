use rusqlite::Connection;
use crate::domain::models::Invoice;
use crate::repositories::invoice_repository;
use crate::errors::Result;

pub fn get_invoice(conn: &Connection, id: &str) -> Result<Option<Invoice>> {
    invoice_repository::get_invoice(conn, id)
}

pub fn list_invoices(conn: &Connection) -> Result<Vec<Invoice>> {
    invoice_repository::list_invoices(conn)
}

pub fn save_invoice(conn: &Connection, invoice: &mut Invoice) -> Result<()> {
    // ENFORCE DOMAIN BUSINESS RULES
    invoice.recalculate_totals();

    invoice_repository::save_invoice(conn, invoice)
}

pub fn delete_invoice(conn: &Connection, id: &str) -> Result<()> {
    invoice_repository::delete_invoice(conn, id)
}

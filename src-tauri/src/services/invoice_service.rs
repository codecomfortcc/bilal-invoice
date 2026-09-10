use rusqlite::Connection;
use crate::domain::models::Invoice;
use crate::repositories::{ invoice_repository, settings_repository };
use crate::errors::Result;
use chrono::Local;

pub fn get_invoice(conn: &Connection, id: &str) -> Result<Option<Invoice>> {
    invoice_repository::get_invoice(conn, id)
}

pub fn list_invoices(conn: &Connection) -> Result<Vec<Invoice>> {
    invoice_repository::list_invoices(conn)
}

/// Helper: read an invoice field value by its lockableKey name.
fn get_invoice_field_value(invoice: &Invoice, key: &str) -> Option<String> {
    match key {
        // Seller / Company
        "companyName" | "sellerName" => invoice.seller_name.clone(),
        "addressLine1" => invoice.seller_address_line_1.clone(),
        "addressLine2" => invoice.seller_address_line_2.clone(),
        "city" => invoice.seller_city.clone(),
        "pincode" => invoice.seller_pincode.clone(),
        "sellerState" => invoice.seller_state.clone(),
        "sellerStateCode" => invoice.seller_state_code.clone(),
        "sellerGst" => invoice.seller_gst.clone(),
        "email" => invoice.seller_email.clone(),
        "sellerPhone" => invoice.seller_phone.clone(),
        "sellerLogo" => invoice.seller_logo.clone(),
        // Consignee
        "consigneeName" => invoice.consignee_name.clone(),
        "consigneeAddressLine1" => invoice.consignee_address_line_1.clone(),
        "consigneeAddressLine2" => invoice.consignee_address_line_2.clone(),
        "consigneeCity" => invoice.consignee_city.clone(),
        "consigneePincode" => invoice.consignee_pincode.clone(),
        "consigneeGst" => invoice.consignee_gst.clone(),
        "consigneeState" => invoice.consignee_state.clone(),
        "consigneeStateCode" => invoice.consignee_state_code.clone(),
        // Buyer
        "buyerName" => invoice.buyer_name.clone(),
        "buyerAddressLine1" => invoice.buyer_address_line_1.clone(),
        "buyerAddressLine2" => invoice.buyer_address_line_2.clone(),
        "buyerCity" => invoice.buyer_city.clone(),
        "buyerPincode" => invoice.buyer_pincode.clone(),
        "buyerGst" => invoice.buyer_gst.clone(),
        "buyerState" => invoice.buyer_state.clone(),
        "buyerStateCode" => invoice.buyer_state_code.clone(),
        // Right-side grid
        "invoiceNumber" => Some(invoice.invoice_number.clone()),
        "date" => Some(invoice.date.clone()),
        "deliveryNote" => invoice.delivery_note.clone(),
        "modeOfPayment" => invoice.mode_of_payment.clone(),
        "referenceNo" => invoice.reference_no.clone(),
        "otherReferences" => invoice.other_references.clone(),
        "buyersOrderNo" => invoice.buyers_order_no.clone(),
        "buyersOrderDate" => invoice.buyers_order_date.clone(),
        "dispatchDocNo" => invoice.dispatch_doc_no.clone(),
        "deliveryNoteDate" => invoice.delivery_note_date.clone(),
        "dispatchedThrough" => invoice.dispatched_through.clone(),
        "destination" => invoice.destination.clone(),
        "termsOfDelivery" => invoice.terms_of_delivery.clone(),
        // Bank
        "bankName" => invoice.bank_name.clone(),
        "accountName" => invoice.bank_account_name.clone(),
        "accountNumber" => invoice.bank_account_number.clone(),
        "ifscCode" => invoice.bank_ifsc_code.clone(),
        // Signature
        "digitalSignatureName" => invoice.digital_signature_name.clone(),
        _ => None,
    }
}

/// Helper: set an invoice field value by its lockableKey name.
fn set_invoice_field_value(invoice: &mut Invoice, key: &str, value: &str) {
    let val = if value.is_empty() { None } else { Some(value.to_string()) };
    match key {
        "companyName" | "sellerName" => {
            invoice.seller_name = val;
        }
        "addressLine1" => {
            invoice.seller_address_line_1 = val;
        }
        "addressLine2" => {
            invoice.seller_address_line_2 = val;
        }
        "city" => {
            invoice.seller_city = val;
        }
        "pincode" => {
            invoice.seller_pincode = val;
        }
        "sellerState" => {
            invoice.seller_state = val;
        }
        "sellerStateCode" => {
            invoice.seller_state_code = val;
        }
        "sellerGst" => {
            invoice.seller_gst = val;
        }
        "email" => {
            invoice.seller_email = val;
        }
        "sellerPhone" => {
            invoice.seller_phone = val;
        }
        "sellerLogo" => {
            invoice.seller_logo = val;
        }
        "consigneeName" => {
            invoice.consignee_name = val;
        }
        "consigneeAddressLine1" => {
            invoice.consignee_address_line_1 = val;
        }
        "consigneeAddressLine2" => {
            invoice.consignee_address_line_2 = val;
        }
        "consigneeCity" => {
            invoice.consignee_city = val;
        }
        "consigneePincode" => {
            invoice.consignee_pincode = val;
        }
        "consigneeGst" => {
            invoice.consignee_gst = val;
        }
        "consigneeState" => {
            invoice.consignee_state = val;
        }
        "consigneeStateCode" => {
            invoice.consignee_state_code = val;
        }
        "buyerName" => {
            invoice.buyer_name = val;
        }
        "buyerAddressLine1" => {
            invoice.buyer_address_line_1 = val;
        }
        "buyerAddressLine2" => {
            invoice.buyer_address_line_2 = val;
        }
        "buyerCity" => {
            invoice.buyer_city = val;
        }
        "buyerPincode" => {
            invoice.buyer_pincode = val;
        }
        "buyerGst" => {
            invoice.buyer_gst = val;
        }
        "buyerState" => {
            invoice.buyer_state = val;
        }
        "buyerStateCode" => {
            invoice.buyer_state_code = val;
        }
        "invoiceNumber" => {
            invoice.invoice_number = value.to_string();
        }
        "date" => {
            invoice.date = value.to_string();
        }
        "deliveryNote" => {
            invoice.delivery_note = val;
        }
        "modeOfPayment" => {
            invoice.mode_of_payment = val;
        }
        "referenceNo" => {
            invoice.reference_no = val;
        }
        "otherReferences" => {
            invoice.other_references = val;
        }
        "buyersOrderNo" => {
            invoice.buyers_order_no = val;
        }
        "buyersOrderDate" => {
            invoice.buyers_order_date = val;
        }
        "dispatchDocNo" => {
            invoice.dispatch_doc_no = val;
        }
        "deliveryNoteDate" => {
            invoice.delivery_note_date = val;
        }
        "dispatchedThrough" => {
            invoice.dispatched_through = val;
        }
        "destination" => {
            invoice.destination = val;
        }
        "termsOfDelivery" => {
            invoice.terms_of_delivery = val;
        }
        "bankName" => {
            invoice.bank_name = val;
        }
        "accountName" => {
            invoice.bank_account_name = val;
        }
        "accountNumber" => {
            invoice.bank_account_number = val;
        }
        "ifscCode" => {
            invoice.bank_ifsc_code = val;
        }
        "digitalSignatureName" => {
            invoice.digital_signature_name = val;
        }
        _ => {}
    }
}

pub fn save_invoice(conn: &Connection, invoice: &mut Invoice) -> Result<()> {
    // ENFORCE DOMAIN BUSINESS RULES
    invoice.recalculate_totals();

    invoice_repository::save_invoice(conn, invoice)?;

    // Sync locked field values into the lockedFields JSON so they are self-contained
    if
        let Ok(Some(mut company)) = settings_repository::get_company_settings(
            conn,
            "default_company"
        )
    {
        if let Some(locked_str) = &company.locked_fields {
            if let Ok(mut locked_fields) = serde_json::from_str::<serde_json::Value>(locked_str) {
                if let Some(obj) = locked_fields.as_object_mut() {
                    let mut updated = false;
                    for (key, entry) in obj.iter_mut() {
                        let is_locked = entry
                            .get("isLocked")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(false);
                        if is_locked {
                            // Read the current value from the invoice and store it in the JSON
                            let current_value = get_invoice_field_value(
                                invoice,
                                key
                            ).unwrap_or_default();
                            if let Some(entry_obj) = entry.as_object_mut() {
                                entry_obj.insert(
                                    "value".to_string(),
                                    serde_json::Value::String(current_value)
                                );
                                updated = true;
                            }
                        }
                    }
                    if updated {
                        company.locked_fields = Some(
                            serde_json::to_string(&locked_fields).unwrap_or_default()
                        );
                        let _ = settings_repository::save_company_settings(conn, &company);
                    }
                }
            }
        }
    }

    Ok(())
}

pub fn delete_invoice(conn: &Connection, id: &str) -> Result<()> {
    invoice_repository::delete_invoice(conn, id)
}

pub fn initialize_invoice(conn: &Connection, template: Option<Invoice>) -> Result<Invoice> {
    let now = Local::now().format("%Y-%m-%d").to_string();

    let mut invoice = match template {
        Some(mut t) => {
            t.id = format!("inv_{}", Local::now().timestamp_millis());
            t.date = now;
            t.status = Some("draft".to_string());
            t
        }
        None =>
            Invoice {
                id: format!("inv_{}", Local::now().timestamp_millis()),
                invoice_number: "INV-001".to_string(),
                date: now,
                customer_id: None,
                items: vec![],
                remarks: None,
                total: 0.0,
                amount_in_words: String::new(),

                export_file_name: None,
                export_folder: None,
                export_date: None,

                consignee_name: None,
                consignee_address_line_1: None,
                consignee_address_line_2: None,
                consignee_city: None,
                consignee_pincode: None,
                consignee_address: None,
                consignee_gst: None,
                consignee_state: None,
                consignee_state_code: None,

                buyer_name: None,
                buyer_address_line_1: None,
                buyer_address_line_2: None,
                buyer_city: None,
                buyer_pincode: None,
                buyer_address: None,
                buyer_gst: None,
                buyer_state: None,
                buyer_state_code: None,

                delivery_note: None,
                mode_of_payment: None,
                reference_no: None,
                other_references: None,
                buyers_order_no: None,
                buyers_order_date: None,
                dispatch_doc_no: None,
                delivery_note_date: None,
                dispatched_through: None,
                destination: None,
                terms_of_delivery: None,
                status: Some("draft".to_string()),

                seller_name: None,
                seller_address_line_1: None,
                seller_address_line_2: None,
                seller_city: None,
                seller_pincode: None,
                seller_state: None,
                seller_state_code: None,
                seller_gst: None,
                seller_email: None,
                seller_phone: None,
                seller_logo: None,

                bank_name: None,
                bank_account_number: None,
                bank_ifsc_code: None,
                bank_account_name: None,

                signature_image: None,
                digital_signature_name: None,
            },
    };

    // Pre-populate ONLY locked fields from the lockedFields JSON (generic approach)
    if let Ok(Some(company)) = settings_repository::get_company_settings(conn, "default_company") {
        if let Some(locked_str) = &company.locked_fields {
            if let Ok(locked_fields) = serde_json::from_str::<serde_json::Value>(locked_str) {
                if let Some(obj) = locked_fields.as_object() {
                    for (key, entry) in obj {
                        let is_locked = entry
                            .get("isLocked")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(false);
                        if is_locked {
                            // Read the stored value from the JSON entry
                            if let Some(stored_value) = entry.get("value").and_then(|v| v.as_str()) {
                                set_invoice_field_value(&mut invoice, key, stored_value);
                            }
                        }
                    }
                }
            }
        }

        // Auto-increment invoice number from company settings if not locked
        if let Some(inv_num) = &company.invoice_number {
            if !inv_num.is_empty() {
                invoice.invoice_number = inv_num.clone();
            }
        }
    }

    // Save initial draft
    save_invoice(conn, &mut invoice)?;
    Ok(invoice)
}

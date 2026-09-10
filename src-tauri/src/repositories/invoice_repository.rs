use rusqlite::{params, Connection};
use crate::domain::models::{Invoice, InvoiceItem};
use crate::errors::Result;

pub fn save_invoice(conn: &Connection, invoice: &Invoice) -> Result<()> {
    let now = chrono::Local::now().to_rfc3339();
    let items_json = serde_json::to_string(&invoice.items).unwrap_or_else(|_| "[]".to_string());

    conn.execute(
        "INSERT INTO invoices (
            id, invoiceNumber, date, customerId, items, remarks, total, amountInWords,
            consigneeName, consigneeAddressLine1, consigneeAddressLine2, consigneeCity, consigneePincode, consigneeAddress, consigneeGst, consigneeState, consigneeStateCode,
            buyerName, buyerAddressLine1, buyerAddressLine2, buyerCity, buyerPincode, buyerAddress, buyerGst, buyerState, buyerStateCode,
            deliveryNote, modeOfPayment, referenceNo, otherReferences,
            buyersOrderNo, buyersOrderDate, dispatchDocNo, deliveryNoteDate,
            dispatchedThrough, destination, termsOfDelivery,
            status, exportFileName, exportFolder, exportDate, created_at, updated_at,
            seller_name, seller_address_line_1, seller_address_line_2, seller_city, seller_pincode, seller_state, seller_state_code, seller_gst, seller_email, seller_phone, seller_logo,
            bank_name, bank_account_number, bank_ifsc_code, bank_account_name,
            signature_image, digital_signature_name
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8,
            ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17,
            ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26,
            ?27, ?28, ?29, ?30,
            ?31, ?32, ?33, ?34,
            ?35, ?36, ?37,
            ?38, ?39, ?40, ?41, ?42, ?43,
            ?44, ?45, ?46, ?47, ?48, ?49, ?50, ?51, ?52, ?53, ?54,
            ?55, ?56, ?57, ?58,
            ?59, ?60
        )
        ON CONFLICT(id) DO UPDATE SET
            invoiceNumber=excluded.invoiceNumber, date=excluded.date, customerId=excluded.customerId,
            items=excluded.items, remarks=excluded.remarks, total=excluded.total, amountInWords=excluded.amountInWords,
            consigneeName=excluded.consigneeName, consigneeAddressLine1=excluded.consigneeAddressLine1, consigneeAddressLine2=excluded.consigneeAddressLine2, consigneeCity=excluded.consigneeCity, consigneePincode=excluded.consigneePincode, consigneeAddress=excluded.consigneeAddress, consigneeGst=excluded.consigneeGst, consigneeState=excluded.consigneeState, consigneeStateCode=excluded.consigneeStateCode,
            buyerName=excluded.buyerName, buyerAddressLine1=excluded.buyerAddressLine1, buyerAddressLine2=excluded.buyerAddressLine2, buyerCity=excluded.buyerCity, buyerPincode=excluded.buyerPincode, buyerAddress=excluded.buyerAddress, buyerGst=excluded.buyerGst, buyerState=excluded.buyerState, buyerStateCode=excluded.buyerStateCode,
            deliveryNote=excluded.deliveryNote, modeOfPayment=excluded.modeOfPayment, referenceNo=excluded.referenceNo,
            otherReferences=excluded.otherReferences, buyersOrderNo=excluded.buyersOrderNo, buyersOrderDate=excluded.buyersOrderDate,
            dispatchDocNo=excluded.dispatchDocNo, deliveryNoteDate=excluded.deliveryNoteDate,
            dispatchedThrough=excluded.dispatchedThrough, destination=excluded.destination, termsOfDelivery=excluded.termsOfDelivery,
            status=excluded.status, exportFileName=excluded.exportFileName, exportFolder=excluded.exportFolder,
            exportDate=excluded.exportDate, updated_at=excluded.updated_at,
            seller_name=excluded.seller_name, seller_address_line_1=excluded.seller_address_line_1, seller_address_line_2=excluded.seller_address_line_2, seller_city=excluded.seller_city, seller_pincode=excluded.seller_pincode, seller_state=excluded.seller_state, seller_state_code=excluded.seller_state_code, seller_gst=excluded.seller_gst, seller_email=excluded.seller_email, seller_phone=excluded.seller_phone, seller_logo=excluded.seller_logo,
            bank_name=excluded.bank_name, bank_account_number=excluded.bank_account_number, bank_ifsc_code=excluded.bank_ifsc_code, bank_account_name=excluded.bank_account_name,
            signature_image=excluded.signature_image, digital_signature_name=excluded.digital_signature_name",
        params![
            invoice.id, invoice.invoice_number, invoice.date, invoice.customer_id, items_json, invoice.remarks, invoice.total, invoice.amount_in_words,
            invoice.consignee_name, invoice.consignee_address_line_1, invoice.consignee_address_line_2, invoice.consignee_city, invoice.consignee_pincode, invoice.consignee_address, invoice.consignee_gst, invoice.consignee_state, invoice.consignee_state_code,
            invoice.buyer_name, invoice.buyer_address_line_1, invoice.buyer_address_line_2, invoice.buyer_city, invoice.buyer_pincode, invoice.buyer_address, invoice.buyer_gst, invoice.buyer_state, invoice.buyer_state_code,
            invoice.delivery_note, invoice.mode_of_payment, invoice.reference_no, invoice.other_references,
            invoice.buyers_order_no, invoice.buyers_order_date, invoice.dispatch_doc_no, invoice.delivery_note_date,
            invoice.dispatched_through, invoice.destination, invoice.terms_of_delivery,
            invoice.status.clone().unwrap_or_else(|| "draft".to_string()), invoice.export_file_name, invoice.export_folder, invoice.export_date, now, now,
            invoice.seller_name, invoice.seller_address_line_1, invoice.seller_address_line_2, invoice.seller_city, invoice.seller_pincode, invoice.seller_state, invoice.seller_state_code, invoice.seller_gst, invoice.seller_email, invoice.seller_phone, invoice.seller_logo,
            invoice.bank_name, invoice.bank_account_number, invoice.bank_ifsc_code, invoice.bank_account_name,
            invoice.signature_image, invoice.digital_signature_name
        ],
    )?;

    Ok(())
}

fn row_to_invoice(row: &rusqlite::Row) -> rusqlite::Result<Invoice> {
    let items_str: String = row.get("items")?;
    let items: Vec<InvoiceItem> = serde_json::from_str(&items_str).unwrap_or_default();

    Ok(Invoice {
        id: row.get("id")?,
        invoice_number: row.get("invoiceNumber")?,
        date: row.get("date")?,
        customer_id: row.get("customerId").unwrap_or(None),
        items,
        remarks: row.get("remarks").unwrap_or(None),
        total: row.get("total")?,
        amount_in_words: row.get("amountInWords").unwrap_or_default(),
        export_file_name: row.get("exportFileName").unwrap_or(None),
        export_folder: row.get("exportFolder").unwrap_or(None),
        export_date: row.get("exportDate").unwrap_or(None),
        consignee_name: row.get("consigneeName").unwrap_or(None),
        consignee_address_line_1: row.get("consigneeAddressLine1").unwrap_or(None),
        consignee_address_line_2: row.get("consigneeAddressLine2").unwrap_or(None),
        consignee_city: row.get("consigneeCity").unwrap_or(None),
        consignee_pincode: row.get("consigneePincode").unwrap_or(None),
        consignee_address: row.get("consigneeAddress").unwrap_or(None),
        consignee_gst: row.get("consigneeGst").unwrap_or(None),
        consignee_state: row.get("consigneeState").unwrap_or(None),
        consignee_state_code: row.get("consigneeStateCode").unwrap_or(None),
        buyer_name: row.get("buyerName").unwrap_or(None),
        buyer_address_line_1: row.get("buyerAddressLine1").unwrap_or(None),
        buyer_address_line_2: row.get("buyerAddressLine2").unwrap_or(None),
        buyer_city: row.get("buyerCity").unwrap_or(None),
        buyer_pincode: row.get("buyerPincode").unwrap_or(None),
        buyer_address: row.get("buyerAddress").unwrap_or(None),
        buyer_gst: row.get("buyerGst").unwrap_or(None),
        buyer_state: row.get("buyerState").unwrap_or(None),
        buyer_state_code: row.get("buyerStateCode").unwrap_or(None),
        delivery_note: row.get("deliveryNote").unwrap_or(None),
        mode_of_payment: row.get("modeOfPayment").unwrap_or(None),
        reference_no: row.get("referenceNo").unwrap_or(None),
        other_references: row.get("otherReferences").unwrap_or(None),
        buyers_order_no: row.get("buyersOrderNo").unwrap_or(None),
        buyers_order_date: row.get("buyersOrderDate").unwrap_or(None),
        dispatch_doc_no: row.get("dispatchDocNo").unwrap_or(None),
        delivery_note_date: row.get("deliveryNoteDate").unwrap_or(None),
        dispatched_through: row.get("dispatchedThrough").unwrap_or(None),
        destination: row.get("destination").unwrap_or(None),
        terms_of_delivery: row.get("termsOfDelivery").unwrap_or(None),
        status: row.get("status").unwrap_or(None),
        
        seller_name: row.get("seller_name").unwrap_or(None),
        seller_address_line_1: row.get("seller_address_line_1").unwrap_or(None),
        seller_address_line_2: row.get("seller_address_line_2").unwrap_or(None),
        seller_city: row.get("seller_city").unwrap_or(None),
        seller_pincode: row.get("seller_pincode").unwrap_or(None),
        seller_state: row.get("seller_state").unwrap_or(None),
        seller_state_code: row.get("seller_state_code").unwrap_or(None),
        seller_gst: row.get("seller_gst").unwrap_or(None),
        seller_email: row.get("seller_email").unwrap_or(None),
        seller_phone: row.get("seller_phone").unwrap_or(None),
        seller_logo: row.get("seller_logo").unwrap_or(None),

        bank_name: row.get("bank_name").unwrap_or(None),
        bank_account_number: row.get("bank_account_number").unwrap_or(None),
        bank_ifsc_code: row.get("bank_ifsc_code").unwrap_or(None),
        bank_account_name: row.get("bank_account_name").unwrap_or(None),

        signature_image: row.get("signature_image").unwrap_or(None),
        digital_signature_name: row.get("digital_signature_name").unwrap_or(None),
    })
}

pub fn get_invoice(conn: &Connection, id: &str) -> Result<Option<Invoice>> {
    let mut stmt = conn.prepare("SELECT * FROM invoices WHERE id = ?1")?;
    let mut rows = stmt.query(params![id])?;

    if let Some(row) = rows.next()? {
        Ok(Some(row_to_invoice(row)?))
    } else {
        Ok(None)
    }
}

pub fn list_invoices(conn: &Connection) -> Result<Vec<Invoice>> {
    let mut stmt = conn.prepare("SELECT * FROM invoices ORDER BY updated_at DESC")?;
    let rows = stmt.query_map([], |row| row_to_invoice(row))?;
    
    let mut invoices = Vec::new();
    for row in rows {
        invoices.push(row?);
    }

    Ok(invoices)
}

pub fn delete_invoice(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM invoices WHERE id = ?1", params![id])?;
    Ok(())
}

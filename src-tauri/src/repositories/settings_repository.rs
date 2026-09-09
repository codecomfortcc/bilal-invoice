use rusqlite::{params, Connection};
use crate::domain::models::Company;
use crate::errors::{Result};

pub fn get_company_settings(conn: &Connection, id: &str) -> Result<Option<Company>> {
    let mut stmt = conn.prepare("SELECT * FROM companies WHERE id = ?1")?;
    let mut rows = stmt.query(params![id])?;

    if let Some(row) = rows.next()? {
        let company = Company {
            id: row.get("id")?,
            name: row.get("name")?,
            address_line_1: row.get("addressLine1").unwrap_or(None),
            address_line_2: row.get("addressLine2").unwrap_or(None),
            city: row.get("city").unwrap_or(None),
            pincode: row.get("pincode").unwrap_or(None),
            address: row.get("address").unwrap_or(None),
            gst: row.get("gst").unwrap_or(None),
            phone: row.get("phone").unwrap_or(None),
            email: row.get("email").unwrap_or(None),
            bank_details: row.get("bankDetails").unwrap_or(None),
            logo: row.get("logo").unwrap_or(None),
            signature: row.get("signature").unwrap_or(None),
            digital_signature_name: row.get("digitalSignatureName").unwrap_or(None),
            consignee_name: row.get("consigneeName").unwrap_or(None),
            consignee_address_line_1: row.get("consigneeAddressLine1").unwrap_or(None),
            consignee_address_line_2: row.get("consigneeAddressLine2").unwrap_or(None),
            consignee_city: row.get("consigneeCity").unwrap_or(None),
            consignee_pincode: row.get("consigneePincode").unwrap_or(None),
            consignee_address: row.get("consigneeAddress").unwrap_or(None),
            consignee_gst: row.get("consigneeGst").unwrap_or(None),
            consignee_state: row.get("consigneeState").unwrap_or(None),
            signature_offset_x: row.get("signatureOffsetX").unwrap_or(None),
            signature_offset_y: row.get("signatureOffsetY").unwrap_or(None),
            signature_scale: row.get("signatureScale").unwrap_or(None),
            terms_of_delivery: row.get("termsOfDelivery").unwrap_or(None),
            consignee_state_code: row.get("consigneeStateCode").unwrap_or(None),
            mode_of_payment: row.get("modeOfPayment").unwrap_or(None),
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
            reference_no: row.get("referenceNo").unwrap_or(None),
            other_references: row.get("otherReferences").unwrap_or(None),
            buyers_order_no: row.get("buyersOrderNo").unwrap_or(None),
            dispatch_doc_no: row.get("dispatchDocNo").unwrap_or(None),
            dispatched_through: row.get("dispatchedThrough").unwrap_or(None),
            destination: row.get("destination").unwrap_or(None),
            invoice_number: row.get("invoiceNumber").unwrap_or(None),
            number_format: row.get("numberFormat").unwrap_or(None),
            field_styles: row.get("fieldStyles").unwrap_or(None),
            master_font: row.get("master_font").unwrap_or(None),
            master_font_variant: row.get("master_font_variant").unwrap_or(None),
            custom_labels: row.get("custom_labels").unwrap_or(None),
            master_color: row.get("master_color").unwrap_or(None),
        };
        Ok(Some(company))
    } else {
        Ok(None)
    }
}

pub fn save_company_settings(conn: &Connection, company: &Company) -> Result<()> {
    conn.execute(
        "INSERT INTO companies (
            id, name, addressLine1, addressLine2, city, pincode, address, gst, phone, email, bankDetails, logo, signature, 
            digitalSignatureName, consigneeName, consigneeAddressLine1, consigneeAddressLine2, consigneeCity, consigneePincode, consigneeAddress, consigneeGst, consigneeState, 
            signatureOffsetX, signatureOffsetY, signatureScale, termsOfDelivery, consigneeStateCode, modeOfPayment,
            buyerName, buyerAddressLine1, buyerAddressLine2, buyerCity, buyerPincode, buyerAddress, buyerGst, buyerState, buyerStateCode,
            deliveryNote, referenceNo, otherReferences, buyersOrderNo, dispatchDocNo, dispatchedThrough, destination, invoiceNumber, numberFormat, fieldStyles, master_font, master_font_variant, custom_labels, master_color
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?21, ?22, ?23, ?24, ?25, ?26, ?27, ?28, ?29, ?30, ?31, ?32, ?33, ?34, ?35, ?36, ?37, ?38, ?39, ?40, ?41, ?42, ?43, ?44, ?45, ?46, ?47, ?48, ?49, ?50, ?51)
        ON CONFLICT(id) DO UPDATE SET
            name=excluded.name, addressLine1=excluded.addressLine1, addressLine2=excluded.addressLine2, city=excluded.city, pincode=excluded.pincode, address=excluded.address, gst=excluded.gst, phone=excluded.phone,
            email=excluded.email, bankDetails=excluded.bankDetails, logo=excluded.logo, signature=excluded.signature,
            digitalSignatureName=excluded.digitalSignatureName, consigneeName=excluded.consigneeName,
            consigneeAddressLine1=excluded.consigneeAddressLine1, consigneeAddressLine2=excluded.consigneeAddressLine2, consigneeCity=excluded.consigneeCity, consigneePincode=excluded.consigneePincode,
            consigneeAddress=excluded.consigneeAddress, consigneeGst=excluded.consigneeGst,
            consigneeState=excluded.consigneeState, signatureOffsetX=excluded.signatureOffsetX, signatureOffsetY=excluded.signatureOffsetY, signatureScale=excluded.signatureScale, termsOfDelivery=excluded.termsOfDelivery,
            consigneeStateCode=excluded.consigneeStateCode, modeOfPayment=excluded.modeOfPayment,
            buyerName=excluded.buyerName, buyerAddressLine1=excluded.buyerAddressLine1, buyerAddressLine2=excluded.buyerAddressLine2, buyerCity=excluded.buyerCity, buyerPincode=excluded.buyerPincode, buyerAddress=excluded.buyerAddress, buyerGst=excluded.buyerGst, buyerState=excluded.buyerState, buyerStateCode=excluded.buyerStateCode,
            deliveryNote=excluded.deliveryNote, referenceNo=excluded.referenceNo, otherReferences=excluded.otherReferences, buyersOrderNo=excluded.buyersOrderNo, dispatchDocNo=excluded.dispatchDocNo, dispatchedThrough=excluded.dispatchedThrough, destination=excluded.destination, invoiceNumber=excluded.invoiceNumber, numberFormat=excluded.numberFormat, fieldStyles=excluded.fieldStyles, master_font=excluded.master_font, master_font_variant=excluded.master_font_variant, custom_labels=excluded.custom_labels, master_color=excluded.master_color",
        params![
            company.id, company.name, company.address_line_1, company.address_line_2, company.city, company.pincode, company.address, company.gst, company.phone, company.email,
            company.bank_details, company.logo, company.signature,
            company.digital_signature_name, company.consignee_name, company.consignee_address_line_1, company.consignee_address_line_2, company.consignee_city, company.consignee_pincode, company.consignee_address,
            company.consignee_gst, company.consignee_state,
            company.signature_offset_x, company.signature_offset_y, company.signature_scale, company.terms_of_delivery,
            company.consignee_state_code, company.mode_of_payment,
            company.buyer_name, company.buyer_address_line_1, company.buyer_address_line_2, company.buyer_city, company.buyer_pincode, company.buyer_address, company.buyer_gst, company.buyer_state, company.buyer_state_code,
            company.delivery_note, company.reference_no, company.other_references, company.buyers_order_no, company.dispatch_doc_no, company.dispatched_through, company.destination, company.invoice_number, company.number_format, company.field_styles, company.master_font, company.master_font_variant, company.custom_labels, company.master_color
        ],
    )?;

    Ok(())
}

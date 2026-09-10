use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Company {
    pub id: String,
    pub name: String,
    pub address_line_1: Option<String>,
    pub address_line_2: Option<String>,
    pub city: Option<String>,
    pub pincode: Option<String>,
    pub address: Option<String>,
    pub gst: Option<String>,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub bank_details: Option<String>,
    pub logo: Option<String>,
    pub signature: Option<String>,
    pub digital_signature_name: Option<String>,
    pub consignee_name: Option<String>,
    pub consignee_address_line_1: Option<String>,
    pub consignee_address_line_2: Option<String>,
    pub consignee_city: Option<String>,
    pub consignee_pincode: Option<String>,
    pub consignee_address: Option<String>,
    pub consignee_gst: Option<String>,
    pub consignee_state: Option<String>,
    pub signature_offset_x: Option<f64>,
    pub signature_offset_y: Option<f64>,
    pub signature_scale: Option<f64>,
    pub terms_of_delivery: Option<String>,
    pub consignee_state_code: Option<String>,
    pub mode_of_payment: Option<String>,
    pub buyer_name: Option<String>,
    pub buyer_address_line_1: Option<String>,
    pub buyer_address_line_2: Option<String>,
    pub buyer_city: Option<String>,
    pub buyer_pincode: Option<String>,
    pub buyer_address: Option<String>,
    pub buyer_gst: Option<String>,
    pub buyer_state: Option<String>,
    pub buyer_state_code: Option<String>,
    pub delivery_note: Option<String>,
    pub reference_no: Option<String>,
    pub other_references: Option<String>,
    pub buyers_order_no: Option<String>,
    pub dispatch_doc_no: Option<String>,
    pub dispatched_through: Option<String>,
    pub destination: Option<String>,
    pub invoice_number: Option<String>,
    pub number_format: Option<String>,
    pub field_styles: Option<String>,
    pub master_font: Option<String>,
    pub master_font_variant: Option<String>,
    pub custom_labels: Option<String>,
    pub master_color: Option<String>,
    pub locked_fields: Option<String>,
    pub column_widths: Option<String>,
    pub show_bank_details: Option<bool>,
    pub show_digital_signature: Option<bool>,
    pub show_signature_image: Option<bool>,
    pub auto_save_products: Option<bool>,
    pub bill_size: Option<String>,
    pub date_format: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InventoryItem {
    pub id: String,
    pub title: String,
    pub hsn_sac: Option<String>,
    pub rate: Option<f64>,
    pub unit: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct InvoiceItem {
    pub id: String,
    pub description: String,
    pub hsn: String,
    pub quantity: f64,
    pub rate: f64,
    pub unit: String,
    pub amount: f64,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub inventory_item_id: Option<String>,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Invoice {
    pub id: String,
    pub invoice_number: String,
    pub date: String,
    pub customer_id: Option<String>,
    pub items: Vec<InvoiceItem>,
    pub remarks: Option<String>,
    pub total: f64,
    pub amount_in_words: String,
    
    // Export tracking
    pub export_file_name: Option<String>,
    pub export_folder: Option<String>,
    pub export_date: Option<String>,
    
    // Consignee
    pub consignee_name: Option<String>,
    pub consignee_address_line_1: Option<String>,
    pub consignee_address_line_2: Option<String>,
    pub consignee_city: Option<String>,
    pub consignee_pincode: Option<String>,
    pub consignee_address: Option<String>,
    pub consignee_gst: Option<String>,
    pub consignee_state: Option<String>,
    pub consignee_state_code: Option<String>,
    
    // Buyer
    pub buyer_name: Option<String>,
    pub buyer_address_line_1: Option<String>,
    pub buyer_address_line_2: Option<String>,
    pub buyer_city: Option<String>,
    pub buyer_pincode: Option<String>,
    pub buyer_address: Option<String>,
    pub buyer_gst: Option<String>,
    pub buyer_state: Option<String>,
    pub buyer_state_code: Option<String>,
    
    // Right-side grid details
    pub delivery_note: Option<String>,
    pub mode_of_payment: Option<String>,
    pub reference_no: Option<String>,
    pub other_references: Option<String>,
    pub buyers_order_no: Option<String>,
    pub buyers_order_date: Option<String>,
    pub dispatch_doc_no: Option<String>,
    pub delivery_note_date: Option<String>,
    pub dispatched_through: Option<String>,
    pub destination: Option<String>,
    pub terms_of_delivery: Option<String>,
    pub status: Option<String>,
    
    // My Details (Seller)
    pub seller_name: Option<String>,
    pub seller_address_line_1: Option<String>,
    pub seller_address_line_2: Option<String>,
    pub seller_city: Option<String>,
    pub seller_pincode: Option<String>,
    pub seller_state: Option<String>,
    pub seller_state_code: Option<String>,
    pub seller_gst: Option<String>,
    pub seller_email: Option<String>,
    pub seller_phone: Option<String>,
    pub seller_logo: Option<String>,

    // Payee Details (Bank)
    pub bank_name: Option<String>,
    pub bank_account_number: Option<String>,
    pub bank_ifsc_code: Option<String>,
    pub bank_account_name: Option<String>,

    // Signature
    pub signature_image: Option<String>,
    pub digital_signature_name: Option<String>,
}

impl InvoiceItem {
    pub fn calculate_amount(&mut self) {
        self.amount = self.quantity * self.rate;
    }
}

impl Invoice {
    pub fn recalculate_totals(&mut self) {
        let mut total = 0.0;
        for item in &mut self.items {
            item.calculate_amount();
            total += item.amount;
        }
        self.total = total;
        self.amount_in_words = crate::domain::utils::number_to_words_indian(total);
    }
}

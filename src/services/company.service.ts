import { Company } from "@/types";
import { getDb } from "@/database/db";

export async function getCompanySettings(id: string = "default_company"): Promise<Company | null> {
  const db = await getDb();
  const result = await db.select<Company[]>("SELECT * FROM companies WHERE id = $1", [id]);
  return result.length > 0 ? result[0] : null;
}

export async function saveCompanySettings(company: Company): Promise<void> {
  const db = await getDb();
  await db.execute(
    `INSERT INTO companies (id, name, address, gst, phone, email, bankDetails, logo, signature, digitalSignatureName, consigneeName, consigneeAddress, consigneeGst, consigneeState, signatureOffsetX, signatureOffsetY)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     ON CONFLICT(id) DO UPDATE SET
     name=excluded.name, address=excluded.address, gst=excluded.gst, phone=excluded.phone,
     email=excluded.email, bankDetails=excluded.bankDetails, logo=excluded.logo, signature=excluded.signature,
     digitalSignatureName=excluded.digitalSignatureName, consigneeName=excluded.consigneeName,
     consigneeAddress=excluded.consigneeAddress, consigneeGst=excluded.consigneeGst,
     consigneeState=excluded.consigneeState, signatureOffsetX=excluded.signatureOffsetX, signatureOffsetY=excluded.signatureOffsetY`,
    [
      company.id, company.name, company.address, company.gst, company.phone, company.email, 
      company.bankDetails, company.logo, company.signature, 
      company.digitalSignatureName, company.consigneeName, company.consigneeAddress, 
      company.consigneeGst, company.consigneeState, 
      company.signatureOffsetX, company.signatureOffsetY
    ]
  );
}

export function parseBankDetails(bankDetailsJson: string): {
  accountName: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
} {
  try {
    return JSON.parse(bankDetailsJson);
  } catch {
    return { accountName: "", bankName: "", accountNumber: "", ifscCode: "" };
  }
}

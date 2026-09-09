import { Company } from "@/types";
import { invoke } from "@tauri-apps/api/core";

export async function getCompanySettings(id: string = "default_company"): Promise<Company | null> {
  try {
    const company = await invoke<Company | null>("get_company_settings", { id });
    return company;
  } catch (error) {
    console.error("Failed to get company settings:", error);
    return null;
  }
}

export async function saveCompanySettings(company: Company): Promise<void> {
  await invoke("save_company_settings", { company });
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

import { save, open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useInvoiceStore, useCompanyStore } from '@/stores';
import { toast } from 'sonner';
import { getPreference, setPreference } from '@/services/system.service';

export interface ImportHistoryRecord {
  id: string;
  fileName: string;
  importedAt: string;
  invoiceNumber?: string;
  clientName?: string;
  totalAmount?: number;
  data: any;
}

export interface ExportFieldOptions {
  invoiceDetails: boolean;
  lineItems: boolean;
  senderCompany: boolean;
  clientDetails: boolean;
  signatures: boolean;
  customStyling: boolean;
  paymentBankDetails: boolean;
}

/**
 * Persist import history to Tauri SQLite preferences
 */
export const getImportHistory = async (): Promise<ImportHistoryRecord[]> => {
  try {
    const raw = await getPreference('import_history_records');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to get import history:', e);
  }
  return [];
};

export const saveImportHistoryRecord = async (
  record: Omit<ImportHistoryRecord, 'id' | 'importedAt'>
): Promise<ImportHistoryRecord[]> => {
  try {
    const history = await getImportHistory();
    const newRecord: ImportHistoryRecord = {
      ...record,
      id: `imp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      importedAt: new Date().toISOString(),
    };
    // Deduplicate matching invoiceNumber & fileName, keep top 25
    const filtered = history.filter(
      (h) => h.fileName !== record.fileName || h.invoiceNumber !== record.invoiceNumber
    );
    const updated = [newRecord, ...filtered].slice(0, 25);
    await setPreference('import_history_records', JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Failed to save import history:', e);
    return [];
  }
};

export const deleteImportHistoryRecord = async (id: string): Promise<ImportHistoryRecord[]> => {
  try {
    const history = await getImportHistory();
    const updated = history.filter((item) => item.id !== id);
    await setPreference('import_history_records', JSON.stringify(updated));
    return updated;
  } catch (e) {
    return [];
  }
};

export const clearImportHistory = async (): Promise<void> => {
  try {
    await setPreference('import_history_records', '[]');
  } catch (e) {}
};

/**
 * Apply parsed JSON object into state and record in backend history
 */
export const applyImportedData = async (
  jsonData: any,
  fileName: string = 'imported_invoice.json'
): Promise<boolean> => {
  try {
    const invoicePayload = jsonData.invoiceData || jsonData;
    const companyPayload = jsonData.company || null;

    if (!invoicePayload || (typeof invoicePayload !== 'object')) {
      throw new Error('Invalid JSON structure');
    }

    // Basic structural check
    if (!invoicePayload.invoiceNumber && !invoicePayload.items && !invoicePayload.client && !invoicePayload.billTo) {
      throw new Error('JSON format is missing invoice fields');
    }

    // Ensure ID exists
    const finalInvoice = {
      ...invoicePayload,
      id: invoicePayload.id || `inv_${Date.now()}`
    };

    useInvoiceStore.getState().setInvoiceData(finalInvoice as any);

    if (companyPayload) {
      useCompanyStore.getState().setCompany(companyPayload);
      try {
        const { saveCompanySettings } = await import('@/services/settings.service');
        await saveCompanySettings(companyPayload);
      } catch (e) {}
    }

    const clientName =
      finalInvoice.client?.name ||
      finalInvoice.billTo?.name ||
      finalInvoice.clientName ||
      'General Client';

    await saveImportHistoryRecord({
      fileName,
      invoiceNumber: finalInvoice.invoiceNumber || 'INV-DRAFT',
      clientName,
      totalAmount: finalInvoice.total || finalInvoice.subtotal || 0,
      data: jsonData,
    });

    toast.success(`Imported invoice ${finalInvoice.invoiceNumber || ''} successfully`);
    return true;
  } catch (e: any) {
    console.error('Import failure:', e);
    toast.error(e.message || 'Failed to import JSON data. Invalid format.');
    return false;
  }
};

/**
 * Direct silent export (all fields)
 */
export const exportProjectData = async () => {
  try {
    const invoiceId = useInvoiceStore.getState().invoiceData.id;

    const filePath = await save({
      filters: [{
        name: 'Bilal Invoice Template',
        extensions: ['bjson', 'json']
      }],
      defaultPath: `invoice_template_${Date.now()}.bjson`
    });

    if (filePath) {
      await invoke('export_invoice_to_file', { invoiceId, filePath });
      toast.success('Project exported successfully');
    }
  } catch (error) {
    console.error('Failed to export:', error);
    toast.error('Failed to export project');
  }
};

/**
 * Filtered export based on modal toggle selection
 */
export const exportFilteredProjectData = async (options: ExportFieldOptions): Promise<boolean> => {
  try {
    const fullInvoice = useInvoiceStore.getState().invoiceData;
    const fullCompany = useCompanyStore.getState().company;

    const filteredInvoice: any = JSON.parse(JSON.stringify(fullInvoice));

    if (!options.invoiceDetails) {
      delete filteredInvoice.invoiceNumber;
      delete filteredInvoice.date;
      delete filteredInvoice.dueDate;
      delete filteredInvoice.status;
      delete filteredInvoice.notes;
      delete filteredInvoice.terms;
    }

    if (!options.lineItems) {
      filteredInvoice.items = [];
      filteredInvoice.subtotal = 0;
      filteredInvoice.taxRate = 0;
      filteredInvoice.taxAmount = 0;
      filteredInvoice.discount = 0;
      filteredInvoice.shipping = 0;
      filteredInvoice.total = 0;
    }

    if (!options.clientDetails) {
      delete filteredInvoice.client;
      delete filteredInvoice.billTo;
    }

    let filteredCompany: any = fullCompany ? JSON.parse(JSON.stringify(fullCompany)) : null;

    if (filteredCompany) {
      if (!options.senderCompany) {
        delete filteredCompany.name;
        delete filteredCompany.email;
        delete filteredCompany.phone;
        delete filteredCompany.address;
        delete filteredCompany.logoUrl;
      }

      if (!options.signatures) {
        delete filteredCompany.signatureUrl;
        delete filteredCompany.stampUrl;
        delete filteredCompany.signatoryName;
        delete filteredCompany.signatoryDesignation;
      }

      if (!options.customStyling) {
        delete filteredCompany.masterFont;
        delete filteredCompany.masterFontVariant;
        delete filteredCompany.masterColor;
        delete filteredCompany.templateId;
      }

      if (!options.paymentBankDetails) {
        delete filteredCompany.bankName;
        delete filteredCompany.accountNumber;
        delete filteredCompany.iban;
        delete filteredCompany.swift;
        delete filteredCompany.paymentInstructions;
      }
    }

    const exportPayload = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      invoiceData: filteredInvoice,
      company: filteredCompany,
      exportedFields: options,
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);

    const filePath = await save({
      filters: [{
        name: 'Bilal Invoice Template',
        extensions: ['bjson', 'json']
      }],
      defaultPath: `invoice_export_${filteredInvoice.invoiceNumber || Date.now()}.bjson`
    });

    if (filePath) {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      await writeTextFile(filePath, jsonStr);
      toast.success('Exported selected invoice fields successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to export:', error);
    toast.error('Failed to export project');
    return false;
  }
};

/**
 * Direct silent import
 */
export const importProjectData = async () => {
  try {
    const selected = await open({
      multiple: false,
      filters: [{
        name: 'Bilal Invoice Template',
        extensions: ['bjson', 'json']
      }]
    });

    if (selected && typeof selected === 'string') {
      const importedInvoice = await invoke('import_invoice_from_file', { filePath: selected });
      
      useInvoiceStore.getState().setInvoiceData(importedInvoice as any);
      
      const { getCompanySettings } = await import('@/services/settings.service');
      const updatedCompany = await getCompanySettings();
      if (updatedCompany) {
        useCompanyStore.getState().setCompany(updatedCompany);
      }

      // Track in history
      const fileName = selected.split(/[/\\]/).pop() || 'imported_file.bjson';
      await saveImportHistoryRecord({
        fileName,
        invoiceNumber: (importedInvoice as any).invoiceNumber || 'INV-DRAFT',
        clientName: (importedInvoice as any).client?.name || (importedInvoice as any).billTo?.name || 'Client',
        totalAmount: (importedInvoice as any).total || 0,
        data: { invoiceData: importedInvoice, company: updatedCompany },
      });

      toast.success('Project imported successfully');
    }
  } catch (error) {
    console.error('Failed to import:', error);
    toast.error('Failed to import project. Invalid file format.');
  }
};

/**
 * Save project to .binv file
 */
export const saveBinvProject = async () => {
  try {
    const fullInvoice = useInvoiceStore.getState().invoiceData;
    const fullCompany = useCompanyStore.getState().company;

    const exportPayload = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      invoiceData: fullInvoice,
      company: fullCompany,
    };

    const jsonStr = JSON.stringify(exportPayload, null, 2);

    const filePath = await save({
      filters: [{
        name: 'Bilal Invoice File',
        extensions: ['binv']
      }],
      defaultPath: `invoice_${fullInvoice.invoiceNumber || Date.now()}.binv`
    });

    if (filePath) {
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      await writeTextFile(filePath, jsonStr);
      toast.success('Project saved successfully');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to save project:', error);
    toast.error('Failed to save project');
    return false;
  }
};

/**
 * Direct open for .binv
 */
export const openBinvProject = async (filePath?: string) => {
  try {
    let selected = filePath;
    if (!selected) {
      selected = await open({
        multiple: false,
        filters: [{
          name: 'Bilal Invoice File',
          extensions: ['binv']
        }]
      }) as string;
    }

    if (selected && typeof selected === 'string') {
      const { readTextFile } = await import('@tauri-apps/plugin-fs');
      const jsonStr = await readTextFile(selected);
      const importedData = JSON.parse(jsonStr);
      
      const importedInvoice = importedData.invoiceData || importedData;
      const importedCompany = importedData.company || null;
      
      useInvoiceStore.getState().setInvoiceData(importedInvoice as any);
      
      if (importedCompany) {
        useCompanyStore.getState().setCompany(importedCompany);
        const { saveCompanySettings } = await import('@/services/settings.service');
        await saveCompanySettings(importedCompany);
      }

      // Track in history
      const fileName = selected.split(/[/\\]/).pop() || 'imported_file.binv';
      await saveImportHistoryRecord({
        fileName,
        invoiceNumber: (importedInvoice as any).invoiceNumber || 'INV-DRAFT',
        clientName: (importedInvoice as any).client?.name || (importedInvoice as any).billTo?.name || 'Client',
        totalAmount: (importedInvoice as any).total || 0,
        data: importedData,
      });

      toast.success('Project opened successfully');
    }
  } catch (error) {
    console.error('Failed to open project:', error);
    toast.error('Failed to open project. Invalid file format.');
  }
};

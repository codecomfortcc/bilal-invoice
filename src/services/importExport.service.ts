import { save, open } from '@tauri-apps/plugin-dialog';
import { invoke } from '@tauri-apps/api/core';
import { useInvoiceStore, useCompanyStore } from '@/stores';
import { toast } from 'sonner';

export const exportProjectData = async () => {
  try {
    const invoiceId = useInvoiceStore.getState().invoiceData.id;

    const filePath = await save({
      filters: [{
        name: 'Bilal Invoice Template',
        extensions: ['bjson']
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
      
      // Update our local state with the newly imported canonical invoice
      useInvoiceStore.getState().setInvoiceData(importedInvoice as any);
      
      // Refresh company profile in case it was updated by the import
      const { getCompanySettings } = await import('@/services/settings.service');
      const updatedCompany = await getCompanySettings();
      if (updatedCompany) {
        useCompanyStore.getState().setCompany(updatedCompany);
      }

      toast.success('Project imported successfully');
    }
  } catch (error) {
    console.error('Failed to import:', error);
    toast.error('Failed to import project. Invalid file format.');
  }
};

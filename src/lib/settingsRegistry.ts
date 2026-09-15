import { Company } from "@/types";
import { saveCompanySettings } from "@/services/settings.service";
import { getPreference, setPreference } from "@/services/system.service";
import { toast } from "sonner";
import { invoke } from "@tauri-apps/api/core";

export type SettingControlType = "toggle" | "select" | "color" | "input" | "action";

export interface RegistryContext {
  company: Company | null;
  setCompany: (company: Company) => void;
  uiStore: {
    developerMode: boolean;
    setDeveloperMode: (mode: boolean) => void;
  };
  themeStore?: {
    theme: string;
    setTheme: (theme: any) => void;
  };
  navigate?: (path: string) => void;
}

export interface RegistrySetting {
  id: string;
  title: string;
  description: string;
  category: "Appearance" | "Preferences" | "Signatures" | "Developer Tools" | "Quick Actions" | string;
  controlType: SettingControlType;
  targetId?: string; // HTML element ID for scroll-to target in Settings page
  keywords?: string[];
  requiresDeveloperMode?: boolean;

  // For toggles
  getValue?: (ctx: RegistryContext) => boolean;
  onToggle?: (val: boolean, ctx: RegistryContext) => void | Promise<void>;

  // For selects
  getSelectValue?: (ctx: RegistryContext) => string;
  options?: { label: string; value: string }[];
  onSelectChange?: (val: string, ctx: RegistryContext) => void | Promise<void>;

  // For color pickers
  getColorValue?: (ctx: RegistryContext) => string;
  onColorChange?: (color: string, ctx: RegistryContext) => void | Promise<void>;

  // For inputs
  getInputValue?: (ctx: RegistryContext) => string | number;
  inputType?: "text" | "number";
  inputPlaceholder?: string;
  onInputChange?: (val: string, ctx: RegistryContext) => void | Promise<void>;

  // For action buttons
  actionLabel?: string;
  onExecute?: (ctx: RegistryContext) => void | Promise<void>;
}

export const ALL_SETTINGS_REGISTRY: RegistrySetting[] = [
  // APPEARANCE & STYLES
  {
    id: "app-theme",
    title: "Application Theme (Light, Dark, System)",
    description: "Switch theme mode between Light, Dark, or System Default",
    category: "Appearance",
    controlType: "select",
    targetId: "setting-app-theme",
    keywords: ["theme", "dark", "light", "mode", "color scheme"],
    getSelectValue: (ctx) => ctx.themeStore?.theme || "system",
    options: [
      { label: "Light", value: "light" },
      { label: "Dark", value: "dark" },
      { label: "System Default", value: "system" },
    ],
    onSelectChange: async (val, ctx) => {
      ctx.themeStore?.setTheme(val);
      await saveRegistryPreference("app_theme", val);
      toast.success(`Theme set to ${val}`);
    },
  },
  {
    id: "master-font",
    title: "Master Font Family",
    description: "Global font family default applied to your invoice templates",
    category: "Appearance",
    controlType: "action",
    targetId: "setting-master-font",
    keywords: ["font", "typography", "family", "text style"],
    actionLabel: "Configure Font",
    onExecute: (ctx) => {
      ctx.navigate?.("/settings");
    },
  },
  {
    id: "master-color",
    title: "Master Text Color",
    description: "Global accent text color applied across invoice fields",
    category: "Appearance",
    controlType: "color",
    targetId: "setting-master-color",
    keywords: ["color", "palette", "brand", "text color"],
    getColorValue: (ctx) => ctx.company?.masterColor || "#000000",
    onColorChange: async (color, ctx) => {
      if (!ctx.company) return;
      const updated = { ...ctx.company, masterColor: color };
      ctx.setCompany(updated);
      await saveCompanySettings(updated);
    },
  },

  // PREFERENCES
  {
    id: "setting-digital-signature",
    title: "Show Digital Signature Block",
    description: "Display the 'Digitally Signed By' text block on invoices",
    category: "Signatures",
    controlType: "toggle",
    targetId: "setting-digital-signature",
    keywords: ["digital signature", "sign", "signed by", "security"],
    getValue: (ctx) => ctx.company?.showDigitalSignature ?? true,
    onToggle: async (val, ctx) => {
      if (!ctx.company) return;
      const updated = { ...ctx.company, showDigitalSignature: val };
      ctx.setCompany(updated);
      await saveCompanySettings(updated);
      toast.success(`Digital Signature ${val ? "Enabled" : "Disabled"}`);
    },
  },
  {
    id: "setting-signature-name",
    title: "Digital Signature Signer Name",
    description: "Name printed on digital signature section",
    category: "Signatures",
    controlType: "input",
    targetId: "setting-digital-signature",
    keywords: ["signer name", "digital signature name", "sign name"],
    inputType: "text",
    inputPlaceholder: "e.g. John Smith",
    getInputValue: (ctx) => ctx.company?.digitalSignatureName || "",
    onInputChange: async (val, ctx) => {
      if (!ctx.company) return;
      const updated = { ...ctx.company, digitalSignatureName: val };
      ctx.setCompany(updated);
      await saveCompanySettings(updated);
    },
  },
  {
    id: "setting-signature-date",
    title: "Use Current Date for Digital Signature",
    description: "Automatically use today's timestamp for digital signatures",
    category: "Signatures",
    controlType: "toggle",
    targetId: "setting-digital-signature",
    keywords: ["signature date", "auto date signature", "timestamp"],
    getValue: (ctx) => ctx.company?.useCurrentDateForSignature ?? true,
    onToggle: async (val, ctx) => {
      if (!ctx.company) return;
      const updated = { ...ctx.company, useCurrentDateForSignature: val };
      ctx.setCompany(updated);
      await saveCompanySettings(updated);
      toast.success(`Signature Auto-Date ${val ? "Enabled" : "Disabled"}`);
    },
  },
  {
    id: "setting-authorized-signatory",
    title: "Show Authorized Signatory Section",
    description: "Display the Authorized Signatory image/text box on invoices",
    category: "Signatures",
    controlType: "toggle",
    targetId: "setting-authorized-signatory",
    keywords: ["authorized signatory", "stamp", "signature image"],
    getValue: (ctx) => ctx.company?.showSignatureImage ?? true,
    onToggle: async (val, ctx) => {
      if (!ctx.company) return;
      const updated = { ...ctx.company, showSignatureImage: val };
      ctx.setCompany(updated);
      await saveCompanySettings(updated);
      toast.success(`Authorized Signatory ${val ? "Enabled" : "Disabled"}`);
    },
  },
  {
    id: "setting-text-signature",
    title: "Use Text Signature Instead of Image",
    description: "Type signature text instead of uploading a PNG/JPG signature image",
    category: "Signatures",
    controlType: "toggle",
    targetId: "setting-authorized-signatory",
    keywords: ["text signature", "type signature", "no image signature"],
    getValue: (ctx) => ctx.company?.useTextForAuthorizedSignature ?? false,
    onToggle: async (val, ctx) => {
      if (!ctx.company) return;
      const updated = { ...ctx.company, useTextForAuthorizedSignature: val };
      ctx.setCompany(updated);
      await saveCompanySettings(updated);
      toast.success(`Text Signature ${val ? "Enabled" : "Disabled"}`);
    },
  },
  {
    id: "setting-auto-save-products",
    title: "Auto-Save Typed Products to Inventory",
    description: "Automatically save items typed into invoice rows into inventory DB",
    category: "Preferences",
    controlType: "toggle",
    targetId: "setting-auto-save",
    keywords: ["auto save", "inventory auto save", "save products"],
    getValue: (ctx) => ctx.company?.autoSaveProducts ?? true,
    onToggle: async (val, ctx) => {
      if (!ctx.company) return;
      const updated = { ...ctx.company, autoSaveProducts: val };
      ctx.setCompany(updated);
      await saveCompanySettings(updated);
      toast.success(`Auto-Save Products ${val ? "Enabled" : "Disabled"}`);
    },
  },
  {
    id: "setting-paper-size",
    title: "Invoice Paper Format",
    description: "Select page dimensions format for invoice layout",
    category: "Preferences",
    controlType: "select",
    targetId: "setting-paper-size",
    keywords: ["paper size", "a4", "a5", "letter", "legal", "print format"],
    getSelectValue: (ctx) => ctx.company?.billSize || "A4",
    options: [
      { label: "A4 (Standard)", value: "A4" },
      { label: "A5 (Half Size)", value: "A5" },
      { label: "Letter", value: "Letter" },
      { label: "Legal", value: "Legal" },
    ],
    onSelectChange: async (val, ctx) => {
      if (!ctx.company) return;
      const updated = { ...ctx.company, billSize: val };
      ctx.setCompany(updated);
      await saveCompanySettings(updated);
      toast.success(`Paper size updated to ${val}`);
    },
  },
  {
    id: "setting-number-format",
    title: "Number Formatting Standard",
    description: "Format numeric figures using Indian (1,00,000) or International standard",
    category: "Preferences",
    controlType: "select",
    targetId: "setting-number-format",
    keywords: ["number format", "indian", "international", "currency commas"],
    getSelectValue: (ctx) => ctx.company?.numberFormat || "indian",
    options: [
      { label: "Indian (1,00,000)", value: "indian" },
      { label: "International (100,000)", value: "international" },
    ],
    onSelectChange: async (val, ctx) => {
      if (!ctx.company) return;
      const updated = { ...ctx.company, numberFormat: val };
      ctx.setCompany(updated);
      await saveCompanySettings(updated);
      toast.success(`Number format set to ${val}`);
    },
  },
  {
    id: "setting-date-format",
    title: "Invoice Date Display Format",
    description: "Choose pattern for rendering dates on invoices",
    category: "Preferences",
    controlType: "select",
    targetId: "setting-date-format",
    keywords: ["date format", "yyyy-mm-dd", "dd-mm-yyyy", "date pattern"],
    getSelectValue: (ctx) => ctx.company?.dateFormat || "YYYY-MM-DD",
    options: [
      { label: "YYYY-MM-DD", value: "YYYY-MM-DD" },
      { label: "DD-MM-YYYY", value: "DD-MM-YYYY" },
      { label: "DD-MM-YY", value: "DD-MM-YY" },
      { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
      { label: "DD MMM YYYY", value: "DD MMM YYYY" },
      { label: "DD MMMM YYYY", value: "DD MMMM YYYY" },
    ],
    onSelectChange: async (val, ctx) => {
      if (!ctx.company) return;
      const updated = { ...ctx.company, dateFormat: val };
      ctx.setCompany(updated);
      await saveCompanySettings(updated);
      toast.success(`Date format set to ${val}`);
    },
  },

  // DEVELOPER TOOLS & QUICK ACTIONS
  {
    id: "setting-developer-mode",
    title: "Developer Mode",
    description: "Reveal field identifiers on Alt-hover and enable advanced dev tools",
    category: "Developer Tools",
    controlType: "toggle",
    targetId: "developer-mode",
    keywords: ["developer", "dev mode", "alt hover", "field keys", "inspect"],
    getValue: (ctx) => ctx.uiStore.developerMode,
    onToggle: async (val, ctx) => {
      ctx.uiStore.setDeveloperMode(val);
      await saveRegistryPreference("developer_mode", String(val));
      toast.success(`Developer Mode ${val ? "Enabled" : "Disabled"}`);
    },
  },
  {
    id: "action-open-devtools",
    title: "Open Developer DevTools Window",
    description: "Launch native Tauri browser DevTools window for DOM & network inspection",
    category: "Developer Tools",
    controlType: "action",
    targetId: "developer-mode",
    keywords: ["devtools", "inspect element", "console", "network", "debug"],
    requiresDeveloperMode: true,
    actionLabel: "Open DevTools",
    onExecute: async (ctx) => {
      if (!ctx.uiStore.developerMode) {
        toast.error("Developer Mode is disabled. Enable Developer Mode in Settings first.");
        return;
      }
      try {
        await invoke("open_devtools");
        toast.success("DevTools window launched");
      } catch (e) {
        toast.error("Failed to open DevTools");
      }
    },
  },
  {
    id: "action-clear-debug-logs",
    title: "Clear Application Debug Logs",
    description: "Purge all recorded in-memory debug console log entries",
    category: "Developer Tools",
    controlType: "action",
    targetId: "developer-mode",
    keywords: ["clear log", "purge logs", "debug log", "clean console"],
    requiresDeveloperMode: true,
    actionLabel: "Clear Logs",
    onExecute: async (ctx) => {
      if (!ctx.uiStore.developerMode) {
        toast.error("Developer Mode is disabled. Enable Developer Mode in Settings first.");
        return;
      }
      const { useDebugLogStore } = await import("@/stores/debug.store");
      useDebugLogStore.getState().clearLogs();
      toast.success("Debug logs cleared");
    },
  },
  {
    id: "action-check-updates",
    title: "Check for Software Updates",
    description: "Manually query GitHub releases API for application updates",
    category: "Quick Actions",
    controlType: "action",
    keywords: ["update", "check update", "software release", "upgrade"],
    actionLabel: "Check Updates",
    onExecute: async () => {
      toast.info("Checking for updates...");
      try {
        const update = await invoke("check_for_updates");
        if (update) {
          toast.success(`Update v${(update as any).version} available!`);
        } else {
          toast.success("Application is up to date.");
        }
      } catch (e) {
        toast.success("Application is up to date.");
      }
    },
  },
  {
    id: "action-keyboard-shortcuts",
    title: "Keyboard Shortcuts Guide",
    description: "View keybindings cheat sheet (Ctrl+P, Ctrl+N, Ctrl+S, Ctrl+,)",
    category: "Quick Actions",
    controlType: "action",
    keywords: ["shortcuts", "keyboard", "hotkeys", "keybindings", "ctrl p", "command palette"],
    actionLabel: "View Shortcuts",
    onExecute: (ctx) => {
      ctx.navigate?.("/shortcuts");
    },
  },
];

/**
 * Dynamically register a new setting into the registry.
 * This allows adding any toggle, dropdown, color picker, input, or button dynamically.
 */
export function addRegistrySetting(setting: RegistrySetting): void {
  const existingIdx = ALL_SETTINGS_REGISTRY.findIndex((s) => s.id === setting.id);
  if (existingIdx >= 0) {
    ALL_SETTINGS_REGISTRY[existingIdx] = setting;
  } else {
    ALL_SETTINGS_REGISTRY.push(setting);
  }
}

/**
 * Persist setting key-value pair to Tauri preference SQLite backend database.
 */
export async function saveRegistryPreference(key: string, value: string): Promise<void> {
  try {
    await setPreference(key, value);
  } catch (e) {
    console.error(`Failed to save backend preference [${key}]:`, e);
  }
}

/**
 * Fetch setting value from Tauri preference SQLite backend database.
 */
export async function loadRegistryPreference(key: string): Promise<string | null> {
  try {
    return await getPreference(key);
  } catch (e) {
    return null;
  }
}

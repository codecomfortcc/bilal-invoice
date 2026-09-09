import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const weightMap: Record<string, string> = {
  "100": "Thin",
  "200": "Extra Light",
  "300": "Light",
  "400": "Regular",
  "500": "Medium",
  "600": "Semi Bold",
  "700": "Bold",
  "800": "Extra Bold",
  "900": "Black",
};

export function formatFontVariant(variant: string): string {
  // variants are typically "400 Normal", "700 Italic", "Regular", "Bold"
  const parts = variant.split(" ");
  if (parts.length === 2 && weightMap[parts[0]]) {
    const weightName = weightMap[parts[0]];
    const styleName = parts[1] === "Normal" ? "" : ` ${parts[1]}`;
    return `${weightName}${styleName}`.trim();
  }
  return variant;
}

export function parseFontVariant(variant: string | undefined | null): { weight: string, style: string } {
  if (!variant) return { weight: "normal", style: "normal" };
  
  const isItalic = variant.includes("Italic");
  const style = isItalic ? "italic" : "normal";
  
  const match = variant.match(/\d{3}/);
  if (match) {
    return { weight: match[0], style };
  }
  
  const isBold = variant.includes("Bold");
  return { weight: isBold ? "bold" : "normal", style };
}

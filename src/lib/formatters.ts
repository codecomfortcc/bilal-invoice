export function formatNumber(
  value: string | number,
  format: "indian" | "international" = "indian"
): string {
  if (value === undefined || value === null || value === "") return "";
  
  // Convert to string and strip existing commas
  let strValue = String(value).replace(/,/g, '');
  
  // Handle invalid numbers gracefully by returning what was typed
  if (isNaN(Number(strValue)) && strValue !== "." && strValue !== "-") {
    return String(value);
  }

  // Handle incomplete trailing decimals like "12."
  let trailingDecimal = "";
  if (strValue.endsWith(".")) {
    trailingDecimal = ".";
    strValue = strValue.slice(0, -1);
  }
  
  const [integerPart, decimalPart] = strValue.split(".");

  let formattedInteger = integerPart;

  if (integerPart) {
    if (format === "indian") {
      // Indian system: 1,00,000
      let lastThree = integerPart.substring(integerPart.length - 3);
      let otherNumbers = integerPart.substring(0, integerPart.length - 3);
      if (otherNumbers !== '') {
        lastThree = ',' + lastThree;
      }
      formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree;
    } else {
      // International system: 100,000
      formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
  }

  let result = formattedInteger + trailingDecimal;
  if (decimalPart !== undefined) {
    result += "." + decimalPart;
  }

  return result;
}

export function parseNumberString(value: string): number {
  if (!value) return 0;
  const stripped = value.replace(/,/g, '');
  const parsed = Number(stripped);
  return isNaN(parsed) ? 0 : parsed;
}

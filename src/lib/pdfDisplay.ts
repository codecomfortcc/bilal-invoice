export function isEmptyDisplayValue(value: unknown): boolean {
  if (value == null) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0 || value.every(isEmptyDisplayValue);
  if (typeof value === "object") {
    const prototype = Object.getPrototypeOf(value);
    return (prototype === Object.prototype || prototype === null) && Object.keys(value).length === 0;
  }
  return false;
}

export function isUnresolvedTemplatePlaceholder(value: unknown): boolean {
  return typeof value === "string" && /^\{\{\s*[^{}]+\s*\}\}$/.test(value.trim());
}

export function includePdfNode(node: Pick<HTMLElement, "hasAttribute">): boolean {
  return !node.hasAttribute("data-pdf-placeholder");
}
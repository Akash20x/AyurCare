export const capitalizeFirstLetter = (text?: string) => {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

export function getInitials(name?: string) {
  if (!name) return "";
  const cleaned = name.replace(/^dr\.?\s*/i, "").trim(); 
  const parts = cleaned.split(/\s+/);
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/^dr[\s.-]?/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


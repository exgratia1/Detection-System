// src/utils/exportHelpers.ts

/**
 * Trigger a browser file download using client-side Blob and Object URLs.
 */
export function downloadBlob(filename: string, content: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Formats a primitive or object value for clean CSV output.
 */
function formatCSVValue(val: unknown): string {
  if (val === null || val === undefined) return '""';
  if (Array.isArray(val)) {
    const formatted = val.map(item => (typeof item === "object" ? JSON.stringify(item) : String(item))).join("; ");
    return `"${formatted.replace(/"/g, '""')}"`;
  }
  if (typeof val === "object") {
    return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
  }
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Converts an array of objects to a UTF-8 encoded CSV and triggers a download.
 * Includes UTF-8 BOM so Microsoft Excel correctly reads currency symbols (e.g., ₦).
 */
export function downloadAsCSV<T extends Record<string, unknown>>(filename: string, data: T[]): void {
  if (!data || data.length === 0) {
    downloadBlob(filename, "\uFEFF(Empty dataset)", "text/csv;charset=utf-8;");
    return;
  }

  // Collect unique headers across all items
  const headers = Array.from(
    new Set(data.flatMap(item => Object.keys(item)))
  );

  const headerRow = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(",");
  const dataRows = data.map(item => 
    headers.map(header => formatCSVValue(item[header])).join(",")
  );

  const csvContent = "\uFEFF" + [headerRow, ...dataRows].join("\r\n");
  downloadBlob(filename, csvContent, "text/csv;charset=utf-8;");
}

/**
 * Serializes data into a formatted JSON string and triggers a download.
 */
export function downloadAsJSON(filename: string, data: unknown): void {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadBlob(filename, jsonContent, "application/json;charset=utf-8;");
}

/**
 * Escapes a single CSV cell according to RFC 4180 while neutralizing formula injection.
 * @param {*} value
 * @returns {string}
 */
export const escapeCsvCell = (value) => {
  if (value === null || value === undefined) {
    return '""';
  }
  const raw = value instanceof Date ? value.toISOString() : String(value);
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
};

/**
 * Triggers a client-side CSV download from pre-formatted rows.
 * @param {Array<Array<*>>} rows
 * @param {string} filename
 */
export const downloadCsvRows = (rows, filename) => {
  const safeName = String(filename || "export.csv").endsWith(".csv")
    ? String(filename || "export.csv")
    : `${filename}.csv`;
  const lines = (Array.isArray(rows) ? rows : []).map((row) =>
    (Array.isArray(row) ? row : []).map(escapeCsvCell).join(",")
  );
  const blob = new Blob([`\uFEFF${lines.join("\n")}`], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", safeName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Triggers a client-side CSV download with UTF-8 BOM.
 * Supports either `(rows, filename)` or `({ filename, headers, rows })`.
 */
export const downloadCsv = (arg1, arg2) => {
  if (Array.isArray(arg1)) {
    downloadCsvRows(arg1, arg2);
    return;
  }
  const { filename, headers = [], rows = [] } = arg1 || {};
  downloadCsvRows([headers, ...rows], filename);
};

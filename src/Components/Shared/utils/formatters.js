/**
 * Shared formatting and escaping utilities for the dashboard.
 */

export const formatCurrency = (
  value,
  { minimumFractionDigits, maximumFractionDigits = 2 } = {}
) => {
  const num = Number(value || 0);
  const safeNum = Number.isFinite(num) ? num : 0;
  const options = {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits,
  };
  if (minimumFractionDigits !== undefined) {
    options.minimumFractionDigits = minimumFractionDigits;
  }
  return new Intl.NumberFormat("en-IE", options).format(safeNum);
};

export const formatNumber = (value) => {
  const num = Number(value || 0);
  return (Number.isFinite(num) ? num : 0).toLocaleString("en-IE");
};

export const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (char) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[char];
  });

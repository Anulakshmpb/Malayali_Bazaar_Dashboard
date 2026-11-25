import React from "react";

const STATUS_STYLES = {
  // Order workflow statuses
  new: "bg-blue-50 text-blue-700 border-blue-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  processing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  dispatch: "bg-purple-50 text-purple-700 border-purple-200",
  "out of delivery": "bg-cyan-50 text-cyan-700 border-cyan-200",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200",
  canceled: "bg-rose-50 text-rose-700 border-rose-200",

  // Payment statuses
  paid: "bg-emerald-50 text-emerald-700 border-emerald-200",
  partial: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-rose-50 text-rose-700 border-rose-200",

  // General / catalog / stock statuses
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  inactive: "bg-slate-100 text-slate-600 border-slate-200",
  "in stock": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "low stock": "bg-amber-50 text-amber-700 border-amber-200",
  "out of stock": "bg-rose-50 text-rose-700 border-rose-200",
  unread: "bg-amber-50 text-amber-700 border-amber-200",
  read: "bg-slate-100 text-slate-600 border-slate-200",
};

/**
 * Consistent pill badge for order, payment, stock, and account statuses.
 */
const StatusBadge = ({ status, label, className = "" }) => {
  const normalized = String(status || "").trim().toLowerCase();
  const display = label || status || "Unknown";
  const style =
    STATUS_STYLES[normalized] ||
    "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${style} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-75" />
      {display}
    </span>
  );
};

export default StatusBadge;

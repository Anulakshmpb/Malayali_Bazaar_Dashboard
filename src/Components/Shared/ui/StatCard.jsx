import React from "react";

const TONE_MAP = {
  primary: "bg-primary/10 text-primary",
  emerald: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50 text-amber-600",
  rose: "bg-rose-50 text-rose-600",
  blue: "bg-blue-50 text-blue-600",
  indigo: "bg-indigo-50 text-indigo-600",
  slate: "bg-slate-100 text-slate-600",
};

/**
 * Reusable KPI summary card across dashboard, reports, notifications, ledger, and stock pages.
 */
const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  tone = "primary",
  active = false,
  onClick,
  className = "",
}) => {
  const iconTone = TONE_MAP[tone] || TONE_MAP.primary;
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`w-full rounded-2xl border bg-white p-5 text-left shadow-sm transition-all ${
        active
          ? "border-primary ring-2 ring-primary/15"
          : "border-tertiary/30 hover:shadow-md"
      } ${onClick ? "cursor-pointer" : ""} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {title}
          </p>
          <p className="mt-2 truncate font-jakarta text-2xl font-bold tracking-tight text-gray-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 truncate text-xs text-gray-500">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconTone}`}
          >
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Component>
  );
};

export default StatCard;

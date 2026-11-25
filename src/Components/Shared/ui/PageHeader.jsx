import React from "react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

/**
 * Consistent top-of-page header with optional back button, icon, title, subtitle, and actions slot.
 */
const PageHeader = ({
  title,
  subtitle,
  icon: Icon,
  badge,
  backTo,
  onBack,
  actions,
  className = "",
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (backTo) {
      navigate(backTo);
      return;
    }
    navigate(-1);
  };

  return (
    <div
      className={`mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between ${className}`}
    >
      <div className="flex items-start gap-3 sm:items-center">
        {(backTo || onBack) && (
          <button
            type="button"
            onClick={handleBack}
            aria-label="Go back"
            className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-tertiary/40 bg-white text-secondary transition hover:border-primary/40 hover:bg-primary/5 sm:mt-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}

        {Icon && (
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
            <Icon className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-jakarta text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
              {title}
            </h1>
            {badge}
          </div>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2.5 sm:shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
};

export default PageHeader;

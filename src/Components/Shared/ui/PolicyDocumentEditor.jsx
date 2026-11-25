import React, { useCallback, useEffect, useState } from "react";
import {
  Shield,
  Plus,
  Trash2,
  Save,
  Mail,
  Globe,
  AlignLeft,
  Layers,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../Config/Firebase";
import { useConfirm } from "./ConfirmDialog";
import { useToast } from "../hooks/ToastContext";
import PageHeader from "./PageHeader";

const initialPolicyData = {
  introduction: "",
  sections: [{ title: "", description: "" }],
  footerDescription: "",
  email: "",
  website: "",
};

const normalizePolicyData = (data = {}) => ({
  introduction: data.introduction ?? "",
  sections:
    Array.isArray(data.sections) && data.sections.length > 0
      ? data.sections.map((section) => ({
          title: section.title ?? "",
          description: section.description ?? "",
        }))
      : [{ title: "", description: "" }],
  footerDescription: data.footerDescription ?? "",
  email: data.email ?? "",
  website: data.website ?? "",
});

/**
 * Shared structured policy editor for Privacy Policy, Shipping Policy, and Terms & Conditions.
 */
const PolicyDocumentEditor = ({
  type,
  title,
  subtitle,
  documentLabel,
  websitePlaceholder = "https://malayalibazaar.de",
  emailPlaceholder = "support@malayalibazaar.de",
}) => {
  const confirm = useConfirm();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [policyExists, setPolicyExists] = useState(false);
  const [formData, setFormData] = useState(() =>
    normalizePolicyData(initialPolicyData)
  );

  const functions = getFunctions(app, "europe-west1");

  const callWebsiteManagement = useCallback(
    async (action, fields = {}) => {
      const manageWebsite = httpsCallable(functions, "manageWebsiteManagement");
      const response = await manageWebsite({ type, action, fields });
      const result = response.data;
      if (!result?.success) {
        throw new Error(
          result?.message || `${documentLabel} operation failed.`
        );
      }
      return result;
    },
    [documentLabel, functions, type]
  );

  const loadDocument = useCallback(
    async ({ showLoading = true } = {}) => {
      if (showLoading) setLoading(true);
      try {
        const result = await callWebsiteManagement("list");
        const record = result.data;
        if (record && typeof record === "object") {
          setPolicyExists(true);
          setFormData(normalizePolicyData(record));
        } else {
          setPolicyExists(false);
          setFormData(normalizePolicyData(initialPolicyData));
        }
        return true;
      } catch (error) {
        console.error(`Error loading ${type} policy:`, error);
        showToast(error.message || `Failed to load ${documentLabel}.`, "error");
        return false;
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [callWebsiteManagement, documentLabel, showToast, type]
  );

  useEffect(() => {
    loadDocument();
  }, [loadDocument]);

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const addSection = () => {
    setFormData((prev) => ({
      ...prev,
      sections: [...prev.sections, { title: "", description: "" }],
    }));
  };

  const updateSection = (index, field, value) => {
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      ),
    }));
  };

  const removeSection = (index) => {
    if (formData.sections.length === 1) return;
    setFormData((prev) => ({
      ...prev,
      sections: prev.sections.filter((_, i) => i !== index),
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (saving || deleting) return;

    const cleanedSections = formData.sections
      .map((s) => ({
        title: String(s.title || "").trim(),
        description: String(s.description || "").trim(),
      }))
      .filter((s) => s.title || s.description);

    const payload = {
      introduction: String(formData.introduction || "").trim(),
      sections:
        cleanedSections.length > 0
          ? cleanedSections
          : [{ title: "", description: "" }],
      footerDescription: String(formData.footerDescription || "").trim(),
      email: String(formData.email || "").trim(),
      website: String(formData.website || "").trim(),
    };

    if (!payload.introduction && cleanedSections.length === 0) {
      showToast(
        `Please add an introduction or at least one ${documentLabel} section before saving.`,
        "error"
      );
      return;
    }

    setSaving(true);
    try {
      const action = policyExists ? "update" : "add";
      const result = await callWebsiteManagement(action, payload);
      setPolicyExists(true);
      setFormData(normalizePolicyData(payload));

      const refreshed = await loadDocument({ showLoading: false });
      showToast(
        refreshed
          ? result.message || `${documentLabel} saved successfully.`
          : `${documentLabel} saved, but refreshing failed. Please reload.`,
        "success"
      );
    } catch (error) {
      console.error(`Error saving ${type}:`, error);
      showToast(error.message || `Failed to save ${documentLabel}.`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!policyExists || deleting || saving) return;

    const confirmed = await confirm({
      title: `Delete ${documentLabel}`,
      message: `Are you sure you want to delete the ${documentLabel.toLowerCase()}?`,
      confirmLabel: "Delete",
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const result = await callWebsiteManagement("delete");
      setPolicyExists(false);
      setFormData(normalizePolicyData(initialPolicyData));
      showToast(
        result.message || `${documentLabel} deleted successfully.`,
        "success"
      );
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      showToast(
        error.message || `Failed to delete ${documentLabel}.`,
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/40 pb-12 pt-6">
      <div className="page-container mx-auto max-w-5xl">
        <PageHeader
          icon={Shield}
          title={title}
          subtitle={subtitle}
          badge={
            !loading && (
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  policyExists
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-amber-200 bg-amber-50 text-amber-700"
                }`}
              >
                {policyExists ? "Published" : "Draft"}
              </span>
            )
          }
          actions={
            <>
              <button
                type="button"
                onClick={() => loadDocument({ showLoading: true })}
                disabled={loading || saving || deleting}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </button>

              {policyExists && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting || saving || loading}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              )}
            </>
          }
        />

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-36 animate-pulse rounded-2xl border border-tertiary/20 bg-white p-6"
              />
            ))}
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-6">
            {/* Introduction */}
            <div className="rounded-2xl border border-tertiary/30 bg-white p-6 shadow-sm">
              <div className="mb-3 flex items-center gap-2">
                <AlignLeft className="h-4 w-4 text-primary" />
                <h2 className="font-jakarta text-base font-bold text-gray-900">
                  Introduction
                </h2>
              </div>
              <textarea
                rows={4}
                value={formData.introduction}
                onChange={(e) => updateField("introduction", e.target.value)}
                placeholder={`Write the introduction for ${documentLabel.toLowerCase()}...`}
                className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
              />
            </div>

            {/* Sections */}
            <div className="rounded-2xl border border-tertiary/30 bg-white p-6 shadow-sm">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h2 className="font-jakarta text-base font-bold text-gray-900">
                    Policy Sections
                  </h2>
                  <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {formData.sections.length}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={addSection}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/5 px-3.5 py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Section
                </button>
              </div>

              <div className="space-y-4">
                {formData.sections.map((section, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-gray-200 bg-slate-50/70 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        Section {index + 1}
                      </span>
                      {formData.sections.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeSection(index)}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-rose-600 transition hover:bg-rose-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <input
                        type="text"
                        value={section.title}
                        onChange={(e) =>
                          updateSection(index, "title", e.target.value)
                        }
                        placeholder="Section heading"
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                      <textarea
                        rows={3}
                        value={section.description}
                        onChange={(e) =>
                          updateSection(index, "description", e.target.value)
                        }
                        placeholder="Section details..."
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer & Contact */}
            <div className="rounded-2xl border border-tertiary/30 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <h2 className="font-jakarta text-base font-bold text-gray-900">
                  Footer & Contact Details
                </h2>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Closing Note
                  </label>
                  <textarea
                    rows={3}
                    value={formData.footerDescription}
                    onChange={(e) =>
                      updateField("footerDescription", e.target.value)
                    }
                    placeholder="Optional footer summary or compliance note..."
                    className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      Contact Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField("email", e.target.value)}
                      placeholder={emailPlaceholder}
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField("website", e.target.value)}
                      placeholder={websitePlaceholder}
                      className="w-full rounded-xl border border-gray-200 bg-slate-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving || deleting}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-md transition hover:bg-secondary disabled:opacity-60"
              >
                <Save className="h-4 w-4" />
                {saving
                  ? "Saving..."
                  : policyExists
                    ? `Update ${documentLabel}`
                    : `Save ${documentLabel}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PolicyDocumentEditor;

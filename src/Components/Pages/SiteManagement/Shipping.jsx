
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

const initialPrivacyData = {
  introduction: "",
  sections: [{ title: "", description: "" }],
  footerDescription: "",
  email: "",
  website: "",
};

const normalizePrivacy = (data = {}) => ({
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

const ShippingPolicy = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [policyExists, setPolicyExists] = useState(false);

  const [formData, setFormData] = useState(() =>
    normalizePrivacy(initialPrivacyData)
  );

  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const functions = getFunctions(app, "europe-west1");

  const callWebsiteManagement = useCallback(
    async (action, fields = {}) => {
      const manageWebsite = httpsCallable(
        functions,
        "manageWebsiteManagement"
      );

      const response = await manageWebsite({
        type: "shipping",
        action,
        fields,
      });

      const result = response.data;

      if (!result?.success) {
        throw new Error(
          result?.message || "Shipping policy operation failed."
        );
      }

      return result;
    },
    [functions]
  );

  const loadShipping = useCallback(
    async ({ showLoading = true, clearMessage = true } = {}) => {
      if (showLoading) {
        setLoading(true);
      }

      if (clearMessage) {
        setMessage({ type: "", text: "" });
      }

      try {
        const result = await callWebsiteManagement("list");
        const record = result.data;

        if (record && typeof record === "object") {
          setPolicyExists(true);
          setFormData(normalizePrivacy(record));
        } else {
          setPolicyExists(false);
          setFormData(normalizePrivacy(initialPrivacyData));
        }

        return true;
      } catch (error) {
        console.error("Error loading shipping policy:", error);

        setMessage({
          type: "error",
          text: error.message || "Failed to load shipping policy.",
        });

        return false;
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [callWebsiteManagement]
  );

  useEffect(() => {
    loadShipping();
  }, [loadShipping]);

  const updateField = (field, value) => {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const addSection = () => {
    setFormData((previous) => ({
      ...previous,
      sections: [
        ...previous.sections,
        { title: "", description: "" },
      ],
    }));
  };

  const updateSection = (index, field, value) => {
    setFormData((previous) => ({
      ...previous,
      sections: previous.sections.map((section, i) =>
        i === index
          ? { ...section, [field]: value }
          : section
      ),
    }));
  };

  const removeSection = (index) => {
    setFormData((previous) => ({
      ...previous,
      sections: previous.sections.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving || deleting) return;

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const payload = {
        introduction: formData.introduction,
        sections: formData.sections.map((section) => ({
          title: section.title,
          description: section.description,
        })),
        footerDescription: formData.footerDescription,
        email: formData.email,
        website: formData.website,
      };

      const action = policyExists ? "update" : "add";

      const result = await callWebsiteManagement(
        action,
        payload
      );

      setPolicyExists(true);
      setFormData(normalizePrivacy(payload));

      setMessage({
        type: "success",
        text:
          result.message ||
          (action === "add"
            ? "Shipping policy added successfully."
            : "Shipping policy updated successfully."),
      });

      const refreshed = await loadShipping({
        showLoading: false,
        clearMessage: false,
      });

      if (!refreshed) {
        setMessage({
          type: "success",
          text:
            "Shipping policy saved successfully, but refreshing the document failed. Please refresh the page.",
        });
      } else {
        setMessage({
          type: "success",
          text: result.message || "Shipping policy saved successfully.",
        });
      }
    } catch (error) {
      console.error("Error saving shipping policy:", error);

      setMessage({
        type: "error",
        text: error.message || "Failed to save shipping policy.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!policyExists || deleting || saving) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete the shipping policy?"
    );

    if (!confirmed) return;

    setDeleting(true);
    setMessage({ type: "", text: "" });

    try {
      const result = await callWebsiteManagement("delete");

      setPolicyExists(false);
      setFormData(normalizePrivacy(initialPrivacyData));

      setMessage({
        type: "success",
        text: result.message || "Shipping policy deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting shipping policy:", error);

      setMessage({
        type: "error",
        text: error.message || "Failed to delete shipping policy.",
      });
    } finally {
      setDeleting(false);
    }
  };


  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <div className="relative">
          <div className="h-16 w-16 animate-spin rounded-full border-b-4 border-t-4 border-primary" />
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Shield className="h-6 w-6 text-primary" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container min-h-screen bg-white pb-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="bg-gradient-to-br from-gray-900 to-secondary bg-clip-text text-3xl font-bold text-transparent">
              Shipping Policy
            </h1>

            <p className="mt-1 text-sm font-medium text-secondary/80">
              Manage your shipping policy content
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadShipping()}
            disabled={saving || deleting}
            className="flex items-center justify-center gap-2 rounded-xl border border-tertiary/50 px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {/* Success / Error Message */}
        {message.text && (
          <div
            role="status"
            className={`rounded-xl border p-4 text-sm font-medium ${
              message.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-rose-200 bg-rose-50 text-rose-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Document Status */}
        <div className="flex items-center justify-between rounded-xl border border-tertiary/40 bg-slate-50 px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-gray-900">
              Shipping Policy Document
            </p>
            <p className="mt-1 text-xs text-secondary/80">
              websiteManagement/shipping
            </p>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${
              policyExists
                ? "bg-emerald-50 text-emerald-700"
                : "bg-amber-50 text-amber-700"
            }`}
          >
            {policyExists ? "Existing document" : "Not created"}
          </span>
        </div>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Introduction */}
          <div className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <AlignLeft className="h-4 w-4 text-primary" />
              </span>
              Introduction
            </h2>

            <textarea
              rows={4}
              value={formData.introduction}
              onChange={(event) =>
                updateField("introduction", event.target.value)
              }
              className="w-full rounded-xl border border-tertiary/60 bg-slate-50 p-3 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
              placeholder="Introduction paragraph..."
            />
          </div>

          {/* Policy Sections */}
          <div className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Layers className="h-4 w-4 text-violet-600" />
                </span>
                Policy Sections
              </h2>

              <button
                type="button"
                onClick={addSection}
                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
              >
                <Plus className="h-4 w-4" />
                Add Section
              </button>
            </div>

            <div className="space-y-4">
              {formData.sections.map((section, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-tertiary/40 bg-slate-50/70 p-4"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-secondary/70">
                      Section {index + 1}
                    </span>

                    {formData.sections.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSection(index)}
                        className="flex items-center gap-1 text-xs font-semibold text-rose-500 transition-colors hover:text-rose-700"
                      >
                        <Trash2 className="h-3 w-3" />
                        Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    value={section.title}
                    onChange={(event) =>
                      updateSection(index, "title", event.target.value)
                    }
                    className="mb-3 w-full rounded-lg border border-tertiary/60 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-secondary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Section Heading"
                  />

                  <textarea
                    rows={3}
                    value={section.description}
                    onChange={(event) =>
                      updateSection(
                        index,
                        "description",
                        event.target.value
                      )
                    }
                    className="w-full rounded-lg border border-tertiary/60 bg-white p-3 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-secondary/50 focus:border-primary focus:ring-2 focus:ring-primary/20"
                    placeholder="Section description..."
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Company Info */}
          <div className="rounded-2xl border border-tertiary/40 bg-white p-6 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                <Sparkles className="h-4 w-4 text-amber-600" />
              </span>
              Company Info
            </h2>

            <div className="space-y-4">
              <textarea
                rows={2}
                value={formData.footerDescription}
                onChange={(event) =>
                  updateField("footerDescription", event.target.value)
                }
                className="w-full rounded-xl border border-tertiary/60 bg-slate-50 p-3 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                placeholder="Footer Description"
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/50" />

                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    className="w-full rounded-xl border border-tertiary/60 bg-slate-50 py-3 pl-10 pr-3 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    placeholder="privacy@company.com"
                  />
                </div>

                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/50" />

                  <input
                    type="text"
                    value={formData.website}
                    onChange={(event) =>
                      updateField("website", event.target.value)
                    }
                    className="w-full rounded-xl border border-tertiary/60 bg-slate-50 py-3 pl-10 pr-3 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    placeholder="www.company.com"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Save / Delete Buttons */}
          <div className="flex flex-col-reverse justify-between gap-3 sm:flex-row">
            {policyExists && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving || deleting}
                className="flex items-center justify-center gap-2 rounded-xl border border-rose-200 px-5 py-3 text-sm font-bold text-rose-600 transition-colors hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deleting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                {deleting ? "Deleting..." : "Delete Policy"}
              </button>
            )}

            <button
              type="submit"
              disabled={saving || deleting}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-white shadow-md transition-all hover:-translate-y-0.5 hover:bg-secondary hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-auto"
            >
              {saving ? (
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}

              {saving
                ? "Saving..."
                : policyExists
                  ? "Save Changes"
                  : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShippingPolicy;

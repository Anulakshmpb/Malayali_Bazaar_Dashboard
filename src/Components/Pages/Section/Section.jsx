
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../Config/Firebase";
import CommonTable from "../../Shared/Pages/CommonTable";
import { getAuth } from "firebase/auth";
import {
    Plus,
    Edit,
    Trash2,
    X,
    Eye,
    Loader2,
    RefreshCw,
    GripVertical,
} from "lucide-react";
const auth = getAuth(app);


const initialForm = {
    sectionName: "",
    // order: "",
};

export default function Section() {
    const navigate = useNavigate();

    const [sections, setSections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const functions = getFunctions(app, "europe-west1");
    const manageSection = useMemo(() => httpsCallable(functions, 'manageSection'), [functions]);

    const [draggedId, setDraggedId] = useState(null);
    const [reordering, setReordering] = useState(false);

    const handleDragStart = (event, section) => {
        const sectionId = section.sectionId || section.id;

        setDraggedId(sectionId);
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", sectionId);
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (event, targetSection) => {
        event.preventDefault();

        const sourceId =
            event.dataTransfer.getData("text/plain") || draggedId;
        const targetId = targetSection.sectionId || targetSection.id;

        setDraggedId(null);

        if (!sourceId || sourceId === targetId || reordering) {
            return;
        }

        const previousSections = [...sections];
        const reorderedSections = [...sections];

        const sourceIndex = reorderedSections.findIndex(
            (section) => (section.sectionId || section.id) === sourceId
        );

        const targetIndex = reorderedSections.findIndex(
            (section) => (section.sectionId || section.id) === targetId
        );

        if (sourceIndex === -1 || targetIndex === -1) {
            return;
        }

        // Move the dragged section to the target position.
        const [movedSection] = reorderedSections.splice(sourceIndex, 1);
        reorderedSections.splice(targetIndex, 0, movedSection);

        // Assign order numbers automatically, starting at 1.
        const updatedSections = reorderedSections.map((section, index) => ({
            ...section,
            order: index + 1,
        }));

        // Update the UI immediately.
        setSections(updatedSections);
        setError("");
        setNotice("");
        setReordering(true);

        try {
            // Persist the new order through your existing callable.
            for (const section of updatedSections) {
                const sectionId = section.sectionId || section.id;

                if (!sectionId) {
                    throw new Error(
                        `Missing section ID for "${section.sectionName}".`
                    );
                }

                const response = await manageSection({
                    action: "update",
                    fields: {
                        sectionId,
                        sectionName: section.sectionName,
                        order: section.order,
                    },
                });

                if (!response.data?.success) {
                    throw new Error(
                        response.data?.message ||
                        `Failed to update "${section.sectionName}".`
                    );
                }
            }

            setNotice("Section order saved successfully.");
        } catch (err) {
            console.error("Failed to save section order:", err);

            // Restore the previous order, then reload the database state.
            setSections(previousSections);
            setError(
                err.message ||
                "Unable to save the new order. Please refresh and try again."
            );

            await fetchSections();
        } finally {
            setReordering(false);
        }
    };
    const fetchSections = async () => {
        setLoading(true);
        setError("");
        try {
            const response = await manageSection({ action: 'list' });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to load sections.');
            }
            setSections(
                [...(response.data.data || [])].sort(
                    (a, b) => Number(a.order || 0) - Number(b.order || 0)
                )
            );
        } catch (error) {
            console.error('Failed to load sections:', error);
            // showToast(error.message || 'Unable to load sections.', 'error');
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        fetchSections();
    }, []);

    const openAddModal = () => {
        setEditingSection(null);
        setForm(initialForm);
        setError("");
        setNotice("");
        setIsModalOpen(true);
    };
    const openEditModal = (section) => {
        setEditingSection(section);
        setForm({
            sectionName: section.sectionName || "",
            // order: String(section.order ?? ""),
        });
        setError("");
        setNotice("");
        setIsModalOpen(true);
    };

    const closeModal = () => {
        if (saving) return;

        setIsModalOpen(false);
        setEditingSection(null);
        setForm(initialForm);
        setError("");
    };

    // --------------------------------------------------
    // ADD / UPDATE SECTION
    // --------------------------------------------------
    const handleSubmit = async (event) => {
        event.preventDefault();

        setError("");
        setNotice("");

        const sectionName = form.sectionName.trim();

        if (!sectionName) {
            setError("Please enter a section name.");
            return;
        }

        const user = auth.currentUser;

        if (!user) {
            setError("Please log in again before adding a section.");
            return;
        }

        setSaving(true);

        try {
            const action = editingSection ? "update" : "add";
            const order = editingSection
                ? Number(editingSection.order ?? 1)
                : sections.reduce(
                    (maximum, section) =>
                        Math.max(maximum, Number(section.order) || 0),
                    0
                ) + 1;

            const fields = {
                sectionName,
                order,
            };

            if (editingSection) {
                fields.sectionId =
                    editingSection.sectionId || editingSection.id;
            }

            const response = await manageSection({
                action,
                fields,
            });

            const result = response.data;

            if (!result?.success) {
                throw new Error(
                    result?.message || "Section operation failed."
                );
            }

            setNotice(
                result.message ||
                (action === "add"
                    ? "Section added successfully."
                    : "Section updated successfully.")
            );

            setIsModalOpen(false);
            setEditingSection(null);
            setForm(initialForm);

            await fetchSections();
        } catch (err) {
            console.error("Save section error:", err);
            setError(
                err?.message || "Unable to save the section. Please try again."
            );
        } finally {
            setSaving(false);
        }
    };

    // --------------------------------------------------
    // DELETE SECTION
    // --------------------------------------------------
    const handleDelete = async (section) => {
        const sectionId = section.sectionId || section.id;

        if (!sectionId) {
            setError("Cannot delete this section: section ID is missing.");
            return;
        }

        const confirmed = window.confirm(
            `Delete "${section.sectionName}"? This will remove the section document and its linked product list.`
        );

        if (!confirmed) return;

        setError("");
        setNotice("");
        setDeletingId(sectionId);

        try {
            const response = await manageSection({
                action: "delete",
                fields: { sectionId },
            });

            const result = response.data;

            if (!result?.success) {
                throw new Error(result?.message || "Failed to delete section.");
            }

            setNotice(result.message || "Section deleted successfully.");

            setSections((previous) =>
                previous.filter(
                    (item) =>
                        (item.sectionId || item.id) !== sectionId
                )
            );
        } catch (err) {
            console.error("Delete section error:", err);
            setError(err?.message || "Unable to delete the section.");
        } finally {
            setDeletingId(null);
        }
    };

    // --------------------------------------------------
    // VIEW SECTION
    // --------------------------------------------------
    const handleView = (section) => {
        const sectionId = section.sectionId || section.id;

        navigate("/section/view", {
            state: { sectionId },
        });
    };

    return (
        <div className="page-container min-h-screen bg-white pb-10">
            <div className="mx-auto max-w-5xl space-y-6">
                {/* HEADER */}
                <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="bg-gradient-to-br from-gray-900 to-secondary bg-clip-text text-3xl font-bold text-transparent">
                            Section Management
                        </h1>

                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={fetchSections}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl border border-tertiary/60 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
                        >
                            <RefreshCw
                                size={16}
                                className={loading ? "animate-spin" : ""}
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={openAddModal}
                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-secondary focus:outline-none focus:ring-4 focus:ring-primary/20"
                        >
                            <Plus size={18} />
                            Add Section
                        </button>
                    </div>
                </div>

                {/* FEEDBACK */}
                {error && !isModalOpen && (
                    <div
                        role="alert"
                        className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
                    >
                        <span>{error}</span>
                        <button
                            type="button"
                            onClick={() => setError("")}
                            aria-label="Dismiss error"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {notice && (
                    <div
                        role="status"
                        className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
                    >
                        <span>{notice}</span>
                        <button
                            type="button"
                            onClick={() => setNotice("")}
                            aria-label="Dismiss message"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* SECTIONS TABLE */}
                {/* <CommonTable
                    title="Sections"
                    subtitle="Manage the sections stored in your database"
                    columns={[
                        {
                            key: "sectionName",
                            header: "Name",
                            sortable: true,
                            cellClassName: "font-semibold text-gray-900",
                        },
                        {
                            key: "order",
                            header: "Display Order",
                            sortable: true,
                        },
                    ]}
                    data={sections}
                    total={sections.length}
                    clientSide
                    rowKey="sectionId"
                    searchPlaceholder="Search sections..."
                    actions={(row) => (
                        <>
                            <button
                                type="button"
                                title="View section"
                                onClick={() => handleView(row)}
                                className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50"
                            >
                                <Eye size={16} />
                            </button>

                            <button
                                type="button"
                                title="Edit section"
                                onClick={() => openEditModal(row)}
                                className="rounded-lg p-2 text-gray-700 transition hover:bg-slate-100 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button>

                            <button
                                type="button"
                                title="Delete section"
                                onClick={() => handleDelete(row)}
                                disabled={
                                    deletingId === (row.sectionId || row.id)
                                }
                                className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                            >
                                {deletingId === (row.sectionId || row.id) ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Trash2 size={16} />
                                )}
                            </button>
                        </>
                    )}
                /> */}
                {/* DRAGGABLE SECTIONS */}
                <div className="overflow-hidden rounded-2xl border border-tertiary/40 bg-white shadow-sm">
                    <div className="flex flex-col gap-2 border-b border-tertiary/30 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Sections
                            </h2>
                            <p className="text-sm text-gray-500">
                                Drag the handle to change the display order.
                            </p>
                        </div>

                        {reordering && (
                            <span className="flex items-center gap-2 text-sm font-medium text-primary">
                                <Loader2 size={16} className="animate-spin" />
                                Saving order...
                            </span>
                        )}
                    </div>

                    {sections.length > 0 ? (
                        <div className="divide-y divide-tertiary/20">
                            {sections.map((section, index) => {
                                const sectionId = section.sectionId || section.id;

                                return (
                                    <div
                                        key={sectionId}
                                        draggable={!reordering}
                                        onDragStart={(event) =>
                                            handleDragStart(event, section)
                                        }
                                        onDragOver={handleDragOver}
                                        onDrop={(event) => handleDrop(event, section)}
                                        onDragEnd={() => setDraggedId(null)}
                                        className={`flex items-center gap-3 px-4 py-4 transition sm:px-5 ${draggedId === sectionId
                                            ? "opacity-40"
                                            : "hover:bg-slate-50"
                                            } ${reordering
                                                ? "cursor-wait"
                                                : "cursor-grab active:cursor-grabbing"
                                            }`}
                                    >
                                        <div
                                            title="Drag to reorder"
                                            className="flex h-10 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-slate-100 hover:text-gray-700"
                                        >
                                            <GripVertical size={20} />
                                        </div>

                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-gray-700">
                                            {index + 1}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate font-semibold text-gray-900">
                                                {section.sectionName}
                                            </p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Display order: {section.order}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center gap-1">
                                            <button
                                                type="button"
                                                title="View section"
                                                aria-label={`View ${section.sectionName}`}
                                                onClick={() => handleView(section)}
                                                className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50"
                                            >
                                                <Eye size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Edit section"
                                                aria-label={`Edit ${section.sectionName}`}
                                                onClick={() => openEditModal(section)}
                                                disabled={reordering}
                                                className="rounded-lg p-2 text-gray-700 transition hover:bg-slate-100 hover:text-primary disabled:opacity-50"
                                            >
                                                <Edit size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                title="Delete section"
                                                aria-label={`Delete ${section.sectionName}`}
                                                onClick={() => handleDelete(section)}
                                                disabled={
                                                    reordering || deletingId === sectionId
                                                }
                                                className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                                            >
                                                {deletingId === sectionId ? (
                                                    <Loader2
                                                        size={16}
                                                        className="animate-spin"
                                                    />
                                                ) : (
                                                    <Trash2 size={16} />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        !loading && (
                            <p className="px-5 py-10 text-center text-sm text-gray-500">
                                No sections found. Click Add Section to create one.
                            </p>
                        )
                    )}

                    {loading && (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                            <Loader2 size={18} className="animate-spin" />
                            Loading sections...
                        </div>
                    )}
                </div>

                {loading && sections.length === 0 && (
                    <div className="flex items-center justify-center gap-2 py-6 text-sm text-gray-500">
                        <Loader2 size={18} className="animate-spin" />
                        Loading sections from the database...
                    </div>
                )}

                {!loading && !error && sections.length === 0 && (
                    <p className="py-4 text-center text-sm text-gray-500">
                        No sections found. Click Add Section to create one.
                    </p>
                )}
            </div>

            {/* ADD / EDIT MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        {/* MODAL HEADER */}
                        <div className="flex items-center justify-between border-b border-tertiary/30 px-6 py-4">
                            <h2 className="text-lg font-bold text-gray-900">
                                {editingSection ? "Edit Section" : "Add New Section"}
                            </h2>

                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={saving}
                                aria-label="Close modal"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary transition hover:bg-slate-100 hover:text-gray-900 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* MODAL FORM */}
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-5 px-6 py-6">
                                {error && (
                                    <div
                                        role="alert"
                                        className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700"
                                    >
                                        {error}
                                    </div>
                                )}

                                <div>
                                    <label
                                        htmlFor="sectionName"
                                        className="mb-1.5 block text-sm font-semibold text-gray-900"
                                    >
                                        Section Name{" "}
                                        <span className="text-rose-500">*</span>
                                    </label>

                                    <input
                                        id="sectionName"
                                        type="text"
                                        required
                                        maxLength={150}
                                        value={form.sectionName}
                                        onChange={(event) =>
                                            setForm((previous) => ({
                                                ...previous,
                                                sectionName: event.target.value,
                                            }))
                                        }
                                        placeholder="e.g. Featured Products"
                                        className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>

                                {/* <div>
                                    <label
                                        htmlFor="sectionOrder"
                                        className="mb-1.5 block text-sm font-semibold text-gray-900"
                                    >
                                        Display Order{" "}
                                        <span className="text-rose-500">*</span>
                                    </label>

                                    <input
                                        id="sectionOrder"
                                        type="number"
                                        step="1"
                                        required
                                        value={form.order}
                                        onChange={(event) =>
                                            setForm((previous) => ({
                                                ...previous,
                                                order: event.target.value,
                                            }))
                                        }
                                        placeholder="Enter order number"
                                        className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                    />

                                    <p className="mt-1 text-xs text-gray-500">
                                        Sections are displayed in ascending order.
                                    </p>
                                </div> */}
                            </div>

                            {/* MODAL FOOTER */}
                            <div className="flex items-center justify-end gap-3 border-t border-tertiary/30 bg-slate-50 px-6 py-4">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    disabled={saving}
                                    className="rounded-lg px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-slate-200 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {saving && (
                                        <Loader2 size={16} className="animate-spin" />
                                    )}
                                    {saving
                                        ? "Saving..."
                                        : editingSection
                                            ? "Update Section"
                                            : "Save Section"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

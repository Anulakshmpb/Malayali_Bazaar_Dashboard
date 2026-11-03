
import React, { useEffect, useMemo, useState } from "react";
import {
    Plus,
    Edit,
    Trash2,
    X,
    Bell,
    Search,
    CheckCircle2,
    Copy
} from "lucide-react";

import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp,
    setDoc
} from "firebase/firestore";
import { toast } from "sonner";
import { db } from "../../Config/Firebase";

const NOTIFICATION_TYPES = [
    {
        category: "Orders",
        items: [
            {
                id: "ORDER_PLACED",
                label: "Order Placed",
                variables: ["{{customer_name}}", "{{order_id}}", "{{total_amount}}"]
            },
            {
                id: "ORDER_CONFIRMED",
                label: "Order Confirmed",
                variables: ["{{customer_name}}", "{{order_id}}"]
            },
            {
                id: "ORDER_PROCESSING",
                label: "Order Processing",
                variables: ["{{customer_name}}", "{{order_id}}"]
            },
            {
                id: "ORDER_DISPATCHED",
                label: "Order Dispatched",
                variables: ["{{customer_name}}", "{{order_id}}", "{{tracking_number}}"]
            },
            {
                id: "ORDER_OUT_FOR_DELIVERY",
                label: "Out for Delivery",
                variables: ["{{customer_name}}", "{{order_id}}"]
            },
            {
                id: "ORDER_DELIVERED",
                label: "Order Delivered",
                variables: ["{{customer_name}}", "{{order_id}}"]
            },
            {
                id: "ORDER_CANCELLED",
                label: "Order Cancelled",
                variables: ["{{customer_name}}", "{{order_id}}", "{{cancellation_reason}}"]
            }
        ]
    },
    {
        category: "Payments",
        items: [
            {
                id: "PAYMENT_SUCCESSFUL",
                label: "Payment Successful",
                variables: ["{{customer_name}}", "{{order_id}}", "{{amount}}", "{{transaction_id}}"]
            },
            {
                id: "PAYMENT_FAILED",
                label: "Payment Failed",
                variables: ["{{customer_name}}", "{{order_id}}", "{{amount}}"]
            },
            {
                id: "PAYMENT_REMINDER",
                label: "Payment Reminder",
                variables: ["{{customer_name}}", "{{order_id}}", "{{amount}}", "{{due_date}}"]
            }
        ]
    },
    {
        category: "Customer & General",
        items: [
            {
                id: "WELCOME_MESSAGE",
                label: "Welcome Message",
                variables: ["{{customer_name}}"]
            },
            {
                id: "GENERAL",
                label: "General Announcement",
                variables: ["{{customer_name}}"]
            }
        ]
    }
];

const EMPTY_FORM = {
    type: "ORDER_PLACED",
    title: "",
    message: "",
    status: "Active",
    targetAudience: "Customers"
};

const getNotificationType = (type) => {
    return NOTIFICATION_TYPES
        .flatMap((category) => category.items)
        .find((item) => item.id === type);
};

export default function NotificationTemplates() {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState("All");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState(null);
    const [formData, setFormData] = useState(EMPTY_FORM);

    const fetchTemplates = async () => {
        setLoading(true);

        try {
            const snapshot = await getDocs(
                collection(db, "notification_templates")
            );

            const data = snapshot.docs.map((item) => ({
                id: item.id,
                ...item.data()
            }));

            setTemplates(
                data.sort((a, b) =>
                    (a.title || "").localeCompare(b.title || "")
                )
            );
        } catch (error) {
            console.error("Fetch notification templates:", error);
            toast.error("Unable to load notification templates.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplates();
    }, []);

    const filteredTemplates = useMemo(() => {
        return templates.filter((item) => {
            const search = searchQuery.toLowerCase();

            const matchesSearch =
                (item.title || "").toLowerCase().includes(search) ||
                (item.id || "").toLowerCase().includes(search) ||
                (item.message || "").toLowerCase().includes(search);

            const matchesStatus =
                activeFilter === "All" ||
                item.status === activeFilter;

            return matchesSearch && matchesStatus;
        });
    }, [templates, searchQuery, activeFilter]);

    const openAddModal = () => {
        setCurrentTemplate(null);
        setFormData({ ...EMPTY_FORM });
        setIsModalOpen(true);
    };

    const openEditModal = (template) => {
        setCurrentTemplate(template);

        setFormData({
            type: template.id,
            title: template.title || "",
            message: template.message || "",
            status: template.status || "Active",
            targetAudience: template.targetAudience || "Customers"
        });

        setIsModalOpen(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!formData.title.trim() || !formData.message.trim()) {
            toast.error("Please enter the notification title and message.");
            return;
        }

        setSaving(true);

        try {
            const payload = {
                title: formData.title.trim(),
                message: formData.message.trim(),
                status: formData.status,
                targetAudience: formData.targetAudience,
                updatedAt: serverTimestamp()
            };

            if (!currentTemplate) {
                payload.createdAt = serverTimestamp();
            }

            await setDoc(
                doc(db, "notification_templates", formData.type),
                payload,
                { merge: true }
            );

            toast.success(
                currentTemplate
                    ? "Notification template updated."
                    : "Notification template created."
            );

            setIsModalOpen(false);
            setCurrentTemplate(null);

            await fetchTemplates();
        } catch (error) {
            console.error("Save notification template:", error);
            toast.error("Unable to save notification template.");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (template) => {
        const confirmed = window.confirm(
            `Delete the "${template.title}" notification template?`
        );

        if (!confirmed) return;

        try {
            await deleteDoc(
                doc(db, "notification_templates", template.id)
            );

            setTemplates((previous) =>
                previous.filter((item) => item.id !== template.id)
            );

            toast.success("Notification template deleted.");
        } catch (error) {
            console.error("Delete notification template:", error);
            toast.error("Unable to delete notification template.");
        }
    };

    const handleCopyVariable = async (variable) => {
        try {
            await navigator.clipboard.writeText(variable);
            toast.success(`${variable} copied.`);
        } catch {
            toast.error("Unable to copy variable.");
        }
    };

    const selectedType = getNotificationType(formData.type);

    return (
        <div className="min-h-screen bg-white pb-10"><div className="mx-auto max-w-6xl space-y-6 pt-4">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                        Notification Templates
                    </h1>
                    <p className="mt-1 text-sm text-secondary/80">
                        Create and manage reusable customer notification messages.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAddModal}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary"
                >
                    <Plus size={17} />
                    Add Template
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col gap-3 rounded-2xl border border-tertiary/60 bg-white p-4 sm:flex-row">
                <div className="relative flex-1">
                    <Search
                        size={17}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
                    />

                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search notification templates..."
                        className="w-full rounded-xl border border-tertiary/60 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                </div>

                <select
                    value={activeFilter}
                    onChange={(event) => setActiveFilter(event.target.value)}
                    className="rounded-xl border border-tertiary/60 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary"
                >
                    <option value="All">All Status</option>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                </select>
            </div>

            {/* Template Table */}
            <div className="overflow-hidden rounded-2xl border border-tertiary/60 bg-white">
                <div className="flex items-center justify-between border-b border-tertiary/30 px-5 py-4">
                    <div>
                        <h2 className="font-semibold text-gray-900">
                            Saved Templates
                        </h2>
                        <p className="mt-1 text-xs text-secondary/80">
                            {filteredTemplates.length} templates found
                        </p>
                    </div>
                    <Bell size={19} className="text-secondary/60" />
                </div>

                {loading ? (
                    <div className="flex justify-center py-16">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-tertiary/60 border-t-primary" />
                    </div>
                ) : filteredTemplates.length === 0 ? (
                    <div className="py-16 text-center">
                        <Bell className="mx-auto mb-3 text-slate-300" size={30} />
                        <p className="font-medium text-gray-900">
                            No notification templates found
                        </p>
                        <p className="mt-1 text-sm text-secondary/60">
                            Add a template to get started.
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[750px] text-left">
                            <thead className="bg-slate-50">
                                <tr className="text-[11px] font-semibold uppercase tracking-wider text-secondary/80">
                                    <th className="px-6 py-4">Template Details</th>
                                    <th className="px-6 py-4">Audience</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {filteredTemplates.map((template) => (
                                    <tr
                                        key={template.id}
                                        className="transition hover:bg-slate-50"
                                    >
                                        <td className="px-6 py-4">
                                            <span className="inline-flex rounded-md bg-primary/10 px-2 py-1 text-[10px] font-bold tracking-wide text-primary">
                                                {template.id}
                                            </span>

                                            <p className="mt-2 text-sm font-semibold text-gray-900">
                                                {template.title}
                                            </p>

                                            <p className="mt-1 max-w-md truncate text-xs text-secondary/80">
                                                {template.message}
                                            </p>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-secondary">
                                                {template.targetAudience || "Customers"}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
                                                template.status === "Active"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-slate-100 text-secondary/80"
                                            }`}>
                                                <span className={`h-1.5 w-1.5 rounded-full ${
                                                    template.status === "Active"
                                                        ? "bg-emerald-500"
                                                        : "bg-slate-400"
                                                }`} />
                                                {template.status}
                                            </span>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => openEditModal(template)}
                                                    title="Edit template"
                                                    className="rounded-lg border border-tertiary/60 p-2 text-secondary/80 transition hover:border-primary/30 hover:text-primary"
                                                >
                                                    <Edit size={16} />
                                                </button>

                                                <button
                                                    type="button"
                                                    onClick={() => handleDelete(template)}
                                                    title="Delete template"
                                                    className="rounded-lg border border-tertiary/60 p-2 text-secondary/80 transition hover:border-red-200 hover:text-red-600"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[150] flex items-start justify-center overflow-y-auto bg-gray-900/40 p-4 backdrop-blur-sm">
                    <div className="my-6 w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-tertiary/30 px-6 py-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {currentTemplate ? "Edit Template" : "Create Template"}
                                </h3>
                                <p className="mt-1 text-xs text-secondary/80">
                                    Configure the notification message and its status.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-lg p-2 text-secondary/60 hover:bg-slate-100 hover:text-gray-900"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5 p-6">
                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-secondary">
                                    Notification Type
                                </label>

                                <select
                                    required
                                    value={formData.type}
                                    disabled={!!currentTemplate}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            type: event.target.value
                                        }))
                                    }
                                    className="w-full rounded-xl border border-tertiary/60 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {NOTIFICATION_TYPES.map((category) => (
                                        <optgroup
                                            key={category.category}
                                            label={category.category}
                                        >
                                            {category.items.map((item) => (
                                                <option key={item.id} value={item.id}>
                                                    {item.label}
                                                </option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-secondary">
                                    Notification Title
                                </label>

                                <input
                                    required
                                    maxLength={100}
                                    value={formData.title}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            title: event.target.value
                                        }))
                                    }
                                    placeholder="Example: Your order has been dispatched"
                                    className="w-full rounded-xl border border-tertiary/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                                />
                            </div>

                            <div>
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-secondary">
                                    Notification Message
                                </label>

                                <textarea
                                    required
                                    maxLength={500}
                                    rows={4}
                                    value={formData.message}
                                    onChange={(event) =>
                                        setFormData((previous) => ({
                                            ...previous,
                                            message: event.target.value
                                        }))
                                    }
                                    placeholder="Write your notification message..."
                                    className="w-full resize-none rounded-xl border border-tertiary/60 px-4 py-3 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                                />

                                <p className="mt-1 text-right text-[11px] text-secondary/60">
                                    {formData.message.length}/500
                                </p>

                                {selectedType?.variables?.length > 0 && (
                                    <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
                                        <p className="mb-3 text-[11px] font-bold uppercase tracking-wide text-primary">
                                            Available Variables — Click to Copy
                                        </p>

                                        <div className="flex flex-wrap gap-2">
                                            {selectedType.variables.map((variable) => (
                                                <button
                                                    key={variable}
                                                    type="button"
                                                    onClick={() => handleCopyVariable(variable)}
                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-white px-2.5 py-1.5 font-mono text-xs text-primary transition hover:border-primary"
                                                >
                                                    <Copy size={12} />
                                                    {variable}
                                                </button>
                                            ))}
                                        </div>

                                        <p className="mt-3 text-[11px] text-primary">
                                            These placeholders must be replaced with actual customer/order values before sending.
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-secondary">
                                        Target Audience
                                    </label>

                                    <select
                                        value={formData.targetAudience}
                                        onChange={(event) =>
                                            setFormData((previous) => ({
                                                ...previous,
                                                targetAudience: event.target.value
                                            }))
                                        }
                                        className="w-full rounded-xl border border-tertiary/60 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                                    >
                                        <option value="Customers">Customers</option>
                                        <option value="Admins">Admins</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-secondary">
                                        Status
                                    </label>

                                    <select
                                        value={formData.status}
                                        onChange={(event) =>
                                            setFormData((previous) => ({
                                                ...previous,
                                                status: event.target.value
                                            }))
                                        }
                                        className="w-full rounded-xl border border-tertiary/60 bg-white px-4 py-3 text-sm outline-none focus:border-primary"
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 border-t border-tertiary/30 pt-5">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-secondary transition hover:bg-slate-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <CheckCircle2 size={16} />
                                    {saving ? "Saving..." : "Save Template"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div></div>
    );
}

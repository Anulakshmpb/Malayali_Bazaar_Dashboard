import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    FaTruck,
    FaPlus,
    FaSearch,
    FaEdit,
    FaTimes,
    FaCheckCircle,
    FaTimesCircle,
    FaShippingFast,
    FaEuroSign,
    FaBox,
    FaSave,
    FaToggleOn,
    FaToggleOff,
    FaGift,
    FaPercentage,
} from "react-icons/fa";
import CommonTable from "../../Shared/Pages/CommonTable";
import { useToast } from "../../Shared/hooks/ToastContext";
import { db } from "../../Config/Firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const DEFAULTS = {
    normal: {
        id: "normal",
        name: "Normal Delivery",
        subtitle: "Within 5 km",
        delivery_type: "normal",
        price_increase_percentage: 0,
        delivery_charge: 1.99,
        minimum_order_amount: 20,
        status: true,
    },
    monthly_van: {
        id: "monthly_van",
        name: "Monthly Van Delivery",
        subtitle: "Monthly route",
        delivery_type: "monthly_van",
        price_increase_percentage: 10,
        delivery_charge: 3.99,
        minimum_order_amount: 50,
        status: true,
    },
    courier: {
        id: "courier",
        name: "Courier Delivery",
        subtitle: "Courier dispatch",
        delivery_type: "courier",
        price_increase_percentage: 20,
        delivery_charge: 4.99,
        minimum_order_amount: 35,
        status: true,
    },
};

const emptyForm = {
    delivery_type: "normal",
    price_increase_percentage: "0",
    delivery_charge: "1.99",
    minimum_order_amount: "20",
    status: true,
};

const DeliveryCharges = () => {
    const [charges, setCharges] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const fetchCharges = useCallback(async () => {
        setLoading(true);
        try {
            const [normalSnap, postalSnap] = await Promise.all([
                getDoc(doc(db, "delivery_settings", "normal")),
                getDoc(doc(db, "delivery_settings", "postal")),
            ]);

            const normalData = normalSnap.exists() ? normalSnap.data() : {};
            const postalData = postalSnap.exists() ? postalSnap.data() : {};
            const vanData = postalData.monthly_van || {};
            const courierData = postalData.courier || {};

            setCharges([
                {
                    ...DEFAULTS.normal,
                    price_increase_percentage: Number(normalData.price_increase_percentage ?? DEFAULTS.normal.price_increase_percentage),
                    delivery_charge: Number(normalData.delivery_charge ?? DEFAULTS.normal.delivery_charge),
                    minimum_order_amount: Number(normalData.minimum_order_amount ?? normalData.free_delivery_minimum ?? DEFAULTS.normal.minimum_order_amount),
                    status: normalData.status !== undefined ? Boolean(normalData.status) : DEFAULTS.normal.status,
                },
                {
                    ...DEFAULTS.monthly_van,
                    price_increase_percentage: Number(vanData.price_increase_percentage ?? DEFAULTS.monthly_van.price_increase_percentage),
                    delivery_charge: Number(vanData.delivery_charge ?? DEFAULTS.monthly_van.delivery_charge),
                    minimum_order_amount: Number(vanData.minimum_order_amount ?? vanData.free_delivery_minimum ?? DEFAULTS.monthly_van.minimum_order_amount),
                    status: vanData.status !== undefined ? Boolean(vanData.status) : DEFAULTS.monthly_van.status,
                },
                {
                    ...DEFAULTS.courier,
                    price_increase_percentage: Number(courierData.price_increase_percentage ?? DEFAULTS.courier.price_increase_percentage),
                    delivery_charge: Number(courierData.delivery_charge ?? DEFAULTS.courier.delivery_charge),
                    minimum_order_amount: Number(courierData.minimum_order_amount ?? courierData.free_delivery_minimum ?? DEFAULTS.courier.minimum_order_amount),
                    status: courierData.status !== undefined ? Boolean(courierData.status) : DEFAULTS.courier.status,
                },
            ]);
        } catch (err) {
            console.error("Failed to load delivery settings:", err);
            showToast("Failed to load delivery charges.", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCharges();
    }, [fetchCharges]);

    const filteredCharges = useMemo(() => {
        return charges.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                item.delivery_type.toLowerCase().includes(searchTerm.trim().toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && item.status) ||
                (statusFilter === "inactive" && !item.status);

            return matchesSearch && matchesStatus;
        });
    }, [charges, searchTerm, statusFilter]);

    const activeCount = charges.filter((item) => item.status).length;
    const inactiveCount = charges.length - activeCount;

    const openAddModal = () => {
        setEditingType(null);
        setFormData({ ...emptyForm });
        setErrors({});
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingType(item.delivery_type);
        setFormData({
            delivery_type: item.delivery_type,
            price_increase_percentage: String(item.price_increase_percentage),
            delivery_charge: String(item.delivery_charge),
            minimum_order_amount: String(item.minimum_order_amount),
            status: item.status,
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingType(null);
        setFormData({ ...emptyForm });
        setErrors({});
    };

    const handleTypeSelect = (type) => {
        const preset = DEFAULTS[type];
        if (preset && !editingType) {
            setFormData({
                delivery_type: type,
                price_increase_percentage: String(preset.price_increase_percentage),
                delivery_charge: String(preset.delivery_charge),
                minimum_order_amount: String(preset.minimum_order_amount),
                status: true,
            });
        } else {
            setFormData((prev) => ({ ...prev, delivery_type: type }));
        }
        setErrors((prev) => ({ ...prev, delivery_type: "" }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const errs = {};
        if (!["normal", "monthly_van", "courier"].includes(formData.delivery_type)) {
            errs.delivery_type = "Select a valid delivery type.";
        }
        if (formData.price_increase_percentage === "" || Number(formData.price_increase_percentage) < 0) {
            errs.price_increase_percentage = "Enter a valid percentage (0 or more).";
        }
        if (formData.delivery_charge === "" || Number(formData.delivery_charge) < 0) {
            errs.delivery_charge = "Enter a valid delivery charge (0 or more).";
        }
        if (formData.minimum_order_amount === "" || Number(formData.minimum_order_amount) < 0) {
            errs.minimum_order_amount = "Enter a valid minimum order amount (0 or more).";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            const payload = {
                delivery_type: formData.delivery_type,
                price_increase_percentage: Number(formData.price_increase_percentage),
                delivery_charge: Number(formData.delivery_charge),
                minimum_order_amount: Number(formData.minimum_order_amount),
                status: Boolean(formData.status),
            };

            if (formData.delivery_type === "normal") {
                await setDoc(doc(db, "delivery_settings", "normal"), payload, { merge: true });
            } else {
                await setDoc(
                    doc(db, "delivery_settings", "postal"),
                    { [formData.delivery_type]: payload },
                    { merge: true }
                );
            }

            showToast("Delivery settings saved successfully.", "success");
            closeModal();
            fetchCharges();
        } catch (err) {
            console.error("Save failed:", err);
            showToast("Failed to save delivery settings.", "error");
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (item) => {
        const nextStatus = !item.status;
        setCharges((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, status: nextStatus } : c))
        );

        try {
            if (item.id === "normal") {
                await setDoc(doc(db, "delivery_settings", "normal"), { status: nextStatus }, { merge: true });
            } else {
                await setDoc(
                    doc(db, "delivery_settings", "postal"),
                    { [item.id]: { status: nextStatus } },
                    { merge: true }
                );
            }
            showToast(`${item.name} status updated.`, "success");
        } catch (err) {
            console.error("Status update error:", err);
            showToast("Failed to update status.", "error");
            fetchCharges();
        }
    };

    const formatAmount = (amount) => `€${Number(amount || 0).toFixed(2)}`;

    return (
        <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Delivery Charges
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Configure delivery pricing, free shipping thresholds, and product price adjustments.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    >
                        <FaPlus />
                        Add Delivery Charge
                    </button>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Total Delivery Types"
                        value={charges.length}
                        description="Configured options"
                        icon={<FaTruck />}
                    />
                    <SummaryCard
                        title="Active Types"
                        value={activeCount}
                        description="Currently enabled"
                        icon={<FaCheckCircle />}
                    />
                    <SummaryCard
                        title="Inactive Types"
                        value={inactiveCount}
                        description="Currently disabled"
                        icon={<FaTimesCircle />}
                    />
                    <SummaryCard
                        title="Currency"
                        value="EUR (€)"
                        description="7% VAT inclusive"
                        icon={<FaEuroSign />}
                    />
                </div>

                {/* Main Content Table */}
                <div className="overflow-hidden rounded-2xl border border-tertiary/30 bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">
                                Delivery Configuration
                            </h2>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row">
                            <div className="relative">
                                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search delivery type..."
                                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-64"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                aria-label="Filter by status"
                            >
                                <option value="all">All Statuses</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <CommonTable
                        title="Delivery Charges"
                        subtitle={`Showing ${filteredCharges.length} of ${charges.length} delivery types`}
                        loading={loading}
                        columns={[
                            {
                                key: "name",
                                header: "Delivery Type",
                                sortable: true,
                                render: (item) => (
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            {item.delivery_type === "normal" ? (
                                                <FaTruck />
                                            ) : item.delivery_type === "monthly_van" ? (
                                                <FaShippingFast />
                                            ) : (
                                                <FaBox />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900">{item.name}</p>
                                            <p className="mt-0.5 text-xs text-gray-400">{item.subtitle}</p>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: "price_increase_percentage",
                                header: "Price Adjustment",
                                sortable: true,
                                render: (item) => (
                                    <span className="font-semibold text-gray-800">
                                        {item.price_increase_percentage > 0
                                            ? `+${item.price_increase_percentage}%`
                                            : "0%"}
                                    </span>
                                ),
                            },
                            {
                                key: "delivery_charge",
                                header: "Delivery Charge",
                                sortable: true,
                                render: (item) => formatAmount(item.delivery_charge),
                            },
                            {
                                key: "minimum_order_amount",
                                header: "Free Delivery Minimum",
                                sortable: true,
                                render: (item) => (
                                    <span className="font-semibold text-gray-900">
                                        {formatAmount(item.minimum_order_amount)}
                                    </span>
                                ),
                            },
                            {
                                key: "pricing_rule",
                                header: "Pricing Rule",
                                render: (item) => (
                                    <span className="text-xs text-gray-500">
                                        &lt; {formatAmount(item.minimum_order_amount)}: {formatAmount(item.delivery_charge)} | &ge; {formatAmount(item.minimum_order_amount)}: Free
                                    </span>
                                ),
                            },
                            {
                                key: "status",
                                header: "Status",
                                sortable: true,
                                render: (item) => (
                                    <button
                                        type="button"
                                        onClick={() => toggleStatus(item)}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                            item.status
                                                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 rounded-full ${
                                                item.status ? "bg-emerald-500" : "bg-gray-400"
                                            }`}
                                        />
                                        {item.status ? "Active" : "Inactive"}
                                    </button>
                                ),
                            },
                        ]}
                        data={filteredCharges}
                        total={filteredCharges.length}
                        clientSide
                        showSearch={false}
                        showRowNumbers={false}
                        rowKey="id"
                        emptyMessage="No delivery charges found"
                        emptyDescription="Try another search or configure delivery settings."
                        actions={(item) => (
                            <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                title="Edit delivery charge"
                                className="rounded-lg p-2 text-gray-500 transition hover:bg-primary/5 hover:text-primary"
                            >
                                <FaEdit />
                            </button>
                        )}
                    />
                </div>

                {/* Add / Edit Modal */}
                {isModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-sm"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) closeModal();
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        {editingType !== null ? <FaEdit /> : <FaTruck />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {editingType !== null ? "Edit Delivery Charge" : "Add Delivery Charge"}
                                        </h2>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    aria-label="Close modal"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} noValidate>
                                <div className="space-y-5 p-6">
                                    {/* Delivery Type */}
                                    <div>
                                        <label
                                            htmlFor="delivery_type"
                                            className="mb-2 block text-sm font-semibold text-gray-700"
                                        >
                                            Delivery Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="delivery_type"
                                            name="delivery_type"
                                            value={formData.delivery_type}
                                            disabled={editingType !== null}
                                            onChange={(e) => handleTypeSelect(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-gray-50 disabled:text-gray-500"
                                        >
                                            <option value="normal">Normal Delivery (Within 5 km)</option>
                                            <option value="monthly_van">Monthly Van Delivery</option>
                                            <option value="courier">Courier Delivery</option>
                                        </select>
                                        {errors.delivery_type && (
                                            <p className="mt-1.5 text-xs text-red-500">{errors.delivery_type}</p>
                                        )}
                                    </div>

                                    {/* Price Increase Percentage */}
                                    <div>
                                        <label
                                            htmlFor="price_increase_percentage"
                                            className="mb-2 block text-sm font-semibold text-gray-700"
                                        >
                                            Product Price Increase (%) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaPercentage className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                                            <input
                                                id="price_increase_percentage"
                                                name="price_increase_percentage"
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={formData.price_increase_percentage}
                                                onChange={handleInputChange}
                                                placeholder="Enter price increase percentage"
                                                className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${
                                                    errors.price_increase_percentage
                                                        ? "border-red-400 focus:border-red-400"
                                                        : "border-gray-200 focus:border-primary"
                                                }`}
                                            />
                                        </div>
                                        {errors.price_increase_percentage && (
                                            <p className="mt-1.5 text-xs text-red-500">{errors.price_increase_percentage}</p>
                                        )}
                                    </div>

                                    {/* Delivery Charge */}
                                    <div>
                                        <label
                                            htmlFor="delivery_charge"
                                            className="mb-2 block text-sm font-semibold text-gray-700"
                                        >
                                            Delivery Charge (€) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaEuroSign className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                                            <input
                                                id="delivery_charge"
                                                name="delivery_charge"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.delivery_charge}
                                                onChange={handleInputChange}
                                                placeholder="Enter delivery charge"
                                                className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${
                                                    errors.delivery_charge
                                                        ? "border-red-400 focus:border-red-400"
                                                        : "border-gray-200 focus:border-primary"
                                                }`}
                                            />
                                        </div>
                                        {errors.delivery_charge && (
                                            <p className="mt-1.5 text-xs text-red-500">{errors.delivery_charge}</p>
                                        )}
                                    </div>

                                    {/* Minimum Order Amount */}
                                    <div>
                                        <label
                                            htmlFor="minimum_order_amount"
                                            className="mb-2 block text-sm font-semibold text-gray-700"
                                        >
                                            Free Delivery Minimum (€) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaGift className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                                            <input
                                                id="minimum_order_amount"
                                                name="minimum_order_amount"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.minimum_order_amount}
                                                onChange={handleInputChange}
                                                placeholder="Enter minimum order amount"
                                                className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${
                                                    errors.minimum_order_amount
                                                        ? "border-red-400 focus:border-red-400"
                                                        : "border-gray-200 focus:border-primary"
                                                }`}
                                            />
                                        </div>
                                        {errors.minimum_order_amount && (
                                            <p className="mt-1.5 text-xs text-red-500">{errors.minimum_order_amount}</p>
                                        )}
                                    </div>

                                    {/* Status Switch */}
                                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                                                {formData.status ? <FaToggleOn /> : <FaToggleOff />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    Delivery Status
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {formData.status
                                                        ? "This delivery type is active."
                                                        : "This delivery type is inactive."}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={formData.status}
                                            aria-label="Delivery status"
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    status: !prev.status,
                                                }))
                                            }
                                            className={`relative h-6 w-11 rounded-full transition ${
                                                formData.status ? "bg-primary" : "bg-gray-300"
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                                                    formData.status ? "left-[22px]" : "left-0.5"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={saving}
                                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                                    >
                                        <FaSave />
                                        {saving ? "Saving..." : editingType !== null ? "Save Changes" : "Add Delivery Charge"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const SummaryCard = ({ title, value, description, icon }) => (
    <div className="rounded-2xl border border-tertiary/30 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                    {value}
                </p>
                <p className="mt-1 text-xs text-gray-400">{description}</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
            </div>
        </div>
    </div>
);

export default DeliveryCharges;

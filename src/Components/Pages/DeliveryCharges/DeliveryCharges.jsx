
import React, { useEffect, useMemo, useState } from "react";
import {
    FaTruck,
    FaPlus,
    FaSearch,
    FaEdit,
    FaTrash,
    FaTimes,
    FaCheckCircle,
    FaTimesCircle,
    FaShippingFast,
    FaRupeeSign,
    FaGift,
    FaBox,
    FaSave,
    FaToggleOn,
    FaToggleOff,
} from "react-icons/fa";
import CommonTable from "../../Shared/Pages/CommonTable";
import { useToast } from "../../Shared/hooks/ToastContext";
import { getFunctions, httpsCallable } from "firebase/functions";
import { app } from "../../Config/Firebase";

const emptyForm = {
    delivery_type: "normal",
    delivery_charge: "",
    free_delivery_minimum: "",
    status: true,
};

const DeliveryCharges = () => {
    const functions = useMemo(() => getFunctions(app, 'europe-west1'), []);
    const manageDeliveryCharge = useMemo(() => httpsCallable(functions, 'manageDeliveryCharge'), [functions]);
    const [deliveryCharges, setDeliveryCharges] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [deleteId, setDeleteId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const { showToast } = useToast();

    const loadDeliveryCharges = async () => {
        setLoading(true);
        try {
                const response = await manageDeliveryCharge({ action: 'list' });
                if (!response.data?.success) {
                    throw new Error(response.data?.message || 'Unable to load delivery charges.');
                }
                setDeliveryCharges((response.data.data || []).map((item) => ({
                    ...item,
                    id: item.id || item.deliveryChargeId,
                    delivery_type: item.deliveryType ?? item.delivery_type,
                    delivery_charge: item.deliveryCharge ?? item.delivery_charge,
                    free_delivery_minimum: item.freeDeliveryMinimum ?? item.free_delivery_minimum,
                })));
            } catch (error) {
                console.error('Failed to load delivery charges:', error);
                showToast(error.message || 'Unable to load delivery charges.', 'error');
            } finally {
                setLoading(false);
            }
        };
    
    useEffect(() => {
        loadDeliveryCharges();
    }, []);
    
    const filteredCharges = useMemo(() => {
        return deliveryCharges.filter((item) => {
            const matchesSearch = item.delivery_type
                .toLowerCase()
                .includes(searchTerm.trim().toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && item.status) ||
                (statusFilter === "inactive" && !item.status);

            return matchesSearch && matchesStatus;
        });
    }, [deliveryCharges, searchTerm, statusFilter]);

    const activeCount = deliveryCharges.filter(
        (item) => item.status
    ).length;

    const inactiveCount = deliveryCharges.length - activeCount;

    const openAddModal = () => {
        setEditingId(null);
        setFormData({ ...emptyForm });
        setErrors({});
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingId(item.id);
        setFormData({
            delivery_type: item.delivery_type,
            delivery_charge: String(item.delivery_charge),
            free_delivery_minimum: String(item.free_delivery_minimum),
            status: item.status,
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData({ ...emptyForm });
        setErrors({});
    };

    const handleInputChange = (event) => {
        const { name, value } = event.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value,
        }));

        setErrors((previous) => ({
            ...previous,
            [name]: "",
        }));
    };

    const validateForm = () => {
        const nextErrors = {};

        if (!["postal", "normal"].includes(formData.delivery_type)) {
            nextErrors.delivery_type = "Please select a delivery type.";
        }

        if (
            formData.delivery_charge === "" ||
            !Number.isFinite(Number(formData.delivery_charge)) ||
            Number(formData.delivery_charge) < 0
        ) {
            nextErrors.delivery_charge =
                "Enter a valid delivery charge (0 or more).";
        }

        if (
            formData.free_delivery_minimum === "" ||
            !Number.isFinite(Number(formData.free_delivery_minimum)) ||
            Number(formData.free_delivery_minimum) < 0
        ) {
            nextErrors.free_delivery_minimum =
                "Enter a valid minimum amount (0 or more).";
        }

        const duplicateType = deliveryCharges.some(
            (item) =>
                item.delivery_type === formData.delivery_type &&
                item.id !== editingId
        );

        if (duplicateType) {
            nextErrors.delivery_type =
                "This delivery type already exists.";
        }

        setErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

     const handleSubmit = async (event) => {
            event.preventDefault();
            if (!validateForm()) return;

            setSaving(true);
            try {
                const response = await manageDeliveryCharge({
                    action: editingId ? 'update' : 'add',
                    fields: {
                        ...(editingId ? { deliveryChargeId: editingId } : {}),
                        deliveryType: formData.delivery_type,
                        deliveryCharge: Number(formData.delivery_charge),
                        freeDeliveryMinimum: Number(formData.free_delivery_minimum),
                        status: Boolean(formData.status),
                    },
                });
                if (!response.data?.success) {
                    throw new Error(response.data?.message || 'Unable to save delivery charge.');
                }
                showToast(response.data.message || 'Delivery charge saved successfully.', 'success');
                closeModal();
                await loadDeliveryCharges();
            } catch (error) {
                console.error('Failed to save delivery charge:', error);
                showToast(error.message || 'Unable to save delivery charge.', 'error');
            } finally {
                setSaving(false);
            }
        };
    
        const handleDelete = async (deliveryCharge) => {
            if (!window.confirm(`Are you sure you want to delete ${deliveryCharge.delivery_type}-${deliveryCharge.delivery_charge}?`)) return;
            try {
                const response = await manageDeliveryCharge({
                    action: 'delete',
                    fields: { deliveryChargeId: deliveryCharge.id },
                });
                if (!response.data?.success) {
                    throw new Error(response.data?.message || 'Unable to delete delivery charge.');
                }
                showToast(response.data.message || 'Delivery charge deleted successfully.', 'success');
                await loadDeliveryCharges();
            } catch (error) {
                console.error('Failed to delete delivery charge:', error);
                showToast(error.message || 'Unable to delete delivery charge.', 'error');
            }
        };

    const toggleStatus = (id) => {
        setDeliveryCharges((previous) =>
            previous.map((item) =>
                item.id === id ? { ...item, status: !item.status } : item
            )
        );
    };

    const formatType = (type) =>
        type.charAt(0).toUpperCase() + type.slice(1);

    const formatAmount = (amount) =>
        `₹${Number(amount).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    return (
        <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Page Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-4">
                    
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                                Delivery Charges
                            </h1>
                        </div>
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
                        value={deliveryCharges.length}
                        description="Configured delivery options"
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
                </div>

                {/* Main Content */}
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
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Search delivery type..."
                                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-64"
                                />
                            </div>

                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
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
                        subtitle={`Showing ${filteredCharges.length} of ${deliveryCharges.length} delivery types`}
                        columns={[
                            {
                                key: "delivery_type",
                                header: "Delivery Type",
                                sortable: true,
                                render: (item) => (
                                    <div className="flex items-center gap-3">
                                        {/* <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                            {item.delivery_type === "postal" ? <FaShippingFast /> : <FaBox />}
                                        </div> */}
                                        <div>
                                            <p className="font-semibold text-gray-900">{formatType(item.delivery_type)} Delivery</p>
                                            <p className="mt-0.5 text-xs text-gray-400">
                                                {item.delivery_type === "postal" ? "Postal shipping" : "Standard delivery"}
                                            </p>
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: "delivery_charge",
                                header: "Delivery Charge",
                                sortable: true,
                                render: (item) => formatAmount(item.delivery_charge),
                            },
                            {
                                key: "free_delivery_minimum",
                                header: "Free Delivery Minimum",
                                sortable: true,
                                render: (item) => (
                                    <span className="flex items-center gap-2">
                                        {/* <FaGift className="text-secondary" /> */}
                                        {formatAmount(item.free_delivery_minimum)}
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
                                        onClick={() => toggleStatus(item.id)}
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${item.status
                                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                            }`}
                                        aria-label={`Set ${item.delivery_type} delivery ${item.status ? "inactive" : "active"}`}
                                    >
                                        <span className={`h-1.5 w-1.5 rounded-full ${item.status ? "bg-emerald-500" : "bg-gray-400"}`} />
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
                        emptyDescription="Try another search or add a delivery type."
                        actions={(item) => (
                            <>
                                <button
                                    type="button"
                                    onClick={() => openEditModal(item)}
                                    title="Edit delivery charge"
                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-primary/5 hover:text-primary"
                                >
                                    <FaEdit />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setDeleteId(item.id)}
                                    title="Delete delivery charge"
                                    className="rounded-lg p-2 text-gray-500 transition hover:bg-red-50 hover:text-red-600"
                                >
                                    <FaTrash />
                                </button>
                            </>
                        )}
                    />
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-sm"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) closeModal();
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delivery-modal-title"
                        className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                    {editingId !== null ? <FaEdit /> : <FaTruck />}
                                </div>
                                <div>
                                    <h2
                                        id="delivery-modal-title"
                                        className="text-lg font-bold text-gray-900"
                                    >
                                        {editingId !== null
                                            ? "Edit Delivery Charge"
                                            : "Add Delivery Charge"}
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
                                        onChange={handleInputChange}
                                        className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${errors.delivery_type
                                                ? "border-red-400 focus:border-red-400"
                                                : "border-gray-200 focus:border-primary"
                                            }`}
                                    >
                                        <option value="normal">Normal Delivery</option>
                                        <option value="postal">Postal Delivery</option>
                                    </select>
                                    {errors.delivery_type && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.delivery_type}
                                        </p>
                                    )}
                                </div>

                                {/* Delivery Charge */}
                                <div>
                                    <label
                                        htmlFor="delivery_charge"
                                        className="mb-2 block text-sm font-semibold text-gray-700"
                                    >
                                        Delivery Charge (₹){" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FaRupeeSign className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                                        <input
                                            id="delivery_charge"
                                            name="delivery_charge"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.delivery_charge}
                                            onChange={handleInputChange}
                                            placeholder="Enter delivery charge"
                                            className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${errors.delivery_charge
                                                    ? "border-red-400 focus:border-red-400"
                                                    : "border-gray-200 focus:border-primary"
                                                }`}
                                        />
                                    </div>
                                    {errors.delivery_charge && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.delivery_charge}
                                        </p>
                                    )}
                                </div>

                                {/* Free Delivery Minimum */}
                                <div>
                                    <label
                                        htmlFor="free_delivery_minimum"
                                        className="mb-2 block text-sm font-semibold text-gray-700"
                                    >
                                        Free Delivery Minimum (₹){" "}
                                        <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <FaGift className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                                        <input
                                            id="free_delivery_minimum"
                                            name="free_delivery_minimum"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={formData.free_delivery_minimum}
                                            onChange={handleInputChange}
                                            placeholder="Enter minimum order amount"
                                            className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${errors.free_delivery_minimum
                                                    ? "border-red-400 focus:border-red-400"
                                                    : "border-gray-200 focus:border-primary"
                                                }`}
                                        />
                                    </div>
                                    {errors.free_delivery_minimum && (
                                        <p className="mt-1.5 text-xs text-red-500">
                                            {errors.free_delivery_minimum}
                                        </p>
                                    )}
                                </div>

                                {/* Status */}
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
                                            setFormData((previous) => ({
                                                ...previous,
                                                status: !previous.status,
                                            }))
                                        }
                                        className={`relative h-6 w-11 rounded-full transition ${formData.status ? "bg-primary" : "bg-gray-300"
                                            }`}
                                    >
                                        <span
                                            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${formData.status ? "left-[22px]" : "left-0.5"
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
                                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
                                >
                                    <FaSave />
                                    {editingId !== null ? "Save Changes" : "Add Delivery Charge"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteId !== null && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-950/50 p-4 backdrop-blur-sm">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-title"
                        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
                    >
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                            <FaTrash className="text-lg" />
                        </div>

                        <h2
                            id="delete-title"
                            className="mt-4 text-center text-lg font-bold text-gray-900"
                        >
                            Delete Delivery Charge?
                        </h2>

                        <p className="mt-2 text-center text-sm leading-6 text-gray-500">
                            Are you sure you want to delete this delivery type? This action
                            only changes the local demo data.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() => setDeleteId(null)}
                                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
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

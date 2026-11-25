import React, { useEffect, useMemo, useState } from 'react';
import {
    User,
    Phone,
    Calendar,
    Clock,
    MapPin,
    ShoppingBag,
    FileText,
    ArrowLeft,
    Mail,
    Truck,
    PackageCheck,
    Printer,
    Save,
    Loader2,
} from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { collection, doc, getDoc, getDocs, limit, query, where } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../../Config/Firebase';
import { useToast } from '../../Shared/hooks/ToastContext';
import { useConfirm } from '../../Shared/ui/ConfirmDialog';
import StatusBadge from '../../Shared/ui/StatusBadge';
import { formatCurrency } from '../../Shared/utils/formatters';

const ORDER_STATUS_OPTIONS = [
    'New',
    'Processing',
    'Dispatch',
    'Out of Delivery',
    'Delivered',
    'Cancelled',
];

const PAYMENT_STATUS_OPTIONS = ['Pending', 'Partial', 'Paid', 'Failed'];

const getOrderDateObj = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (value?.seconds != null) return new Date(value.seconds * 1000);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const formatOrderDateTime = (value) => {
    const date = getOrderDateObj(value);
    if (!date) return { date: '—', time: '—' };
    return {
        date: date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }),
        time: date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        }),
    };
};

export default function ViewOrder() {
    const [activeTab, setActiveTab] = useState('Details');
    const location = useLocation();
    const navigate = useNavigate();
    const { id: paramOrderId } = useParams();
    const { showToast } = useToast();
    const confirm = useConfirm();

    const functions = useMemo(() => getFunctions(app, 'europe-west1'), []);
    const updateOrderStatusCallable = useMemo(
        () => httpsCallable(functions, 'updateOrderStatus'),
        [functions]
    );

    const [order, setOrder] = useState(location.state?.order || null);
    const resolvedLookupId =
        order?.orderDocId ||
        order?.id ||
        location.state?.orderId ||
        paramOrderId ||
        '';
    const [loading, setLoading] = useState(!location.state?.order && !!resolvedLookupId);

    const [selectedStatus, setSelectedStatus] = useState(order?.status || 'New');
    const [selectedPaymentStatus, setSelectedPaymentStatus] = useState(order?.paymentStatus || 'Pending');
    const [paidAmountInput, setPaidAmountInput] = useState(
        order?.paidAmount !== undefined ? String(order.paidAmount) : ''
    );
    const [adminNote, setAdminNote] = useState(order?.adminNote || '');
    const [updating, setUpdating] = useState(false);

    useEffect(() => {
        if (!order) return;
        setSelectedStatus(order.status || 'New');
        setSelectedPaymentStatus(order.paymentStatus || 'Pending');
        setPaidAmountInput(
            order.paidAmount !== undefined && order.paidAmount !== null
                ? String(order.paidAmount)
                : ''
        );
        setAdminNote(order.adminNote || '');
    }, [order]);

    useEffect(() => {
        if (order || !resolvedLookupId) return;
        let cancelled = false;
        setLoading(true);

        const loadOrder = async () => {
            try {
                const directSnap = await getDoc(doc(db, 'orders', resolvedLookupId));
                if (!cancelled && directSnap.exists()) {
                    setOrder({ id: directSnap.id, orderDocId: directSnap.id, ...directSnap.data() });
                    return;
                }
                const byOrderId = await getDocs(
                    query(collection(db, 'orders'), where('orderId', '==', resolvedLookupId), limit(1))
                );
                if (!cancelled && !byOrderId.empty) {
                    const matched = byOrderId.docs[0];
                    setOrder({ id: matched.id, orderDocId: matched.id, ...matched.data() });
                }
            } catch (err) {
                console.error('Failed to fetch order:', err);
                if (!cancelled) {
                    showToast('Failed to load order details.', 'error');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        loadOrder();
        return () => {
            cancelled = true;
        };
    }, [order, resolvedLookupId, showToast]);

    const handleSaveWorkflow = async (e) => {
        e.preventDefault();
        if (!order || updating) return;

        const targetDocId = order.orderDocId || order.id;
        if (!targetDocId) {
            showToast('Order document ID is missing.', 'error');
            return;
        }

        const isCancelling =
            String(order.status || '').toLowerCase() !== 'cancelled' &&
            selectedStatus === 'Cancelled';

        if (isCancelling) {
            const ok = await confirm({
                title: 'Cancel Order & Restore Stock',
                message: `Mark order #${order.orderId || targetDocId} as Cancelled? Item quantities will be restored back to product inventory.`,
                confirmLabel: 'Cancel Order',
                variant: 'danger',
            });
            if (!ok) return;
        }

        setUpdating(true);
        try {
            const payload = {
                orderDocId: targetDocId,
                status: selectedStatus,
                paymentStatus: selectedPaymentStatus,
                note: adminNote.trim(),
            };
            if (paidAmountInput !== '' && Number.isFinite(Number(paidAmountInput))) {
                payload.paidAmount = Number(paidAmountInput);
            }

            const res = await updateOrderStatusCallable(payload);
            if (!res.data?.success) {
                throw new Error(res.data?.message || 'Unable to update order.');
            }

            setOrder((prev) => ({
                ...prev,
                status: res.data.data?.status || selectedStatus,
                paymentStatus: res.data.data?.paymentStatus || selectedPaymentStatus,
                paidAmount: res.data.data?.paidAmount ?? prev?.paidAmount,
                adminNote: adminNote.trim(),
                stockRestored: res.data.data?.stockRestored ?? prev?.stockRestored,
            }));

            showToast(
                res.data.data?.stockRestored && isCancelling
                    ? 'Order cancelled and inventory stock restored.'
                    : 'Order status and payment details updated.',
                'success'
            );
        } catch (err) {
            console.error('Failed to update order status:', err);
            showToast(err.message || 'Failed to update order status.', 'error');
        } finally {
            setUpdating(false);
        }
    };

    const formattedDateTime = formatOrderDateTime(order?.orderDate || order?.createdAt);

    const orderNo = order?.orderId || order?.orderDocId || order?.id || '—';
    const customerName = order?.customerName || order?.deliveryAddress?.fullName || '—';
    const customerPhone = order?.customerPhone || order?.deliveryAddress?.phone || '—';
    const customerEmail = order?.customerEmail || '—';
    const status = order?.status || 'New';
    const paymentStatus = order?.paymentStatus || 'Pending';
    const deliveryType = order?.deliveryType || 'Standard Delivery';
    const notes = order?.notes || '';

    const addressParts = order?.deliveryAddress ? [
        order.deliveryAddress.addressLine,
        order.deliveryAddress.postalCode,
        order.deliveryAddress.city,
        order.deliveryAddress.state,
        order.deliveryAddress.country,
    ].filter(Boolean) : [];
    const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : '—';

    const items = Array.isArray(order?.items) ? order.items : [];
    const subtotal = Number(order?.subtotal ?? order?.grossSubtotal ?? 0);
    const tax = Number(order?.tax ?? order?.taxCollected ?? 0);
    const deliveryCharge = Number(order?.deliveryCharge ?? order?.shipping ?? 0);
    const discount = Number(order?.discount ?? 0);
    const totalAmount = Number(order?.totalAmount ?? order?.total ?? (subtotal + deliveryCharge - discount));

    return (
        <div className="min-h-screen bg-slate-50/40 pb-12 pt-6 page-container">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-4 print:hidden">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/orders')}
                            className="p-2.5 bg-white border border-tertiary/60 rounded-xl text-secondary hover:bg-slate-50 hover:text-gray-900 transition-colors shadow-sm"
                            aria-label="Back to orders"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex flex-wrap items-center gap-2.5">
                                <h1 className="text-2xl sm:text-3xl font-bold font-jakarta text-gray-900">
                                    Order #{orderNo}
                                </h1>
                                {order && <StatusBadge status={status} />}
                                {order && <StatusBadge status={paymentStatus} label={`Payment: ${paymentStatus}`} />}
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                                Placed on {formattedDateTime.date} at {formattedDateTime.time}
                            </p>
                        </div>
                    </div>

                    {order && (
                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 rounded-xl border border-tertiary/50 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:bg-slate-50"
                        >
                            <Printer size={16} className="text-primary" />
                            Print Receipt
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-tertiary/40">
                        <p className="animate-pulse">Loading order details...</p>
                    </div>
                ) : !order ? (
                    <div className="p-12 text-center bg-white rounded-2xl border border-tertiary/40 space-y-3">
                        <p className="text-base font-bold text-gray-900">Order not found</p>
                        <p className="text-sm text-gray-500">
                            The requested order could not be loaded or may have been removed.
                        </p>
                        <button
                            type="button"
                            onClick={() => navigate('/orders')}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-secondary"
                        >
                            Return to Orders
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Order Workflow Controls */}
                        <form
                            onSubmit={handleSaveWorkflow}
                            className="rounded-2xl border border-tertiary/40 bg-white p-5 sm:p-6 shadow-sm print:hidden"
                        >
                            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                                <div>
                                    <h2 className="font-jakarta text-base font-bold text-gray-900">
                                        Order Status & Payment Workflow
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        Update fulfillment stage or payment state. Cancelling automatically restores inventory stock.
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Order Status
                                    </label>
                                    <select
                                        value={selectedStatus}
                                        onChange={(e) => setSelectedStatus(e.target.value)}
                                        disabled={updating}
                                        className="w-full rounded-xl border border-tertiary/50 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                    >
                                        {ORDER_STATUS_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Payment Status
                                    </label>
                                    <select
                                        value={selectedPaymentStatus}
                                        onChange={(e) => setSelectedPaymentStatus(e.target.value)}
                                        disabled={updating}
                                        className="w-full rounded-xl border border-tertiary/50 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                    >
                                        {PAYMENT_STATUS_OPTIONS.map((opt) => (
                                            <option key={opt} value={opt}>
                                                {opt}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Paid Amount (€)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={paidAmountInput}
                                        onChange={(e) => setPaidAmountInput(e.target.value)}
                                        placeholder={totalAmount.toFixed(2)}
                                        disabled={updating}
                                        className="w-full rounded-xl border border-tertiary/50 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        Admin Note
                                    </label>
                                    <input
                                        type="text"
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="Internal dispatch or payment note..."
                                        disabled={updating}
                                        className="w-full rounded-xl border border-tertiary/50 bg-slate-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-secondary disabled:opacity-60"
                                >
                                    {updating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                    {updating ? 'Saving...' : 'Update Order'}
                                </button>
                            </div>
                        </form>

                        {/* Main Content Area */}
                        <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 overflow-hidden">
                            {/* Tabs */}
                            <div className="flex border-b border-tertiary/40 bg-slate-50/50 print:hidden">
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('Details')}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative ${activeTab === 'Details'
                                        ? 'text-primary bg-white'
                                        : 'text-secondary/70 hover:text-gray-900 hover:bg-slate-50'
                                        }`}
                                >
                                    <FileText size={18} />
                                    Order Details
                                    {activeTab === 'Details' && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTab('Products')}
                                    className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative ${activeTab === 'Products'
                                        ? 'text-primary bg-white'
                                        : 'text-secondary/70 hover:text-gray-900 hover:bg-slate-50'
                                        }`}
                                >
                                    <ShoppingBag size={18} />
                                    Product List ({items.length})
                                    {activeTab === 'Products' && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                                    )}
                                </button>
                            </div>

                            {/* Tab Content */}
                            <div className="p-6 sm:p-8">
                                {activeTab === 'Details' && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold text-gray-900 border-b border-tertiary/30 pb-2">Customer Information</h3>

                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                        <User size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Customer Name</p>
                                                        <p className="text-base font-bold text-gray-900 mt-0.5">{customerName}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                        <Phone size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Customer Mobile</p>
                                                        <p className="text-base font-bold text-gray-900 mt-0.5">{customerPhone}</p>
                                                    </div>
                                                </div>

                                                {customerEmail !== '—' && (
                                                    <div className="flex items-start gap-4">
                                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                            <Mail size={20} />
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Customer Email</p>
                                                            <p className="text-base font-bold text-gray-900 mt-0.5">{customerEmail}</p>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                                                        <Truck size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Delivery Mode</p>
                                                        <p className="text-base font-bold text-gray-900 mt-0.5 capitalize">{deliveryType.replace('_', ' ')}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <h3 className="text-lg font-bold text-gray-900 border-b border-tertiary/30 pb-2">Delivery & Logistics</h3>

                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                        <Calendar size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Date</p>
                                                        <p className="text-base font-bold text-gray-900 mt-0.5">{formattedDateTime.date}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                                                        <Clock size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Time</p>
                                                        <p className="text-base font-bold text-gray-900 mt-0.5">{formattedDateTime.time}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                                        <MapPin size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Delivery Address</p>
                                                        <p className="text-sm font-medium text-gray-800 mt-1 leading-relaxed">
                                                            {formattedAddress}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 shrink-0">
                                                        <PackageCheck size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Current Status</p>
                                                        <div className="mt-1">
                                                            <StatusBadge status={status} />
                                                        </div>
                                                    </div>
                                                </div>

                                                {notes && (
                                                    <div className="p-3 bg-slate-50 rounded-xl border border-tertiary/30 text-xs text-gray-600">
                                                        <span className="font-bold text-gray-800 block mb-0.5">Order Notes:</span>
                                                        {notes}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Products' && (
                                    <div className="space-y-8 animate-fadeIn">
                                        <div className="border border-tertiary/40 rounded-xl overflow-hidden">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-tertiary/40 text-xs font-semibold text-secondary uppercase tracking-wider">
                                                        <th className="px-6 py-4">Product Name</th>
                                                        <th className="px-6 py-4 text-center">Qty</th>
                                                        <th className="px-6 py-4 text-right">Price</th>
                                                        <th className="px-6 py-4 text-right">Subtotal</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-tertiary/30">
                                                    {items.length === 0 ? (
                                                        <tr>
                                                            <td colSpan="4" className="px-6 py-8 text-center text-gray-400">
                                                                No products found on this order.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        items.map((product, index) => (
                                                            <tr key={product.productId || product.id || index} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-bold text-gray-900">
                                                                    {product.productName || product.name || 'Unnamed Product'}
                                                                    {product.productSKU && (
                                                                        <span className="block text-[10px] text-gray-400 font-normal">SKU: {product.productSKU}</span>
                                                                    )}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 text-center">
                                                                    {product.quantity || 1}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-medium text-secondary/80 text-right">
                                                                    {formatCurrency(product.price || 0)}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                                                    {formatCurrency(product.total || ((product.price || 0) * (product.quantity || 1)) || 0)}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>

                                        <div className="bg-slate-50 rounded-xl p-6 border border-tertiary/30 ml-auto w-full md:w-[400px]">
                                            <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-tertiary/30 pb-3">Payment Summary</h3>

                                            <div className="space-y-3 mb-6">
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-secondary/80">Subtotal</span>
                                                    <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
                                                </div>
                                                {tax > 0 && (
                                                    <div className="flex justify-between text-sm">
                                                        <span className="font-medium text-secondary/80">Tax</span>
                                                        <span className="font-bold text-gray-900">{formatCurrency(tax)}</span>
                                                    </div>
                                                )}
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-secondary/80">Delivery / Shipping</span>
                                                    <span className="font-bold text-gray-900">{formatCurrency(deliveryCharge)}</span>
                                                </div>
                                                {discount > 0 && (
                                                    <div className="flex justify-between text-sm text-emerald-600">
                                                        <span className="font-medium">Discount</span>
                                                        <span className="font-bold">-{formatCurrency(discount)}</span>
                                                    </div>
                                                )}
                                                <div className="pt-3 mt-3 border-t border-tertiary/30 flex justify-between">
                                                    <span className="font-bold text-base text-gray-900">Total Amount</span>
                                                    <span className="font-bold text-xl text-primary">{formatCurrency(totalAmount)}</span>
                                                </div>
                                            </div>

                                            <div className="p-3 bg-white rounded-xl border border-tertiary/30 space-y-1 text-xs">
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Payment Method:</span>
                                                    <span className="font-bold text-gray-800">{order?.paymentMethod || 'Cash on Delivery'}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Payment Status:</span>
                                                    <span className="font-bold text-gray-800">{paymentStatus}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

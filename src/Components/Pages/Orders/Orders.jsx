import React, { useEffect, useMemo, useState } from 'react';
import {
    Download,
    Eye,
    Printer,
    RefreshCw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../../Config/Firebase';
import CommonTable from '../../Shared/Pages/CommonTable';

const getOrderDateObj = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (value?.seconds != null) return new Date(value.seconds * 1000);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const formatOrderDate = (value) => {
    const date = getOrderDateObj(value);
    if (!date) return '—';
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const getStatusKey = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'new' || s === 'pending' || s === 'created') return 'New';
    if (s === 'processing' || s === 'in progress') return 'Processing';
    if (s === 'dispatch' || s === 'dispatched' || s === 'shipped') return 'Dispatch';
    if (s === 'out of delivery' || s === 'out for delivery') return 'Out of Delivery';
    if (s === 'delivered' || s === 'completed') return 'Delivered';
    if (s === 'cancelled' || s === 'canceled') return 'Cancelled';
    return s;
};

const getStatusBadgeClass = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'delivered' || s === 'completed') {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'processing' || s === 'in progress') {
        return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s === 'new' || s === 'pending' || s === 'created') {
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s === 'dispatch' || s === 'dispatched' || s === 'shipped') {
        return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (s === 'out of delivery' || s === 'out for delivery') {
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    if (s === 'cancelled' || s === 'canceled') {
        return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return 'bg-gray-50 text-gray-700 border-gray-200';
};

const getPaymentStatusClass = (status) => {
    const s = String(status || '').toLowerCase().trim();
    if (s === 'paid' || s === 'success' || s === 'completed') {
        return 'text-emerald-600';
    }
    if (s === 'pending') {
        return 'text-amber-600';
    }
    if (s === 'failed' || s === 'cancelled') {
        return 'text-rose-600';
    }
    return 'text-gray-600';
};

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('All');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [refreshKey, setRefreshKey] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        let unsubscribe;

        const handleSnapshot = (snapshot) => {
            const list = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                orderDocId: docSnap.id,
                ...docSnap.data(),
            }));

            // Sort newest first
            list.sort((a, b) => {
                const dateA = getOrderDateObj(a.createdAt || a.orderDate)?.getTime() || 0;
                const dateB = getOrderDateObj(b.createdAt || b.orderDate)?.getTime() || 0;
                return dateB - dateA;
            });

            setOrders(list);
            setLoading(false);
        };

        try {
            const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
            unsubscribe = onSnapshot(
                q,
                handleSnapshot,
                (err) => {
                    console.warn('Orders query with orderBy failed, falling back to base collection:', err);
                    const fallbackUnsub = onSnapshot(
                        collection(db, 'orders'),
                        handleSnapshot,
                        (fallbackErr) => {
                            console.error('Failed to load orders:', fallbackErr);
                            setLoading(false);
                        }
                    );
                    unsubscribe = fallbackUnsub;
                }
            );
        } catch (error) {
            console.error('Error listening to orders collection:', error);
            setLoading(false);
        }

        return () => {
            if (typeof unsubscribe === 'function') unsubscribe();
        };
    }, [refreshKey]);

    const tabCounts = useMemo(() => {
        const counts = {
            All: orders.length,
            New: 0,
            Processing: 0,
            Dispatch: 0,
            'Out of Delivery': 0,
            Delivered: 0,
            Cancelled: 0,
        };
        orders.forEach((order) => {
            const key = getStatusKey(order.status);
            if (counts[key] !== undefined) {
                counts[key] += 1;
            }
        });
        return counts;
    }, [orders]);

    const tabs = [
        { id: 'New', label: 'New Order', count: tabCounts.New },
        { id: 'Processing', label: 'Processing', count: tabCounts.Processing },
        { id: 'Dispatch', label: 'Dispatch', count: tabCounts.Dispatch },
        { id: 'Out of Delivery', label: 'Out of Delivery', count: tabCounts['Out of Delivery'] },
        { id: 'Delivered', label: 'Delivered', count: tabCounts.Delivered },
        { id: 'Cancelled', label: 'Cancelled', count: tabCounts.Cancelled },
        { id: 'All', label: 'All', count: tabCounts.All },
    ];

    const filteredOrders = useMemo(() => {
        return orders.filter((order) => {
            // Tab status filter
            if (activeTab !== 'All') {
                const statusKey = getStatusKey(order.status);
                if (statusKey !== activeTab) return false;
            }

            // Date range filter
            if (startDate || endDate) {
                const d = getOrderDateObj(order.orderDate || order.createdAt);
                if (!d) return false;
                if (startDate) {
                    const start = new Date(`${startDate}T00:00:00`);
                    if (d < start) return false;
                }
                if (endDate) {
                    const end = new Date(`${endDate}T23:59:59`);
                    if (d > end) return false;
                }
            }

            return true;
        });
    }, [orders, activeTab, startDate, endDate]);

    const handleClearFilters = () => {
        setActiveTab('All');
        setStartDate('');
        setEndDate('');
    };

    const handleExportCSV = () => {
        if (!filteredOrders.length) return;
        const headers = [
            "Order ID",
            "Customer Name",
            "Customer Email",
            "Customer Phone",
            "Delivery Type",
            "Date",
            "Payment Method",
            "Payment Status",
            "Status",
            "Total Amount",
        ];
        const rows = filteredOrders.map((o) => [
            o.orderId || o.orderDocId || o.id,
            `"${(o.customerName || o.deliveryAddress?.fullName || '').replace(/"/g, '""')}"`,
            `"${(o.customerEmail || '').replace(/"/g, '""')}"`,
            `"${(o.customerPhone || o.deliveryAddress?.phone || '').replace(/"/g, '""')}"`,
            o.deliveryType || 'Standard',
            formatOrderDate(o.orderDate || o.createdAt),
            `"${(o.paymentMethod || '').replace(/"/g, '""')}"`,
            o.paymentStatus || '',
            o.status || '',
            Number(o.totalAmount ?? o.total ?? 0).toFixed(2),
        ]);
        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `orders_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrintOrder = (order) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        const itemsHtml = (order.items || []).map(item => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.productName || item.sku || 'Item'}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity || 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">€${Number(item.price || 0).toFixed(2)}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">€${Number(item.total || 0).toFixed(2)}</td>
            </tr>
        `).join('');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Order Receipt - ${order.orderId || order.orderDocId || order.id}</title>
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 24px; color: #111; max-width: 650px; margin: 0 auto; }
                        h1 { margin-bottom: 4px; font-size: 22px; }
                        p { margin: 4px 0; font-size: 13px; color: #444; }
                        table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 13px; }
                        th { background: #f8f9fa; padding: 8px; text-align: left; border-bottom: 2px solid #ddd; font-weight: 600; }
                        .total-row { font-weight: bold; font-size: 14px; }
                    </style>
                </head>
                <body>
                    <h1>Order Receipt</h1>
                    <p><strong>Order ID:</strong> ${order.orderId || order.orderDocId || order.id}</p>
                    <p><strong>Date:</strong> ${formatOrderDate(order.orderDate || order.createdAt)}</p>
                    <p><strong>Customer:</strong> ${order.customerName || order.deliveryAddress?.fullName || '—'}</p>
                    <p><strong>Phone:</strong> ${order.customerPhone || order.deliveryAddress?.phone || '—'}</p>
                    <p><strong>Delivery Address:</strong> ${order.deliveryAddress ? `${order.deliveryAddress.addressLine || ''}, ${order.deliveryAddress.postalCode || ''} ${order.deliveryAddress.city || ''}, ${order.deliveryAddress.country || ''}` : '—'}</p>
                    <p><strong>Payment Method:</strong> ${order.paymentMethod || '—'} (${order.paymentStatus || 'Pending'})</p>
                    <table>
                        <thead>
                            <tr>
                                <th>Product</th>
                                <th style="text-align: center;">Qty</th>
                                <th style="text-align: right;">Price</th>
                                <th style="text-align: right;">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${itemsHtml}
                        </tbody>
                        <tfoot>
                            <tr>
                                <td colspan="3" style="padding: 8px; text-align: right;">Subtotal:</td>
                                <td style="padding: 8px; text-align: right;">€${Number(order.subtotal || order.grossSubtotal || 0).toFixed(2)}</td>
                            </tr>
                            <tr>
                                <td colspan="3" style="padding: 8px; text-align: right;">Delivery Charge:</td>
                                <td style="padding: 8px; text-align: right;">€${Number(order.deliveryCharge || order.shipping || 0).toFixed(2)}</td>
                            </tr>
                            ${Number(order.discount || 0) > 0 ? `
                            <tr>
                                <td colspan="3" style="padding: 8px; text-align: right; color: #16a34a;">Discount:</td>
                                <td style="padding: 8px; text-align: right; color: #16a34a;">-€${Number(order.discount).toFixed(2)}</td>
                            </tr>` : ''}
                            <tr class="total-row">
                                <td colspan="3" style="padding: 8px; text-align: right; border-top: 2px solid #333;">Total Amount:</td>
                                <td style="padding: 8px; text-align: right; border-top: 2px solid #333;">€${Number(order.totalAmount ?? order.total ?? 0).toFixed(2)}</td>
                            </tr>
                        </tfoot>
                    </table>
                    <script>
                        window.onload = function() { window.print(); }
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="min-h-screen bg-white pb-12 page-container">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Orders Management
                        </h1>
                        
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleExportCSV}
                            disabled={!filteredOrders.length}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-secondary transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-50"
                        >
                            <Download size={16} />
                            Export Data
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setLoading(true);
                                setRefreshKey((prev) => prev + 1);
                            }}
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-white border border-tertiary/60 px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-slate-50 focus:outline-none disabled:opacity-50"
                        >
                            <RefreshCw size={16} className={`text-secondary ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Tabs Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-2 overflow-x-auto">
                    <div className="flex space-x-1 min-w-max">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                                    activeTab === tab.id
                                        ? 'bg-primary/10 text-gray-900 shadow-sm'
                                        : 'text-secondary/70 hover:bg-slate-50 hover:text-gray-900'
                                }`}
                            >
                                {tab.label}
                                <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                        activeTab === tab.id
                                            ? 'bg-primary text-white'
                                            : 'bg-tertiary/30 text-secondary'
                                    }`}
                                >
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                <CommonTable
                    title="Orders"
                    subtitle="Review and manage customer orders"
                    showDateFilter={true}
                    startDate={startDate}
                    endDate={endDate}
                    onStartDateChange={setStartDate}
                    onEndDateChange={setEndDate}
                    onClearFilters={handleClearFilters}
                    columns={[
                        {
                            key: "sl",
                            header: "Sl No.",
                            sortable: true,
                            render: (_, index) => (
                                <span className="font-semibold text-gray-600">{index + 1}</span>
                            ),
                        },
                        {
                            key: "orderId",
                            header: "Order ID",
                            sortable: true,
                            render: (order) => (
                                <span className="font-bold text-gray-900">
                                    {order.orderId || order.orderDocId || order.id || '—'}
                                </span>
                            ),
                        },
                        {
                            key: "customerName",
                            header: "Customer",
                            sortable: true,
                            render: (order) => (
                                <div>
                                    <p className="font-bold text-gray-900">
                                        {order.customerName || order.deliveryAddress?.fullName || '—'}
                                    </p>
                                    {(order.customerPhone || order.deliveryAddress?.phone || order.customerEmail) && (
                                        <p className="mt-0.5 text-xs text-secondary/70">
                                            {order.customerPhone || order.deliveryAddress?.phone || order.customerEmail}
                                        </p>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: "deliveryType",
                            header: "Delivery Type",
                            sortable: true,
                            render: (order) => (
                                <span className="capitalize text-gray-700">
                                    {order.deliveryType || 'Standard'}
                                </span>
                            ),
                        },
                        {
                            key: "orderDate",
                            header: "Date",
                            sortable: true,
                            render: (order) => (
                                <span className="text-xs text-gray-700 font-medium">
                                    {formatOrderDate(order.orderDate || order.createdAt)}
                                </span>
                            ),
                        },
                        {
                            key: "paymentMethod",
                            header: "Payment",
                            sortable: true,
                            render: (order) => (
                                <div>
                                    <p className="text-xs font-semibold text-gray-800">
                                        {order.paymentMethod || '—'}
                                    </p>
                                    {order.paymentStatus && (
                                        <span className={`text-[11px] font-bold ${getPaymentStatusClass(order.paymentStatus)}`}>
                                            {order.paymentStatus}
                                        </span>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: "status",
                            header: "Status",
                            sortable: true,
                            render: (order) => {
                                const badgeClass = getStatusBadgeClass(order.status);
                                return (
                                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${badgeClass}`}>
                                        {order.status || 'Pending'}
                                    </span>
                                );
                            },
                        },
                        {
                            key: "totalAmount",
                            header: "Total Amount",
                            sortable: true,
                            render: (order) => (
                                <span className="font-black text-gray-900">
                                    €{Number(order.totalAmount ?? order.total ?? 0).toFixed(2)}
                                </span>
                            ),
                        },
                        {
                            key: "paidAmount",
                            header: "Paid Amount",
                            sortable: true,
                            render: (order) => {
                                const isPaid = String(order.paymentStatus || '').toLowerCase() === 'paid';
                                const paidVal = isPaid ? Number(order.totalAmount ?? order.total ?? 0) : 0;
                                return (
                                    <span className={`font-semibold ${isPaid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                        €{paidVal.toFixed(2)}
                                    </span>
                                );
                            },
                        },
                    ]}
                    data={filteredOrders}
                    total={filteredOrders.length}
                    loading={loading}
                    clientSide
                    showRowNumbers={false}
                    rowKey="id"
                    searchPlaceholder="Search by order ID, customer, phone, email..."
                    actions={(order) => (
                        <div className="inline-flex items-center justify-end gap-1">
                            <button
                                type="button"
                                className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-100 hover:text-blue-900"
                                title="View Order"
                                onClick={() => navigate('/orders/view', {
                                    state: {
                                        order,
                                        orderId: order.orderId || order.orderDocId || order.id,
                                    },
                                })}
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                type="button"
                                className="rounded-lg p-2 text-red-700 transition hover:bg-red-100 hover:text-red-900"
                                title="Print Order Receipt"
                                onClick={() => handlePrintOrder(order)}
                            >
                                <Printer size={18} />
                            </button>
                        </div>
                    )}
                />

            </div>
        </div>
    );
}

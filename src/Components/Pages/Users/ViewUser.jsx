import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    User as UserIcon,
    ShoppingBag,
    Mail,
    Phone,
    MapPin,
    Clock,
    CreditCard,
    Euro,
    Package,
    CheckCircle2,
    Truck,
    Eye
} from 'lucide-react';
import {
    collection,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    where
} from 'firebase/firestore';
import { db } from '../../Config/Firebase';
import CommonTable from '../../Shared/Pages/CommonTable';
import { formatCurrency, formatNumber } from '../../Shared/utils/formatters';

const parseDateObj = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (value?.seconds != null) return new Date(value.seconds * 1000);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const normalizeStatus = (data = {}) => {
    if (data.isBlocked === true || String(data.status || '').toLowerCase() === 'blocked') {
        return 'Blocked';
    }
    if (data.isActive === false || String(data.status || '').toLowerCase() === 'inactive') {
        return 'Inactive';
    }
    return 'Active';
};

export default function ViewUser() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('details');

    const passedCustomer = location.state?.customer || null;
    const queryUid = new URLSearchParams(location.search).get('uid');
    const userId = queryUid || passedCustomer?.uid || passedCustomer?.id || null;

    const [userDocData, setUserDocData] = useState(null);
    const [ledgerData, setLedgerData] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(Boolean(userId));

    // Subscribe to live users/{userId} document
    useEffect(() => {
        if (!userId) return undefined;

        const unsubscribe = onSnapshot(
            doc(db, 'users', userId),
            (docSnap) => {
                if (docSnap.exists()) {
                    setUserDocData({ id: docSnap.id, ...docSnap.data() });
                }
            },
            (err) => {
                console.warn('Customer profile subscription warning:', err?.message || err);
            }
        );

        return unsubscribe;
    }, [userId]);

    // Subscribe to user_ledgers/{userId}
    useEffect(() => {
        if (!userId) return undefined;

        const unsubscribe = onSnapshot(
            doc(db, 'user_ledgers', userId),
            (docSnap) => {
                if (docSnap.exists()) {
                    setLedgerData(docSnap.data());
                }
            },
            () => {}
        );

        return unsubscribe;
    }, [userId]);

    // Subscribe to customer orders (bounded)
    useEffect(() => {
        if (!userId) {
            setLoadingOrders(false);
            return undefined;
        }

        setLoadingOrders(true);
        let isMounted = true;
        let primaryUserUnsub = null;
        let fallbackUserUnsub = null;
        let primaryCustUnsub = null;
        let fallbackCustUnsub = null;
        let ordersByUser = [];
        let ordersByCustomer = [];

        const mergeAndSet = () => {
            if (!isMounted) return;
            const mergedMap = new Map();
            [...ordersByUser, ...ordersByCustomer].forEach((orderItem) => {
                mergedMap.set(orderItem.docId, orderItem);
            });
            const list = Array.from(mergedMap.values());
            list.sort((a, b) => {
                const msA = parseDateObj(a.createdAt || a.orderDate)?.getTime() || 0;
                const msB = parseDateObj(b.createdAt || b.orderDate)?.getTime() || 0;
                return msB - msA;
            });
            setOrders(list);
            setLoadingOrders(false);
        };

        const mapDocs = (snapshot) =>
            snapshot.docs.map((docSnap) => ({
                docId: docSnap.id,
                ...docSnap.data(),
            }));

        try {
            const orderedUserQuery = query(
                collection(db, 'orders'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            primaryUserUnsub = onSnapshot(
                orderedUserQuery,
                (snapshot) => {
                    ordersByUser = mapDocs(snapshot);
                    mergeAndSet();
                },
                (err) => {
                    console.warn('Customer orders (userId) ordered query failed, falling back:', err?.message || err);
                    if (typeof primaryUserUnsub === 'function') {
                        primaryUserUnsub();
                        primaryUserUnsub = null;
                    }
                    if (!isMounted) return;
                    fallbackUserUnsub = onSnapshot(
                        query(collection(db, 'orders'), where('userId', '==', userId), limit(50)),
                        (snapshot) => {
                            ordersByUser = mapDocs(snapshot);
                            mergeAndSet();
                        },
                        (fallbackErr) => {
                            console.error('Failed to load customer orders (userId):', fallbackErr);
                            if (isMounted) setLoadingOrders(false);
                        }
                    );
                }
            );

            const orderedCustomerQuery = query(
                collection(db, 'orders'),
                where('customerId', '==', userId),
                orderBy('createdAt', 'desc'),
                limit(50)
            );

            primaryCustUnsub = onSnapshot(
                orderedCustomerQuery,
                (snapshot) => {
                    ordersByCustomer = mapDocs(snapshot);
                    mergeAndSet();
                },
                (err) => {
                    console.warn('Customer orders (customerId) ordered query failed, falling back:', err?.message || err);
                    if (typeof primaryCustUnsub === 'function') {
                        primaryCustUnsub();
                        primaryCustUnsub = null;
                    }
                    if (!isMounted) return;
                    fallbackCustUnsub = onSnapshot(
                        query(collection(db, 'orders'), where('customerId', '==', userId), limit(50)),
                        (snapshot) => {
                            ordersByCustomer = mapDocs(snapshot);
                            mergeAndSet();
                        },
                        (fallbackErr) => {
                            console.warn('Customer orders (customerId) fallback warning:', fallbackErr?.message || fallbackErr);
                        }
                    );
                }
            );
        } catch (error) {
            console.error('Error loading customer orders:', error);
            setLoadingOrders(false);
        }

        return () => {
            isMounted = false;
            if (typeof primaryUserUnsub === 'function') primaryUserUnsub();
            if (typeof fallbackUserUnsub === 'function') fallbackUserUnsub();
            if (typeof primaryCustUnsub === 'function') primaryCustUnsub();
            if (typeof fallbackCustUnsub === 'function') fallbackCustUnsub();
        };
    }, [userId]);

    const customer = useMemo(() => {
        if (!userId) return null;
        const base = userDocData || passedCustomer || {};
        const latestOrder = orders[0] || {};
        const address = base.deliveryAddress || base.address || latestOrder.deliveryAddress || null;

        return {
            id: userId,
            name: base.name || base.displayName || base.fullName || latestOrder.customerName || 'Unnamed Customer',
            email: base.email || latestOrder.customerEmail || '—',
            phone: base.phone || base.phoneNumber || base.mobile || ledgerData?.mobile || latestOrder.customerPhone || '—',
            status: userDocData ? normalizeStatus(userDocData) : (passedCustomer?.status || 'Active'),
            address,
        };
    }, [userId, userDocData, passedCustomer, ledgerData, orders]);

    const orderHistory = useMemo(() => {
        return orders.map((order) => {
            const d = parseDateObj(order.createdAt || order.orderDate);
            const itemsArr = Array.isArray(order.items) ? order.items : [];
            const itemSummary = itemsArr.length > 0
                ? `${itemsArr.length} ${itemsArr.length === 1 ? 'item' : 'items'} (${itemsArr.slice(0, 3).map((i) => i.productName || i.name || 'Item').join(', ')})`
                : `${order.totalItems || 0} items`;

            return {
                id: order.orderId || order.docId,
                docId: order.docId,
                date: d ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
                time: d ? d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : '—',
                items: itemSummary,
                paymentMethod: order.paymentMethod || 'Cash on Delivery',
                totalRaw: Number(order.totalAmount ?? order.total ?? 0),
                total: formatCurrency(order.totalAmount ?? order.total ?? 0),
                status: order.status || 'New',
                rawOrder: { id: order.docId, orderDocId: order.docId, ...order },
            };
        });
    }, [orders]);

    const totalOrdersCount = Math.max(Number(ledgerData?.orders ?? passedCustomer?.orders ?? 0), orderHistory.length);
    const totalSpendNum = Number(
        ledgerData?.recievableAmount ??
        orderHistory.reduce((sum, o) => sum + o.totalRaw, 0)
    );
    const avgOrderValue = totalOrdersCount > 0 ? totalSpendNum / totalOrdersCount : 0;

    const getStatusBadge = (status) => {
        switch (String(status || '').toLowerCase()) {
            case 'delivered':
            case 'completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'processing':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'dispatch':
            case 'dispatched':
            case 'shipped':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'cancelled':
            case 'canceled':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

    if (!customer) {
        return (
            <div className="min-h-screen bg-white p-8 flex flex-col items-center justify-center text-center space-y-4">
                <p className="text-lg font-bold text-gray-900">No customer selected</p>
                <p className="text-sm text-secondary">Select a customer from the Customers list to view their profile and orders.</p>
                <button
                    type="button"
                    onClick={() => navigate('/users')}
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-secondary transition-colors"
                >
                    Back to Customers
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-12 page-container">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Top Header with Back Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="p-2.5 bg-white border border-tertiary/60 rounded-xl text-secondary hover:bg-slate-50 hover:text-gray-900 transition-colors shadow-sm focus:outline-none"
                            title="Go Back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-2.5">
                                <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                                    {customer.name}
                                </h1>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${customer.status === 'Active'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : customer.status === 'Inactive'
                                        ? 'bg-slate-100 text-slate-600 border-slate-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}>
                                    {customer.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/orders')}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-tertiary/60 text-gray-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none"
                        >
                            <ShoppingBag size={16} className="text-secondary" />
                            <span>All Orders</span>
                        </button>
                    </div>
                </div>

                {/* Order Summary Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 justify-center">
                    <div className="p-5 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Total Orders</p>
                            <p className="text-2xl font-black text-gray-900 mt-0.5">{formatNumber(totalOrdersCount)}</p>
                            <p className="text-[11px] font-semibold text-blue-600 mt-0.5">Lifetime purchases</p>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <Euro size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Total Spend</p>
                            <p className="text-2xl font-black text-emerald-600 mt-0.5">{formatCurrency(totalSpendNum)}</p>
                            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Gross revenue</p>
                        </div>
                    </div>

                    <div className="p-5 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Avg. Order Value</p>
                            <p className="text-2xl font-black text-gray-900 mt-0.5">{formatCurrency(avgOrderValue)}</p>
                            <p className="text-[11px] font-semibold text-purple-600 mt-0.5">Per transaction</p>
                        </div>
                    </div>
                </div>

                {/* Main Tabbed Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 overflow-hidden">

                    <div className="flex border-b border-tertiary/40 bg-slate-50/60">
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeTab === 'details'
                                ? 'text-primary bg-white'
                                : 'text-secondary/70 hover:text-gray-900 hover:bg-slate-50'
                                }`}
                        >
                            <UserIcon size={18} />
                            <span>User Details & Address</span>
                            {activeTab === 'details' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => setActiveTab('orders')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-bold transition-all relative ${activeTab === 'orders'
                                ? 'text-primary bg-white'
                                : 'text-secondary/70 hover:text-gray-900 hover:bg-slate-50'
                                }`}
                        >
                            <ShoppingBag size={18} />
                            <span>Purchase & Orders</span>
                            {activeTab === 'orders' && (
                                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                            )}
                        </button>
                    </div>

                    {activeTab === 'details' && (
                        <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">

                            <div>
                                <h3 className="text-base font-bold text-gray-900 border-b border-tertiary/30 pb-3 flex items-center gap-2">
                                    <UserIcon size={18} className="text-primary" />
                                    <span>Personal & Account Details</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5 text-left">
                                    <div className="p-4 rounded-xl border border-tertiary/40 bg-slate-50/60">
                                        <p className="text-xs font-bold text-secondary/70 uppercase tracking-wider">Email Address</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5 truncate">
                                            <Mail size={14} className="text-secondary shrink-0" />
                                            <span className="truncate">{customer.email}</span>
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl border border-tertiary/40 bg-slate-50/60">
                                        <p className="text-xs font-bold text-secondary/70 uppercase tracking-wider">Phone Number</p>
                                        <p className="text-sm font-bold text-gray-900 mt-1 flex items-center gap-1.5">
                                            <Phone size={14} className="text-secondary shrink-0" />
                                            <span>{customer.phone}</span>
                                        </p>
                                    </div>

                                    <div className="p-4 rounded-xl border border-tertiary/40 bg-slate-50/60">
                                        <p className="text-xs font-bold text-secondary/70 uppercase tracking-wider">Account Status</p>
                                        <div className="mt-1">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${customer.status === 'Active'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                : customer.status === 'Inactive'
                                                    ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                    : 'bg-rose-50 text-rose-700 border-rose-200'
                                                }`}>
                                                {customer.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-base font-bold text-gray-900 border-b border-tertiary/30 pb-3 flex items-center gap-2">
                                    <MapPin size={18} className="text-primary" />
                                    <span>Latest Delivery Address</span>
                                </h3>

                                {customer.address ? (
                                    <div className="mt-5 p-5 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex flex-col justify-between relative overflow-hidden max-w-xl">
                                        <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                                            Recent Order Address
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <Truck size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Delivery Address</h4>
                                                    <p className="text-xs text-secondary/70">Derived from customer profile / latest order</p>
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-800 space-y-1 pl-1 pt-2">
                                                <p className="font-bold text-gray-900">{customer.address.fullName || customer.name}</p>
                                                <p className="text-secondary">
                                                    {customer.address.addressLine || customer.address.street || customer.address.addressLine1 || customer.address.line1 || '—'}
                                                </p>
                                                <p className="text-secondary">
                                                    {[customer.address.postalCode || customer.address.zip, customer.address.city, customer.address.state].filter(Boolean).join(', ') || '—'}
                                                </p>
                                                <p className="text-secondary font-semibold">{customer.address.country || 'Germany'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-tertiary/20 flex items-center justify-between text-xs text-secondary">
                                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                                <CheckCircle2 size={13} /> Recorded on Order
                                            </span>
                                            <span className="font-medium">Phone: {customer.address.phone || customer.phone}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-5 rounded-xl border border-dashed border-tertiary/60 bg-slate-50/50 p-6 text-sm text-secondary">
                                        No delivery address recorded for this customer yet.
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {activeTab === 'orders' && (
                        <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
                            <div className="space-y-4">
                                <CommonTable
                                    title="Order History"
                                    subtitle={`Showing ${orderHistory.length} recent orders`}
                                    loading={loadingOrders}
                                    columns={[
                                        { key: "id", header: "Order ID", sortable: true, cellClassName: "font-mono font-bold text-primary" },
                                        {
                                            key: "date",
                                            header: "Date & Time",
                                            sortable: true,
                                            render: (order) => (
                                                <div className="text-xs">
                                                    <p className="font-bold text-gray-900">{order.date}</p>
                                                    <p className="mt-0.5 flex items-center gap-1 text-secondary/70">
                                                        <Clock size={11} /> {order.time}
                                                    </p>
                                                </div>
                                            ),
                                        },
                                        {
                                            key: "items",
                                            header: "Purchased Items",
                                            render: (order) => <span title={order.items}>{order.items}</span>,
                                        },
                                        {
                                            key: "paymentMethod",
                                            header: "Payment Method",
                                            sortable: true,
                                            render: (order) => (
                                                <span className="flex items-center gap-1.5">
                                                    <CreditCard size={13} className="text-secondary" />
                                                    {order.paymentMethod}
                                                </span>
                                            ),
                                        },
                                        { key: "total", header: "Total Amount", align: "right", sortable: true, cellClassName: "font-bold text-gray-900" },
                                        {
                                            key: "status",
                                            header: "Status",
                                            sortable: true,
                                            align: "center",
                                            render: (order) => (
                                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${getStatusBadge(order.status)}`}>
                                                    {order.status}
                                                </span>
                                            ),
                                        },
                                    ]}
                                    data={orderHistory}
                                    total={orderHistory.length}
                                    clientSide
                                    showRowNumbers={false}
                                    rowKey="docId"
                                    searchPlaceholder="Search order history..."
                                    emptyMessage="No orders found"
                                    emptyDescription="This customer has not placed any orders yet."
                                    actions={(order) => (
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/orders/view/${encodeURIComponent(order.docId)}`, { state: { order: order.rawOrder, orderId: order.docId } })}
                                            className="inline-flex items-center gap-1.5 rounded-lg border border-tertiary/40 bg-slate-50 px-3 py-1.5 text-xs font-bold text-secondary shadow-sm transition-colors hover:bg-white hover:text-primary"
                                            title="View Full Order"
                                        >
                                            <Eye size={13} />
                                            <span>View</span>
                                        </button>
                                    )}
                                />
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}

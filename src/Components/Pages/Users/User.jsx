import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Download,
    FilterX,
    Eye,
    Edit2,
    Trash2,
    X,
    UserCheck,
    Users,
    ShoppingBag,
    ChevronDown,
    ArrowUpDown
} from 'lucide-react';
import {
    collection,
    deleteDoc,
    doc,
    limit,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    updateDoc
} from 'firebase/firestore';
import { db } from '../../Config/Firebase';
import CommonTable from '../../Shared/Pages/CommonTable';
import { useToast } from '../../Shared/hooks/ToastContext';
import { useConfirm } from '../../Shared/ui/ConfirmDialog';
import { formatCurrency, formatNumber } from '../../Shared/utils/formatters';

const PAGE_BATCH = 200;

const parseTimestampMs = (value) => {
    if (!value) return 0;
    if (typeof value?.toDate === 'function') return value.toDate().getTime();
    if (value?.seconds != null) return value.seconds * 1000;
    const ms = new Date(value).getTime();
    return Number.isNaN(ms) ? 0 : ms;
};

const formatJoinedDate = (value) => {
    const ms = parseTimestampMs(value);
    if (!ms) return '—';
    return new Date(ms).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

const normalizeCustomerStatus = (data = {}) => {
    if (data.isBlocked === true || String(data.status || '').toLowerCase() === 'blocked') {
        return 'Blocked';
    }
    if (data.isActive === false || String(data.status || '').toLowerCase() === 'inactive') {
        return 'Inactive';
    }
    return 'Active';
};

const escapeCsvValue = (value) => `"${String(value ?? '').replace(/"/g, '""')}"`;

export default function User() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const confirm = useConfirm();

    const [rawUsers, setRawUsers] = useState([]);
    const [ledgersByUid, setLedgersByUid] = useState({});
    const [overviewStats, setOverviewStats] = useState({ totalUsers: null, totalOrders: null });
    const [loading, setLoading] = useState(true);
    const [userLimit, setUserLimit] = useState(PAGE_BATCH);

    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('default');

    // Modal state
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [savingEdit, setSavingEdit] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        status: 'Active',
        city: ''
    });

    // Subscribe to Firestore users (bounded)
    useEffect(() => {
        setLoading(true);
        let isMounted = true;
        let primaryUnsub = null;
        let fallbackUnsub = null;

        const handleSnapshot = (snapshot) => {
            if (!isMounted) return;
            const list = snapshot.docs.map((docSnap) => ({
                id: docSnap.id,
                ...docSnap.data(),
            }));
            list.sort((a, b) => parseTimestampMs(b.createdAt) - parseTimestampMs(a.createdAt));
            setRawUsers(list);
            setLoading(false);
        };

        try {
            const usersQuery = query(
                collection(db, 'users'),
                orderBy('createdAt', 'desc'),
                limit(userLimit)
            );
            primaryUnsub = onSnapshot(
                usersQuery,
                handleSnapshot,
                (err) => {
                    console.warn('Users ordered query failed, falling back:', err?.message || err);
                    if (typeof primaryUnsub === 'function') {
                        primaryUnsub();
                        primaryUnsub = null;
                    }
                    if (!isMounted) return;
                    fallbackUnsub = onSnapshot(
                        query(collection(db, 'users'), limit(userLimit)),
                        handleSnapshot,
                        (fallbackErr) => {
                            console.error('Failed to load users:', fallbackErr);
                            if (isMounted) {
                                setLoading(false);
                                showToast('Unable to load customers.', 'error');
                            }
                        }
                    );
                }
            );
        } catch (error) {
            console.error('Error listening to users:', error);
            setLoading(false);
        }

        return () => {
            isMounted = false;
            if (typeof primaryUnsub === 'function') primaryUnsub();
            if (typeof fallbackUnsub === 'function') fallbackUnsub();
        };
    }, [userLimit, showToast]);

    // Subscribe to customer ledgers for real order counts & spend totals
    useEffect(() => {
        const unsubscribe = onSnapshot(
            query(collection(db, 'user_ledgers'), limit(userLimit)),
            (snapshot) => {
                const map = {};
                snapshot.docs.forEach((docSnap) => {
                    map[docSnap.id] = docSnap.data();
                });
                setLedgersByUid(map);
            },
            (error) => {
                console.warn('User ledgers subscription warning:', error?.message || error);
            }
        );

        return unsubscribe;
    }, [userLimit]);

    // Subscribe to analytics/overview for global customer/order totals
    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, 'analytics', 'overview'),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setOverviewStats({
                        totalUsers: data.totalUsers ?? null,
                        totalOrders: data.totalOrders ?? null,
                    });
                }
            },
            () => {}
        );

        return unsubscribe;
    }, []);

    const customers = useMemo(() => {
        return rawUsers.map((user) => {
            const ledger = ledgersByUid[user.id] || {};
            const orderCount = Number(ledger.orders ?? user.ordersCount ?? user.totalOrders ?? 0);
            const totalSpentRaw = Number(ledger.recievableAmount ?? user.totalSpent ?? 0);
            const addressObj = user.address || user.deliveryAddress || {};

            return {
                id: user.id,
                uid: user.uid || user.id,
                name: user.name || user.displayName || user.fullName || 'Unnamed Customer',
                email: user.email || '—',
                phone: user.phone || user.phoneNumber || user.mobile || ledger.mobile || '—',
                orders: orderCount,
                status: normalizeCustomerStatus(user),
                joined: formatJoinedDate(user.createdAt),
                totalSpentRaw,
                totalSpent: formatCurrency(totalSpentRaw),
                city: user.city || addressObj.city || '',
            };
        });
    }, [rawUsers, ledgersByUid]);

    const handleDelete = async (id) => {
        const ok = await confirm({
            title: 'Delete Customer Record',
            message: 'Are you sure you want to delete this customer record?',
            confirmLabel: 'Delete',
        });
        if (!ok) return;
        setDeletingId(id);
        try {
            await deleteDoc(doc(db, 'users', id));
            showToast('Customer deleted successfully.', 'success');
        } catch (error) {
            console.error('Failed to delete customer:', error);
            showToast(error?.message || 'Unable to delete customer.', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    const handleOpenEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name === 'Unnamed Customer' ? '' : customer.name,
            email: customer.email === '—' ? '' : customer.email,
            phone: customer.phone === '—' ? '' : customer.phone,
            status: customer.status,
            city: customer.city || ''
        });
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingCustomer) return;

        setSavingEdit(true);
        try {
            await updateDoc(doc(db, 'users', editingCustomer.id), {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim(),
                city: formData.city.trim(),
                status: formData.status,
                isActive: formData.status === 'Active',
                isBlocked: formData.status === 'Blocked',
                updatedAt: serverTimestamp(),
            });
            showToast('Customer updated successfully.', 'success');
            setEditingCustomer(null);
        } catch (error) {
            console.error('Failed to update customer:', error);
            showToast(error?.message || 'Unable to update customer.', 'error');
        } finally {
            setSavingEdit(false);
        }
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('All');
        setSortBy('default');
    };

    const filteredCustomers = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        return customers
            .filter((customer) => {
                const matchesSearch =
                    !q ||
                    customer.name.toLowerCase().includes(q) ||
                    customer.email.toLowerCase().includes(q) ||
                    customer.phone.toLowerCase().includes(q);

                const matchesStatus =
                    statusFilter === 'All' || customer.status.toLowerCase() === statusFilter.toLowerCase();

                return matchesSearch && matchesStatus;
            })
            .sort((a, b) => {
                if (sortBy === 'orders-high') return b.orders - a.orders;
                if (sortBy === 'orders-low') return a.orders - b.orders;
                if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
                if (sortBy === 'name-desc') return b.name.localeCompare(a.name);
                return 0;
            });
    }, [customers, searchQuery, statusFilter, sortBy]);

    const totalCustomers = overviewStats.totalUsers ?? customers.length;
    const activeCustomers = customers.filter((c) => c.status === 'Active').length;
    const totalOrders = overviewStats.totalOrders ?? customers.reduce((acc, c) => acc + c.orders, 0);

    const getAvatarBg = (name = '') => {
        const colors = [
            'bg-emerald-100 text-emerald-700',
            'bg-blue-100 text-blue-700',
            'bg-purple-100 text-purple-700',
            'bg-amber-100 text-amber-700',
            'bg-rose-100 text-rose-700',
            'bg-cyan-100 text-cyan-700'
        ];
        const code = name ? name.charCodeAt(0) : 0;
        return colors[code % colors.length];
    };

    const columns = [
        {
            key: 'name',
            header: 'Name',
            sortable: true,
            render: (customer) => {
                const initials = customer.name
                    .split(' ')
                    .filter(Boolean)
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase() || 'C';

                return (
                    <div className="flex items-center gap-3">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold shadow-sm ${getAvatarBg(customer.name)}`}>
                            {initials}
                        </div>
                        <div className="min-w-0">
                            <p className="line-clamp-1 text-sm font-bold text-gray-900">{customer.name}</p>
                            <p className="text-[11px] font-medium text-secondary/70">Joined {customer.joined}</p>
                        </div>
                    </div>
                );
            },
        },
        { key: 'phone', header: 'Phone', sortable: true },
        { key: 'email', header: 'Email', sortable: true },
        {
            key: 'orders',
            header: 'Order Count',
            sortable: true,
            align: 'center',
            render: (customer) => formatNumber(customer.orders),
        },
        {
            key: 'totalSpentRaw',
            header: 'Total Spent',
            sortable: true,
            align: 'right',
            render: (customer) => <span className="font-semibold text-gray-900">{customer.totalSpent}</span>,
        },
        {
            key: 'status',
            header: 'Status',
            sortable: true,
            align: 'center',
            render: (customer) => (
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-bold ${
                    customer.status === 'Active'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : customer.status === 'Inactive'
                            ? 'border-slate-200 bg-slate-100 text-slate-600'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                }`}>
                    {customer.status}
                </span>
            ),
        },
    ];

    const handleExportCsv = () => {
        const headers = ['SL', 'UID', 'Name', 'Phone', 'Email', 'Orders', 'Total Spent', 'Status', 'Joined'];
        const rows = filteredCustomers.map((c, i) => [
            i + 1,
            c.uid,
            c.name,
            c.phone,
            c.email,
            c.orders,
            c.totalSpent,
            c.status,
            c.joined,
        ].map(escapeCsvValue).join(','));

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', 'customers_list.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="min-h-screen bg-white pb-12 page-container">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="text-left">
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Customer Info
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={handleExportCsv}
                            disabled={filteredCustomers.length === 0}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-tertiary/60 text-gray-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none disabled:opacity-50"
                        >
                            <Download size={16} className="text-secondary" />
                            <span>Export CSV</span>
                        </button>
                    </div>
                </div>

                {/* Stat Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-4 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Users size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Customers</p>
                            <p className="text-2xl font-black text-gray-900 mt-0.5">{formatNumber(totalCustomers)}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <UserCheck size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Active Customers (Loaded)</p>
                            <p className="text-2xl font-black text-emerald-600 mt-0.5">{formatNumber(activeCustomers)}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <ShoppingBag size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Orders Placed</p>
                            <p className="text-2xl font-black text-gray-900 mt-0.5">{formatNumber(totalOrders)}</p>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                    <div className="relative flex-1 max-w-lg">
                        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/50 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search customer by name, email, or phone..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-tertiary/60 bg-slate-50 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative min-w-[130px]">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-tertiary/60 bg-slate-50 py-2.5 pl-3.5 pr-8 text-xs font-bold text-gray-900 outline-none transition focus:border-primary focus:bg-white cursor-pointer"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Active">Active</option>
                                <option value="Inactive">Inactive</option>
                                <option value="Blocked">Blocked</option>
                            </select>
                            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary/70" />
                        </div>

                        <div className="relative min-w-[150px]">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-tertiary/60 bg-slate-50 py-2.5 pl-3.5 pr-8 text-xs font-bold text-gray-900 outline-none transition focus:border-primary focus:bg-white cursor-pointer"
                            >
                                <option value="default">Sort by: Recent</option>
                                <option value="orders-high">Orders: High to Low</option>
                                <option value="orders-low">Orders: Low to High</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                            </select>
                            <ArrowUpDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary/70" />
                        </div>

                        {(searchQuery || statusFilter !== 'All' || sortBy !== 'default') && (
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors text-xs font-bold focus:outline-none"
                                title="Reset Filters"
                            >
                                <FilterX size={15} />
                                <span>Reset</span>
                            </button>
                        )}

                        <div className="text-xs font-bold text-secondary hidden sm:block pl-2 border-l border-tertiary/40">
                            {filteredCustomers.length} {filteredCustomers.length === 1 ? 'Customer' : 'Customers'}
                        </div>
                    </div>
                </div>

                <CommonTable
                    title="Customer List"
                    subtitle="Live customer records from Firestore"
                    columns={columns}
                    data={filteredCustomers}
                    total={filteredCustomers.length}
                    loading={loading}
                    clientSide
                    showSearch={false}
                    rowKey="id"
                    emptyMessage="No customers found"
                    emptyDescription="Try adjusting your search or filters."
                    actions={(customer) => (
                        <>
                            <button
                                type="button"
                                onClick={() => navigate(`/users/view?uid=${encodeURIComponent(customer.id)}`, { state: { customer } })}
                                className="rounded-lg p-2 text-secondary transition hover:bg-primary/10 hover:text-primary"
                                title="View Customer Details"
                            >
                                <Eye size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleOpenEdit(customer)}
                                className="rounded-lg p-2 text-secondary transition hover:bg-slate-100 hover:text-primary"
                                title="Edit Customer"
                            >
                                <Edit2 size={15} />
                            </button>
                            <button
                                type="button"
                                onClick={() => handleDelete(customer.id)}
                                disabled={deletingId === customer.id}
                                className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                                title="Delete Customer"
                            >
                                <Trash2 size={15} />
                            </button>
                        </>
                    )}
                />

                {rawUsers.length >= userLimit && (
                    <div className="flex justify-center">
                        <button
                            type="button"
                            onClick={() => setUserLimit((prev) => prev + PAGE_BATCH)}
                            className="rounded-xl border border-tertiary/60 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-slate-50"
                        >
                            Load more customers ({formatNumber(rawUsers.length)} loaded)
                        </button>
                    </div>
                )}

            </div>

            {/* Edit Customer Modal */}
            {editingCustomer && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setEditingCustomer(null)}>
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>

                        <div className="flex items-center justify-between border-b border-tertiary/30 px-6 py-4 bg-slate-50">
                            <h2 className="text-lg font-bold text-gray-900">Edit Customer</h2>
                            <button
                                type="button"
                                onClick={() => setEditingCustomer(null)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-slate-200 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-secondary/80 mb-1.5">
                                    Full Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-xl border border-tertiary/60 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-secondary/80 mb-1.5">
                                    Email Address <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className="w-full rounded-xl border border-tertiary/60 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-secondary/80 mb-1.5">
                                    Phone Number
                                </label>
                                <input
                                    type="text"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full rounded-xl border border-tertiary/60 bg-slate-50 px-3.5 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-colors"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-secondary/80 mb-1.5">
                                    Status
                                </label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full rounded-xl border border-tertiary/60 bg-slate-50 px-3.5 py-2.5 text-sm font-bold text-gray-900 outline-none focus:border-primary focus:bg-white cursor-pointer"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                    <option value="Blocked">Blocked</option>
                                </select>
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-tertiary/30">
                                <button
                                    type="button"
                                    onClick={() => setEditingCustomer(null)}
                                    disabled={savingEdit}
                                    className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingEdit}
                                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-secondary transition-colors disabled:opacity-60"
                                >
                                    {savingEdit ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

import React, { useState } from 'react';
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
    Phone,
    Mail,
    ChevronDown,
    ArrowUpDown
} from 'lucide-react';

export default function User() {
    const navigate = useNavigate();

    // Initial mock customer data
    const [customers, setCustomers] = useState([
        {
            id: 1,
            name: 'Sarah Connor',
            email: 'sarah.connor@example.com',
            phone: '+49 151 2345678',
            orders: 15,
            status: 'Active',
            joined: '12 Mar 2024',
            totalSpent: '€1,450.00',
            city: 'Berlin'
        },
        {
            id: 2,
            name: 'John Wick',
            email: 'john.wick@continental.de',
            phone: '+49 160 9876543',
            orders: 42,
            status: 'Active',
            joined: '05 Nov 2023',
            totalSpent: '€4,280.50',
            city: 'Munich'
        },
        {
            id: 3,
            name: 'Bruce Wayne',
            email: 'bruce@wayne-ent.de',
            phone: '+49 171 5554321',
            orders: 28,
            status: 'Active',
            joined: '19 Jan 2024',
            totalSpent: '€6,120.00',
            city: 'Frankfurt'
        },
        {
            id: 4,
            name: 'Tony Stark',
            email: 'stark@avengers.org',
            phone: '+49 175 4443322',
            orders: 18,
            status: 'Inactive',
            joined: '14 Aug 2023',
            totalSpent: '€2,890.00',
            city: 'Hamburg'
        },
    ]);

    // Filters state
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortBy, setSortBy] = useState('default');

    // Modals state
    const [editingCustomer, setEditingCustomer] = useState(null);

    // Form state for add/edit
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        status: 'Active',
        city: ''
    });

    // Delete handler
    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this customer?')) {
            setCustomers(customers.filter(c => c.id !== id));
        }
    };

    // Open Edit modal
    const handleOpenEdit = (customer) => {
        setEditingCustomer(customer);
        setFormData({
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            status: customer.status,
            city: customer.city || ''
        });
    };

    // Save edited customer
    const handleSaveEdit = (e) => {
        e.preventDefault();
        setCustomers(customers.map(c => 
            c.id === editingCustomer.id 
                ? { ...c, ...formData }
                : c
        ));
        setEditingCustomer(null);
    };

    // Reset all filters
    const handleResetFilters = () => {
        setSearchQuery('');
        setStatusFilter('All');
        setSortBy('default');
    };

    // Filtered and sorted data
    const filteredCustomers = customers
        .filter((customer) => {
            const matchesSearch =
                customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                customer.phone.includes(searchQuery);

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

    // Summary stats
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter(c => c.status === 'Active').length;
    const totalOrders = customers.reduce((acc, c) => acc + c.orders, 0);

    // Initial avatar colors
    const getAvatarBg = (name) => {
        const colors = [
            'bg-emerald-100 text-emerald-700',
            'bg-blue-100 text-blue-700',
            'bg-purple-100 text-purple-700',
            'bg-amber-100 text-amber-700',
            'bg-rose-100 text-rose-700',
            'bg-cyan-100 text-cyan-700'
        ];
        return colors[name.charCodeAt(0) % colors.length];
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
                            onClick={() => {
                                const csvContent = "data:text/csv;charset=utf-8," + 
                                    ["SL,Name,Phone,Email,Orders,Status"].concat(
                                        customers.map((c, i) => `${i + 1},${c.name},${c.phone},${c.email},${c.orders},${c.status}`)
                                    ).join("\n");
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", "customers_list.csv");
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-tertiary/60 text-gray-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none"
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
                            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalCustomers}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <UserCheck size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Active Customers</p>
                            <p className="text-2xl font-black text-emerald-600 mt-0.5">{activeCustomers}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-3.5">
                        <div className="h-11 w-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                            <ShoppingBag size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-secondary uppercase tracking-wider">Total Orders Placed</p>
                            <p className="text-2xl font-black text-gray-900 mt-0.5">{totalOrders}</p>
                        </div>
                    </div>
                </div>

                {/* Filter & Search Toolbar */}
                <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-4 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4">
                    
                    {/* Left: Search input */}
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

                    {/* Right: Filters & Sorters */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Status Filter */}
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

                        {/* Sort Dropdown */}
                        <div className="relative min-w-[150px]">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="w-full appearance-none rounded-xl border border-tertiary/60 bg-slate-50 py-2.5 pl-3.5 pr-8 text-xs font-bold text-gray-900 outline-none transition focus:border-primary focus:bg-white cursor-pointer"
                            >
                                <option value="default">Sort by: Default</option>
                                <option value="orders-high">Orders: High to Low</option>
                                <option value="orders-low">Orders: Low to High</option>
                                <option value="name-asc">Name: A to Z</option>
                                <option value="name-desc">Name: Z to A</option>
                            </select>
                            <ArrowUpDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary/70" />
                        </div>

                        {/* Reset Filter Button */}
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

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-900 border-collapse">
                            <thead className="bg-slate-50/80 border-b border-tertiary/40">
                                <tr>
                                    <th className="px-5 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider w-16 text-center">SL No</th>
                                    <th className="px-5 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider">Name</th>
                                    <th className="px-5 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider">Phone</th>
                                    <th className="px-5 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider">Email</th>
                                    <th className="px-5 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider text-center">Order Count</th>
                                    <th className="px-5 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider text-center">Status</th>
                                    <th className="px-5 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider text-right pr-6">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tertiary/20">
                                {filteredCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-12 text-secondary/70">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <Users size={32} className="text-secondary/40" />
                                                <p className="text-base font-bold text-gray-800">No customers found</p>
                                                <p className="text-xs text-secondary/60">Try adjusting your search or filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCustomers.map((customer, index) => {
                                        const initials = customer.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                                        const avatarBg = getAvatarBg(customer.name);

                                        return (
                                            <tr key={customer.id} className="transition-colors hover:bg-slate-50/60 group">
                                                
                                                {/* 1. SL No */}
                                                <td className="px-5 py-4 text-center font-bold text-secondary/70 text-xs">
                                                    #{index + 1}
                                                </td>

                                                {/* 2. Name */}
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-9 w-9 rounded-full shrink-0 flex items-center justify-center font-bold text-xs shadow-sm ${avatarBg}`}>
                                                            {initials}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                                                                {customer.name}
                                                            </p>
                                                            <p className="text-[11px] font-medium text-secondary/70">
                                                                Joined {customer.joined}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* 3. Phone */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-gray-800">
                                                        <Phone size={13} className="text-secondary/50 shrink-0" />
                                                        <span>{customer.phone}</span>
                                                    </div>
                                                </td>

                                                {/* 4. Email */}
                                                <td className="px-5 py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                                                        <Mail size={13} className="text-secondary/50 shrink-0" />
                                                        <span>{customer.email}</span>
                                                    </div>
                                                </td>

                                                {/* 5. Order Count */}
                                                <td className="px-5 py-4 text-center whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-gray-900 font-extrabold text-xs border border-tertiary/40">
                                                        <ShoppingBag size={12} className="text-secondary" />
                                                        <span>{customer.orders}</span>
                                                    </span>
                                                </td>

                                                {/* 6. Status */}
                                                <td className="px-5 py-4 text-center whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                        customer.status === 'Active'
                                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                                            : customer.status === 'Inactive'
                                                            ? 'bg-slate-100 text-slate-600 border-slate-200'
                                                            : 'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                        {customer.status}
                                                    </span>
                                                </td>

                                                {/* 7. Action (view, edit, delete) */}
                                                <td className="px-5 py-4 text-right whitespace-nowrap pr-6">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        {/* View */}
                                                        <button
                                                            type="button"
                                                            onClick={() => navigate('/users/view', { state: { customer } })}
                                                            className="p-1.5 rounded-lg border border-tertiary/40 bg-slate-50 text-secondary hover:text-primary hover:bg-white transition-colors"
                                                            title="View Customer Details"
                                                        >
                                                            <Eye size={15} />
                                                        </button>

                                                        {/* Edit */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenEdit(customer)}
                                                            className="p-1.5 rounded-lg border border-tertiary/40 bg-slate-50 text-secondary hover:text-primary hover:bg-white transition-colors"
                                                            title="Edit Customer"
                                                        >
                                                            <Edit2 size={15} />
                                                        </button>

                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDelete(customer.id)}
                                                            className="p-1.5 rounded-lg border border-rose-200/80 bg-rose-50/60 text-rose-600 hover:bg-rose-100 transition-colors"
                                                            title="Delete Customer"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>

                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

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
                                    Phone Number <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
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
                                    className="rounded-xl px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-slate-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-secondary transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}

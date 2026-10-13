import React, { useState } from 'react';
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
    DollarSign,
    Package,
    CheckCircle2,
    Truck,
    Eye,
    Building2
} from 'lucide-react';

export default function ViewUser() {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('details');

    const passedCustomer = location.state?.customer;

    const customer = passedCustomer || {
        id: 1,
        name: 'Sarah Connor',
        email: 'sarah.connor@example.com',
        phone: '+49 151 2345678',
        orders: 15,
        status: 'Active',
        joined: '12 Mar 2024',
        totalSpent: '€1,450.00',
        city: 'Berlin',
        street: 'Friedrichstraße 43, Apt 4B',
        postalCode: '10117',
        state: 'Berlin',
        country: 'Germany'
    };

    // Mock 
    const orderHistory = [
        {
            id: 'ORD-9821',
            date: '10 Oct 2026',
            time: '14:30',
            items: '3 items (Espresso Beans, Filter Paper, Mug)',
            total: '€124.50',
            paymentMethod: 'Credit Card (**** 4242)',
            status: 'Delivered',
        },
        {
            id: 'ORD-9742',
            date: '28 Sep 2026',
            time: '09:15',
            items: '1 item (Ceramic Mug Set 4-Pack)',
            total: '€35.00',
            paymentMethod: 'PayPal',
            status: 'Delivered',
        },
        {
            id: 'ORD-9610',
            date: '14 Sep 2026',
            time: '18:45',
            items: '5 items (Barista Apron, Machine Cleaner, Syrups)',
            total: '€382.00',
            paymentMethod: 'Klarna Pay Later',
            status: 'Delivered',
        },
        {
            id: 'ORD-9504',
            date: '22 Aug 2026',
            time: '11:20',
            items: '2 items (Matcha Powder 250g, Vanilla Syrup)',
            total: '€48.00',
            paymentMethod: 'Credit Card (**** 4242)',
            status: 'Processing',
        },
        {
            id: 'ORD-9390',
            date: '05 Aug 2026',
            time: '16:10',
            items: '4 items (Coffee Grinder Pro, 12oz Cups, Sugar)',
            total: '€215.50',
            paymentMethod: 'Credit Card (**** 4242)',
            status: 'Delivered',
        },
        {
            id: 'ORD-9128',
            date: '19 Jul 2026',
            time: '10:05',
            items: '2 items (Specialty Roast Blend 1kg)',
            total: '€64.00',
            paymentMethod: 'PayPal',
            status: 'Delivered',
        }
    ];

    // Status pill helper
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Delivered':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'Processing':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'Shipped':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'Cancelled':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-slate-50 text-slate-700 border-slate-200';
        }
    };

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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 justify-center">
                    {/* 1. Total Orders */}
                    <div className="p-5 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <ShoppingBag size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Total Orders</p>
                            <p className="text-2xl font-black text-gray-900 mt-0.5">
                                {customer.orders || orderHistory.length}
                            </p>
                            <p className="text-[11px] font-semibold text-blue-600 mt-0.5">Lifetime purchases</p>
                        </div>
                    </div>

                    {/* 2. Total Spend */}
                    <div className="p-5 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Total Spend</p>
                            <p className="text-2xl font-black text-emerald-600 mt-0.5">
                                {customer.totalSpent || '€1,450.00'}
                            </p>
                            <p className="text-[11px] font-semibold text-emerald-600 mt-0.5">Gross revenue</p>
                        </div>
                    </div>

                    {/* 3. Average Order Value */}
                    <div className="p-5 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-secondary uppercase tracking-wider">Avg. Order Value</p>
                            <p className="text-2xl font-black text-gray-900 mt-0.5">€96.67</p>
                            <p className="text-[11px] font-semibold text-purple-600 mt-0.5">Per transaction</p>
                        </div>
                    </div>

                </div>

                {/* Main Tabbed Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 overflow-hidden">

                    {/* Tabs Header */}
                    <div className="flex border-b border-tertiary/40 bg-slate-50/60">
                        {/* Tab 1: User details with address */}
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

                        {/* Tab 2: Purchase & Orders */}
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

                    {/* Tab 1 Content: User Details & Address */}
                    {activeTab === 'details' && (
                        <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">

                            {/* Personal & Account Information */}
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

                            {/* Address Information Section */}
                            <div>
                                <h3 className="text-base font-bold text-gray-900 border-b border-tertiary/30 pb-3 flex items-center gap-2">
                                    <MapPin size={18} className="text-primary" />
                                    <span>Saved Addresses</span>
                                </h3>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-5">

                                    {/* Shipping Address */}
                                    <div className="p-5 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                                            Default Shipping
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                                    <Truck size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Primary Delivery Address</h4>
                                                    <p className="text-xs text-secondary/70">Used for courier & postal dispatch</p>
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-800 space-y-1 pl-1 pt-2">
                                                <p className="font-bold text-gray-900">{customer.name}</p>
                                                <p className="text-secondary">{customer.street || 'Friedrichstraße 43, Apt 4B'}</p>
                                                <p className="text-secondary">
                                                    {customer.postalCode || '10117'} {customer.city || 'Berlin'}, {customer.state || 'Berlin'}
                                                </p>
                                                <p className="text-secondary font-semibold">{customer.country || 'Germany'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-tertiary/20 flex items-center justify-between text-xs text-secondary">
                                            <span className="flex items-center gap-1 font-semibold text-emerald-600">
                                                <CheckCircle2 size={13} /> Verified Postal Address
                                            </span>
                                            <span className="font-medium">Phone: {customer.phone}</span>
                                        </div>
                                    </div>

                                    {/* Billing Address */}
                                    <div className="p-5 rounded-2xl border border-tertiary/40 bg-white shadow-sm flex flex-col justify-between relative overflow-hidden">
                                        <div className="absolute top-0 right-0 bg-slate-100 text-secondary text-[10px] font-black uppercase px-3 py-1 rounded-bl-xl tracking-wider">
                                            Billing Address
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-9 w-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shrink-0">
                                                    <Building2 size={18} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-gray-900">Official Invoice Address</h4>
                                                    <p className="text-xs text-secondary/70">Matched against invoice records</p>
                                                </div>
                                            </div>

                                            <div className="text-sm text-gray-800 space-y-1 pl-1 pt-2">
                                                <p className="font-bold text-gray-900">{customer.name}</p>
                                                <p className="text-secondary">{customer.street || 'Friedrichstraße 43, Apt 4B'}</p>
                                                <p className="text-secondary">
                                                    {customer.postalCode || '10117'} {customer.city || 'Berlin'}, {customer.state || 'Berlin'}
                                                </p>
                                                <p className="text-secondary font-semibold">{customer.country || 'Germany'}</p>
                                            </div>
                                        </div>

                                        <div className="mt-5 pt-3 border-t border-tertiary/20 flex items-center justify-between text-xs text-secondary">
                                            <span className="flex items-center gap-1 font-semibold text-gray-700">
                                                <CreditCard size={13} className="text-secondary" /> Payment: Visa •••• 4242
                                            </span>
                                            <span className="font-medium">VAT: Exempt</span>
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    )}

                    {/* Tab 2 Content: Purchase & Orders */}
                    {activeTab === 'orders' && (
                        <div className="p-6 sm:p-8 space-y-8 animate-in fade-in duration-200">
                            {/* Order History Table Section */}
                            <div className="space-y-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">Order History</h3>
                                    </div>
                                    <span className="text-xs font-bold text-secondary">
                                        Showing {orderHistory.length} orders
                                    </span>
                                </div>

                                <div className="border border-tertiary/40 rounded-2xl overflow-hidden shadow-sm bg-white">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-sm text-gray-900 border-collapse">
                                            <thead className="bg-slate-50/80 border-b border-tertiary/40">
                                                <tr>
                                                    <th className="px-5 py-3.5 font-bold text-secondary uppercase text-[11px] tracking-wider">Order ID</th>
                                                    <th className="px-5 py-3.5 font-bold text-secondary uppercase text-[11px] tracking-wider">Date & Time</th>
                                                    <th className="px-5 py-3.5 font-bold text-secondary uppercase text-[11px] tracking-wider">Purchased Items</th>
                                                    <th className="px-5 py-3.5 font-bold text-secondary uppercase text-[11px] tracking-wider">Payment Method</th>
                                                    <th className="px-5 py-3.5 font-bold text-secondary uppercase text-[11px] tracking-wider text-right">Total Amount</th>
                                                    <th className="px-5 py-3.5 font-bold text-secondary uppercase text-[11px] tracking-wider text-center">Status</th>
                                                    <th className="px-5 py-3.5 font-bold text-secondary uppercase text-[11px] tracking-wider text-right pr-6">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-tertiary/20">
                                                {orderHistory.map((order) => (
                                                    <tr key={order.id} className="hover:bg-slate-50/60 transition-colors group">

                                                        {/* Order ID */}
                                                        <td className="px-5 py-4 whitespace-nowrap">
                                                            <span className="font-mono font-bold text-xs text-primary group-hover:underline">
                                                                #{order.id}
                                                            </span>
                                                        </td>

                                                        {/* Date & Time */}
                                                        <td className="px-5 py-4 whitespace-nowrap">
                                                            <div className="text-xs">
                                                                <p className="font-bold text-gray-900">{order.date}</p>
                                                                <p className="text-secondary/70 flex items-center gap-1 mt-0.5">
                                                                    <Clock size={11} /> {order.time}
                                                                </p>
                                                            </div>
                                                        </td>

                                                        {/* Items */}
                                                        <td className="px-5 py-4">
                                                            <p className="text-xs font-medium text-gray-800 line-clamp-1 max-w-xs" title={order.items}>
                                                                {order.items}
                                                            </p>
                                                        </td>

                                                        {/* Payment Method */}
                                                        <td className="px-5 py-4 whitespace-nowrap">
                                                            <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                                                                <CreditCard size={13} className="text-secondary" />
                                                                {order.paymentMethod}
                                                            </span>
                                                        </td>

                                                        {/* Total Amount */}
                                                        <td className="px-5 py-4 text-right whitespace-nowrap">
                                                            <span className="font-black text-sm text-gray-900">
                                                                {order.total}
                                                            </span>
                                                        </td>

                                                        {/* Status */}
                                                        <td className="px-5 py-4 text-center whitespace-nowrap">
                                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getStatusBadge(order.status)}`}>
                                                                {order.status}
                                                            </span>
                                                        </td>

                                                        {/* Action */}
                                                        <td className="px-5 py-4 text-right whitespace-nowrap pr-6">
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate('/orders/view')}
                                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-tertiary/40 bg-slate-50 text-secondary hover:text-primary hover:bg-white text-xs font-bold transition-colors shadow-sm"
                                                                title="View Full Order"
                                                            >
                                                                <Eye size={13} />
                                                                <span>View</span>
                                                            </button>
                                                        </td>

                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                        </div>
                    )}

                </div>

            </div>
        </div>
    );
}

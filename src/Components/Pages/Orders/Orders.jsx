import React, { useState } from 'react';
import {
    Calendar,
    FilterX,
    Download,
    Eye,
    Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CommonTable from '../../Shared/Pages/CommonTable';

export default function Orders() {
    const [activeTab, setActiveTab] = useState('All');
    const navigate = useNavigate();
    // Tab definitions with mock counts
    const tabs = [
        { id: 'New', label: 'New Order', count: 15 },
        { id: 'Processing', label: 'Processing', count: 42 },
        { id: 'Dispatch', label: 'Dispatch', count: 28 },
        { id: 'Out of Delivery', label: 'Out of Delivery', count: 18 },
        { id: 'Delivered', label: 'Delivered', count: 10 },
        { id: 'Cancelled', label: 'Cancelled', count: 47 },
        { id: 'All', label: 'All', count: 150 },

    ];

    // Mock data for the table
    const ordersData = [
        { sl: 1, orderId: 'ORD-7829', customer: 'Sarah Connor', date: '2026-10-07', type: 'Online', payment: 'Credit Card', total: '$145.00', paid: '$145.00' },
        { sl: 2, orderId: 'ORD-7828', customer: 'John Wick', date: '2026-10-06', type: 'Direct', payment: 'PayPal', total: '$320.50', paid: '$320.50' },
        { sl: 3, orderId: 'ORD-7827', customer: 'Bruce Wayne', date: '2026-10-06', type: 'Direct', payment: 'Bank Transfer', total: '$1,200.00', paid: '$600.00' },
        { sl: 4, orderId: 'ORD-7826', customer: 'Tony Stark', date: '2026-10-05', type: 'Online', payment: 'Credit Card', total: '$85.00', paid: '$85.00' },
        { sl: 5, orderId: 'ORD-7825', customer: 'Natasha Romanoff', date: '2026-10-04', type: 'Online', payment: 'Apple Pay', total: '$450.00', paid: '$450.00' },
        { sl: 6, orderId: 'ORD-7824', customer: 'Peter Parker', date: '2026-10-03', type: 'Direct', payment: 'Cash on Delivery', total: '$25.00', paid: '$0.00' },
    ];
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
                        <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-medium hover:bg-secondary transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40">
                            <Download size={16} />
                            Export Data
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
                                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-primary/10 text-gray-900 shadow-sm'
                                    : 'text-secondary/70 hover:bg-slate-50 hover:text-gray-900'
                                    }`}
                            >
                                {tab.label}
                                <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id
                                    ? 'bg-primary text-white'
                                    : 'bg-tertiary/30 text-secondary'
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Filters Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-5 flex flex-wrap items-center gap-4">
                    {/* Date Range */}
                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={18} className="text-gray-800" />
                            </div>
                            <input
                                type="date"
                                className="block w-full pl-10 pr-3 py-2.5 border border-tertiary/60 rounded-xl sm:text-sm text-gray-800 bg-slate-50 hover:bg-white focus:bg-white outline-none focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors"
                            />
                        </div>
                        <span className="text-gray-800 font-medium px-1">to</span>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Calendar size={18} className="text-gray-800" />
                            </div>
                            <input
                                type="date"
                                className="block w-full pl-10 pr-3 py-2.5 border border-tertiary/60 rounded-xl sm:text-sm text-gray-800 bg-slate-50 hover:bg-white focus:bg-white outline-none focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors"
                            />
                        </div>
                    </div>

                    {/* Clear Filters */}
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-gray-800 border border-tertiary/50 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
                        <FilterX size={16} />
                        Clear Filters
                    </button>
                </div>

                <CommonTable
                    title="Orders"
                    subtitle="Review and manage customer orders"
                    columns={[
                        { key: "sl", header: "Sl No.", sortable: true },
                        { key: "orderId", header: "Order ID", sortable: true, cellClassName: "font-bold text-gray-900" },
                        { key: "customer", header: "Customer Name", sortable: true },
                        { key: "type", header: "User Type", sortable: true },
                        { key: "date", header: "Date", sortable: true },
                        { key: "payment", header: "Payment Method", sortable: true },
                        { key: "total", header: "Total Amount", sortable: true },
                        { key: "paid", header: "Paid Amount", sortable: true, cellClassName: "font-semibold text-emerald-600" },
                    ]}
                    data={ordersData}
                    total={ordersData.length}
                    clientSide
                    showRowNumbers={false}
                    rowKey="sl"
                    searchPlaceholder="Search by order ID, name..."
                    actions={() => (
                        <>
                            <button
                                type="button"
                                className="rounded-lg p-2 text-blue-700 transition hover:bg-blue-100 hover:text-blue-900"
                                title="View Order"
                                onClick={() => navigate('/orders/view')}
                            >
                                <Eye size={18} />
                            </button>
                            <button
                                type="button"
                                className="rounded-lg p-2 text-red-700 transition hover:bg-red-100 hover:text-red-900"
                                title="Print order"
                            >
                                <Printer size={18} />
                            </button>
                        </>
                    )}
                />

            </div>
        </div>
    );
}

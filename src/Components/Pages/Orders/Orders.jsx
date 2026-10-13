import React, { useState } from 'react';
import {
    Search,
    Calendar,
    FilterX,
    Download,
    Eye,
    Printer
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-gray-800" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by order ID, name..."
                            className="block w-full pl-10 pr-3 py-2.5 border border-tertiary/60 rounded-xl sm:text-sm text-gray-800 bg-slate-50 hover:bg-white focus:bg-white outline-none focus:outline-none focus:border-tertiary focus:ring-1 focus:ring-tertiary/40 transition-colors"
                        />
                    </div>

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

                {/* Table Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-tertiary/40">
                            <thead className="bg-slate-50">
                                <tr>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Sl No.</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Order ID</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Customer Name</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">User Type</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Date</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Payment Method</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Total Amount</th>
                                    <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-secondary uppercase tracking-wider">Paid Amount</th>
                                    <th scope="col" className="px-6 py-4 text-center text-xs font-semibold text-secondary uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-tertiary/20">
                                {ordersData.map((order) => (
                                    <tr key={order.sl} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{order.sl}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{order.orderId}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{order.customer}</td>
                                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800'>{order.type}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{order.date}</td>

                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-700">{order.payment}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-800">{order.total}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600">{order.paid}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center font-semibold text-sm">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="p-1.5 text-blue-700 hover:text-blue-900 hover:bg-blue-100 rounded-lg transition-colors" title="View Order"
                                                    onClick={() => navigate('/orders/view')}>
                                                    <Eye size={18} />
                                                </button>
                                                <button className="p-1.5 text-red-700 hover:text-red-900 hover:bg-red-100 rounded-lg transition-colors" title="print">
                                                    <Printer size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination stub */}
                    <div className="bg-white border-t border-tertiary/40 px-6 py-4 flex items-center justify-between">
                        <span className="text-sm text-secondary/70">Showing 1 to 6 of 1,250 entries</span>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 border border-tertiary rounded-lg text-sm font-medium text-secondary hover:bg-slate-50 transition-colors disabled:opacity-50" disabled>Previous</button>
                            <button className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-secondary transition-colors">1</button>
                            <button className="px-3 py-1.5 border border-tertiary rounded-lg text-sm font-medium text-secondary hover:bg-slate-50 transition-colors">2</button>
                            <button className="px-3 py-1.5 border border-tertiary rounded-lg text-sm font-medium text-secondary hover:bg-slate-50 transition-colors">3</button>
                            <button className="px-3 py-1.5 border border-tertiary rounded-lg text-sm font-medium text-secondary hover:bg-slate-50 transition-colors">Next</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

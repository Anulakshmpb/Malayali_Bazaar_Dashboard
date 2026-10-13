import React from 'react';
import {
    ShoppingCart,
    Users,
    Package,
    DollarSign,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    UserX,
    MoreHorizontal
} from 'lucide-react';

export default function Dashboard() {
    // Mock Data for demonstration
    const stats = [
        { title: 'Total Orders', value: '1,284', icon: ShoppingCart, trend: '+12.5%', isUp: true },
        { title: 'Total Users', value: '3,492', icon: Users, trend: '+5.2%', isUp: true },
        { title: 'Total Products', value: '845', icon: Package, trend: '+2.1%', isUp: true },
        { title: 'Total Sales', value: '$45,231', icon: DollarSign, trend: '+18.2%', isUp: true },
        { title: 'Items Sold', value: '8,214', icon: TrendingUp, trend: '-3.1%', isUp: false },
        { title: 'Total Profit', value: '$12,450', icon: Activity, trend: '+8.4%', isUp: true },
    ];

    const mostOrdered = [
        {
            name: 'Premium Coffee Beans',
            orders: 145,
            price: '$24.00',
            image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=200&h=200'
        },
        {
            name: 'Ceramic Mug Set',
            orders: 98,
            price: '$35.00',
            image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=200&h=200'
        },
        {
            name: 'Espresso Machine',
            orders: 64,
            price: '$299.00',
            image: 'https://images.unsplash.com/photo-1517668808822-9ebb02ae2a0e?auto=format&fit=crop&w=200&h=200'
        },
        {
            name: 'Barista Apron',
            orders: 52,
            price: '$45.00',
            image: 'https://images.unsplash.com/photo-1589363460779-fd4be9b64b38?auto=format&fit=crop&w=200&h=200'
        },
    ];

    const lowStock = [
        {
            name: 'Filter Papers',
            stock: 2,
            threshold: 50,
            image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=200&h=200'
        },
        {
            name: 'Vanilla Syrup',
            stock: 4,
            threshold: 20,
            image: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=200&h=200'
        },
        {
            name: 'Matcha Powder',
            stock: 12,
            threshold: 15,
            image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=200&h=200'
        },
        {
            name: 'Paper Cups (12oz)',
            stock: 15,
            threshold: 200,
            image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=200&h=200'
        },
    ];

    const debtors = [
        { name: 'Acme Corp', amount: '$1,250', phone: '9876543210' },
        { name: 'Global Tech', amount: '$850', phone: '9876543211' },
        { name: 'Stark Ind.', amount: '$420', phone: '9876543212' },
        { name: 'Wayne Ent.', amount: '$2,100', phone: '9876543213' },
    ];

    return (
        <div className="min-h-screen bg-white pb-12 page-container">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">Dashboard Overview</h1>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 bg-white border border-tertiary/60 text-secondary rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                            Download Report
                        </button>
                    </div>
                </div>

                {/* Top Stat Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
                    {stats.map((stat, index) => (
                        <div key={index} className="bg-white rounded-2xl shadow-sm border border-tertiary/30 p-5 hover:shadow-md hover:border-tertiary/60 transition-all group">
                            <div className="flex items-start justify-between">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-gray-900 group-hover:bg-primary group-hover:text-white transition-colors duration-300 shadow-sm">
                                    <stat.icon size={20} />
                                </div>
                                <button className="text-tertiary hover:text-gray-900 transition-colors">
                                    <MoreHorizontal size={18} />
                                </button>
                            </div>
                            <div className="mt-4">
                                <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                                <p className="text-xs font-bold text-secondary/70 mt-1 uppercase tracking-wide">{stat.title}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-tertiary/20 flex items-center gap-2">
                                <span className={`flex items-center text-xs font-bold ${stat.isUp ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'} px-1.5 py-0.5 rounded-md`}>
                                    {stat.isUp ? <ArrowUpRight size={14} className="mr-0.5" /> : <ArrowDownRight size={14} className="mr-0.5" />}
                                    {stat.trend}
                                </span>
                                <span className="text-[10px] text-secondary/50 font-medium">vs last month</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* 3 Container Flex Row (Grid layout used for responsiveness) */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Container 1: Most Ordered Items */}
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp size={20} className="text-secondary" />
                                Top Products
                            </h2>
                            <button className="text-xs text-gray-900 font-semibold hover:underline">View All</button>
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            {mostOrdered.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-tertiary/30 group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-tertiary/20 flex-shrink-0 border border-tertiary/40 shadow-sm">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="flex flex-col items-start justify-start text-left">
                                            <p className="text-sm font-semibold text-gray-900 text-left">{item.name}</p>
                                            <p className="text-xs text-secondary/70 mt-0.5 text-left">{item.orders} orders</p>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{item.price}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Container 2: Low Stock Items */}
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <AlertCircle size={20} className="text-amber-500" />
                                Low Stock Alerts
                            </h2>
                            <button className="text-xs text-gray-900 font-semibold hover:underline">Restock</button>
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            {lowStock.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50/50 transition-colors border border-transparent hover:border-amber-100 group">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-amber-50 flex-shrink-0 border border-amber-200/60 shadow-sm">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                            {/* <p className="text-xs text-secondary/70 mt-0.5">
                                                Stock: <span className={`font-semibold ${item.stock < 10 ? 'text-rose-600' : 'text-amber-600'}`}>{item.stock}</span>
                                            </p> */}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2.5 w-28 justify-end flex-shrink-0">
                                        {/* <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${item.stock < 10 ? 'bg-rose-500' : 'bg-amber-500'}`} 
                                                style={{ width: `${Math.min((item.stock / item.threshold) * 100, 100)}%` }}
                                            ></div>
                                        </div> */}
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-md min-w-[28px] text-center ${item.stock < 10 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                            {item.stock}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Container 3: Debtors */}
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <UserX size={20} className="text-rose-500" />
                                Outstanding Debtors
                            </h2>
                            <button className="text-xs text-gray-900 font-semibold hover:underline">Send Reminders</button>
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            {debtors.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-rose-50/50 transition-colors border border-transparent hover:border-rose-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold shadow-sm">
                                            {item.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                                            <div className="flex items-center mt-0.5 gap-1.5">
                                                <p className={`text-xs ${item.due === 'Overdue' ? 'text-rose-600 font-bold' : 'text-secondary/80 font-medium'}`}>
                                                    {item.phone}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <span className="text-sm font-bold text-rose-600">{item.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

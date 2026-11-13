import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ShoppingCart,
    Users,
    Package,
    TrendingUp,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    AlertCircle,
    UserX,
    MoreHorizontal,
    IndianRupee,
    FileText
} from 'lucide-react';
import { 
    doc, 
    collection, 
    onSnapshot, 
    query, 
    orderBy, 
    limit 
} from 'firebase/firestore';
import { db } from '../Config/Firebase';

const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(Number(val || 0));

export default function Dashboard() {
    const navigate = useNavigate();

    // 1. Overview state
    const [overview, setOverview] = useState({
        totalOrders: 0,
        totalUsers: 0,
        totalProducts: 0,
        totalRevenue: 0,
        itemsSold: 0,
        netProfit: 0,
        trends: {
            revenueGrowth: "+0.0%",
            profitGrowth: "+0.0%",
            orderGrowth: "+0.0%",
            unitsGrowth: "+0.0%",
            usersGrowth: "+0.0%",
            productsGrowth: "+0.0%"
        }
    });

    // 2. Top products state
    const [mostOrdered, setMostOrdered] = useState([]);

    // 3. Low stock state
    const [lowStock, setLowStock] = useState([]);

    // 4. Debtors state
    const [debtors, setDebtors] = useState([]);

    // Firestore listener: Overview doc
    useEffect(() => {
        const unsubscribeOverview = onSnapshot(
            doc(db, "analytics", "overview"),
            (docSnap) => {
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setOverview({
                        totalOrders: data.totalOrders ?? 0,
                        totalUsers: data.totalUsers ?? 0,
                        totalProducts: data.totalProducts ?? 0,
                        totalRevenue: data.totalRevenue ?? 0,
                        itemsSold: data.itemsSold ?? 0,
                        netProfit: data.netProfit ?? data.totalProfit ?? 0,
                        trends: {
                            revenueGrowth: data.trends?.revenueGrowth || "+0.0%",
                            profitGrowth: data.trends?.profitGrowth || "+0.0%",
                            orderGrowth: data.trends?.orderGrowth || "+0.0%",
                            unitsGrowth: data.trends?.unitsGrowth || "+0.0%",
                            usersGrowth: data.trends?.usersGrowth || "+0.0%",
                            productsGrowth: data.trends?.productsGrowth || "+0.0%",
                        },
                    });
                }
            },
            (error) => {
                console.error("Dashboard overview subscription error:", error);
            }
        );

        return () => unsubscribeOverview();
    }, []);

    // Firestore listener: Top Products from analytics_products
    useEffect(() => {
        const topProductsQuery = query(
            collection(db, "analytics_products"),
            orderBy("quantity", "desc"),
            limit(4)
        );

        const unsubscribeProducts = onSnapshot(
            topProductsQuery,
            (snapshot) => {
                if (!snapshot.empty) {
                    const list = snapshot.docs.map((docSnap) => {
                        const data = docSnap.data();
                        return {
                            name: data.name || docSnap.id,
                            orders: `${Number(data.quantity || 0).toLocaleString("en-IN")} sold`,
                            price: formatCurrency(data.revenue || 0),
                            image: data.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&h=200',
                        };
                    });
                    setMostOrdered(list);
                } else {
                    setMostOrdered([]);
                }
            },
            (error) => {
                console.warn("Top products query error:", error.message);
            }
        );

        return () => unsubscribeProducts();
    }, []);

    // Firestore listener: Low stock products
    useEffect(() => {
        const unsubscribeProductsStock = onSnapshot(
            collection(db, "products"),
            (snapshot) => {
                if (!snapshot.empty) {
                    const lowStockList = [];
                    snapshot.docs.forEach((docSnap) => {
                        const data = docSnap.data();
                        const stock = Number(data.stock ?? data.productStock ?? 0);
                        const threshold = Number(data.threshold ?? data.lowStockThreshold ?? 10);
                        if (stock <= threshold) {
                            lowStockList.push({
                                name: data.productName || data.name || "Product",
                                stock,
                                threshold,
                                image: Array.isArray(data.images) && data.images[0]
                                    ? data.images[0]
                                    : (data.productImage || 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?auto=format&fit=crop&w=200&h=200'),
                            });
                        }
                    });

                    if (lowStockList.length > 0) {
                        lowStockList.sort((a, b) => a.stock - b.stock);
                        setLowStock(lowStockList.slice(0, 4));
                    } else {
                        setLowStock([]);
                    }
                } else {
                    setLowStock([]);
                }
            },
            (error) => {
                console.warn("Products stock query warning:", error.message);
            }
        );

        return () => unsubscribeProductsStock();
    }, []);

    // Firestore listener: Debtors from user_ledgers
    useEffect(() => {
        const debtorsQuery = query(
            collection(db, "user_ledgers"),
            orderBy("payableAmount", "desc"),
            limit(4)
        );

        const unsubscribeDebtors = onSnapshot(
            debtorsQuery,
            (snapshot) => {
                if (!snapshot.empty) {
                    const list = snapshot.docs
                        .map((docSnap) => {
                            const data = docSnap.data();
                            const payable = Number(data.payableAmount || 0);
                            return {
                                name: data.name || "Customer",
                                amount: formatCurrency(payable),
                                phone: data.phone || data.mobile || "—",
                                payable,
                            };
                        })
                        .filter((item) => item.payable > 0);

                    setDebtors(list.slice(0, 4));
                } else {
                    setDebtors([]);
                }
            },
            (error) => {
                console.warn("User ledgers query warning:", error.message);
            }
        );

        return () => unsubscribeDebtors();
    }, []);

    // Format top stat cards
    const stats = [
        {
            title: 'Total Orders',
            value: Number(overview.totalOrders || 0).toLocaleString("en-IN"),
            icon: ShoppingCart,
            trend: overview.trends?.orderGrowth || '+0.0%',
            isUp: !(overview.trends?.orderGrowth || '').startsWith('-'),
        },
        {
            title: 'Total Users',
            value: Number(overview.totalUsers || 0).toLocaleString("en-IN"),
            icon: Users,
            trend: overview.trends?.usersGrowth || '+0.0%',
            isUp: !(overview.trends?.usersGrowth || '').startsWith('-'),
        },
        {
            title: 'Total Products',
            value: Number(overview.totalProducts || 0).toLocaleString("en-IN"),
            icon: Package,
            trend: overview.trends?.productsGrowth || '+0.0%',
            isUp: !(overview.trends?.productsGrowth || '').startsWith('-'),
        },
        {
            title: 'Total Sales',
            value: formatCurrency(overview.totalRevenue),
            icon: IndianRupee,
            trend: overview.trends?.revenueGrowth || '+0.0%',
            isUp: !(overview.trends?.revenueGrowth || '').startsWith('-'),
        },
        {
            title: 'Items Sold',
            value: Number(overview.itemsSold || 0).toLocaleString("en-IN"),
            icon: TrendingUp,
            trend: overview.trends?.unitsGrowth || '+0.0%',
            isUp: !(overview.trends?.unitsGrowth || '').startsWith('-'),
        },
        {
            title: 'Total Profit',
            value: formatCurrency(overview.netProfit),
            icon: Activity,
            trend: overview.trends?.profitGrowth || '+0.0%',
            isUp: !(overview.trends?.profitGrowth || '').startsWith('-'),
        },
    ];

    return (
        <div className="min-h-screen bg-white pb-12 page-container">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header Area */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Dashboard Overview
                        </h1>
                        <p className="mt-1 text-xs text-secondary/70">
                            Real-time store performance, product sales, and financial summary
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <button 
                            type="button"
                            onClick={() => navigate('/reports')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-tertiary/60 text-secondary rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                            <FileText size={15} />
                            <span>Financial Reports</span>
                        </button>
                        <button 
                            type="button"
                            onClick={() => navigate('/analytics')}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-900/20 active:scale-95"
                        >
                            <TrendingUp size={15} />
                            <span>Detailed Analytics</span>
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
                                <button 
                                    type="button"
                                    onClick={() => navigate('/analytics')}
                                    className="text-tertiary hover:text-gray-900 transition-colors"
                                    aria-label="View more details"
                                >
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

                {/* 3 Container Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Container 1: Most Ordered Items */}
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <TrendingUp size={20} className="text-secondary" />
                                Top Products
                            </h2>
                            <button 
                                type="button"
                                onClick={() => navigate('/analytics')}
                                className="text-xs text-gray-900 font-semibold hover:underline"
                            >
                                View All
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            {mostOrdered.length > 0 ? (
                                mostOrdered.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-tertiary/30 group">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-tertiary/20 flex-shrink-0 border border-tertiary/40 shadow-sm">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="flex flex-col items-start justify-start text-left truncate">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                                <p className="text-xs text-secondary/70 mt-0.5">{item.orders}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900 ml-2 shrink-0">{item.price}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-1 items-center justify-center py-8 text-center text-xs text-slate-400">
                                    No sales recorded yet
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Container 2: Low Stock Items */}
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <AlertCircle size={20} className="text-amber-500" />
                                Low Stock Alerts
                            </h2>
                            <button 
                                type="button"
                                onClick={() => navigate('/products/stock')}
                                className="text-xs text-gray-900 font-semibold hover:underline"
                            >
                                Restock
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            {lowStock.length > 0 ? (
                                lowStock.map((item, idx) => (
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
                                                <p className="text-xs text-secondary/70 mt-0.5">
                                                    Threshold: <span className="font-semibold text-slate-600">{item.threshold}</span>
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2.5 w-20 justify-end flex-shrink-0">
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-md min-w-[28px] text-center ${item.stock < 5 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {item.stock} left
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-1 items-center justify-center py-8 text-center text-xs text-slate-400">
                                    All products are sufficiently stocked
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Container 3: Debtors */}
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <UserX size={20} className="text-rose-500" />
                                Outstanding Debtors
                            </h2>
                            <button 
                                type="button"
                                onClick={() => navigate('/customer-ledger')}
                                className="text-xs text-gray-900 font-semibold hover:underline"
                            >
                                View Ledger
                            </button>
                        </div>
                        <div className="flex-1 flex flex-col gap-3">
                            {debtors.length > 0 ? (
                                debtors.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl hover:bg-rose-50/50 transition-colors border border-transparent hover:border-rose-100">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold shadow-sm shrink-0">
                                                {item.name.charAt(0)}
                                            </div>
                                            <div className="truncate">
                                                <p className="text-sm font-semibold text-gray-900 truncate">{item.name}</p>
                                                <p className="text-xs text-secondary/80 font-medium mt-0.5">
                                                    {item.phone}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-rose-600 ml-2 shrink-0">{item.amount}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="flex flex-1 items-center justify-center py-8 text-center text-xs text-slate-400">
                                    No outstanding customer receivables
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

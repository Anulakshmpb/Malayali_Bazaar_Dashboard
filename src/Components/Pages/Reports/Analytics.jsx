import React, { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import {
    FaArrowDown,
    FaArrowUp,
    FaBox,
    FaCalendarAlt,
    FaChartLine,
    FaDownload,
    FaShoppingBag,
    FaWallet,
} from "react-icons/fa";
import { 
    doc, 
    collection, 
    onSnapshot, 
    query, 
    orderBy 
} from "firebase/firestore";
import { db } from "../../Config/Firebase";

// ── Helpers ───────────────────────────────────────────────────────
const currency = (v) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(v || 0));

function downloadCsv(rows, filename) {
    const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: filename });
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

// ── Tooltip ───────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-xl">
            <p className="mb-2 border-b border-slate-100 pb-2 text-sm font-bold text-gray-900">{label}</p>
            {payload.map((e) => (
                <p key={e.dataKey} className="my-1 text-xs font-semibold" style={{ color: e.color }}>
                    {e.name}: {currency(e.value)}
                </p>
            ))}
        </div>
    );
};

// ── MetricCard ────────────────────────────────────────────────────
function MetricCard({ title, value, detail, trend, isUp, icon: Icon, iconBg, iconColor }) {
    return (
        <div className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-indigo-200 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">{title}</p>
                    <h3 className="mt-2 text-2xl font-extrabold text-slate-900">{value}</h3>
                </div>
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
                    <Icon size={20} className={iconColor} />
                </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                <span className={`inline-flex items-center gap-0.5 rounded-md px-2 py-1 text-xs font-bold ${isUp ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                    {isUp ? <FaArrowUp size={11} /> : <FaArrowDown size={11} />}
                    {trend}
                </span>
                <span className="text-[11px] text-slate-400">{detail}</span>
            </div>
        </div>
    );
}

// ── AnalyticsChart ────────────────────────────────────────────────
function AnalyticsChart({ title, subtitle, data, revColor, profColor }) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md sm:p-6">
            <div className="mb-5">
                <h2 className="text-base font-bold text-slate-900">{title}</h2>
                <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
            </div>
            <div className="h-[280px] w-full">
                {data && data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }} barGap={4}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                            <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 12 }} dy={6} />
                            <YAxis
                                axisLine={false} tickLine={false}
                                tick={{ fill: "#cbd5e1", fontSize: 11 }}
                                tickFormatter={(v) => v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`}
                                width={54}
                            />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: "#f8fafc", radius: 6 }} />
                            <Legend verticalAlign="bottom" height={32} iconType="circle" wrapperStyle={{ fontSize: "12px", color: "#64748b" }} />
                            <Bar dataKey="revenue" name="Revenue" fill={revColor} radius={[6, 6, 0, 0]} maxBarSize={28} />
                            <Bar dataKey="profit"  name="Profit"  fill={profColor} radius={[6, 6, 0, 0]} maxBarSize={28} />
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex h-full flex-col items-center justify-center text-center text-slate-400">
                        <FaChartLine size={28} className="text-slate-300" />
                        <p className="mt-2 text-xs font-medium">No performance data recorded for this timeframe</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────
export default function Analytics() {
    const [period, setPeriod] = useState("6months");

    // Live Firestore data states
    const [overviewData, setOverviewData] = useState(null);
    const [weeklyData, setWeeklyData] = useState([]);
    const [monthlyData, setMonthlyData] = useState([]);
    const [productsData, setProductsData] = useState([]);

    // 1. Fetch overview document from /analytics/overview
    useEffect(() => {
        const unsubscribe = onSnapshot(
            doc(db, "analytics", "overview"),
            (docSnap) => {
                if (docSnap.exists()) {
                    setOverviewData(docSnap.data());
                }
            },
            (error) => {
                console.warn("Analytics overview subscription error:", error.message);
            }
        );
        return () => unsubscribe();
    }, []);

    // 2. Fetch daily & monthly time-series from /analytics_time_series
    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, "analytics_time_series"),
            (snapshot) => {
                if (!snapshot.empty) {
                    const daily = [];
                    const monthly = [];

                    snapshot.docs.forEach((docSnap) => {
                        const data = docSnap.data();
                        const id = docSnap.id;

                        if (id.startsWith("daily_") || data.date) {
                            daily.push({
                                id,
                                date: data.date || id.replace("daily_", ""),
                                time: data.dayOfWeek || (data.date ? new Date(data.date).toLocaleDateString("en-US", { weekday: "short" }) : "Day"),
                                revenue: Number(data.revenue || 0),
                                profit: Number(data.profit || 0),
                                orders: Number(data.orders || 0),
                            });
                        } else if (id.startsWith("monthly_") || data.month) {
                            monthly.push({
                                id,
                                month: data.month || id.replace("monthly_", ""),
                                time: data.time || (data.month ? new Date(`${data.month}-01`).toLocaleString("en-US", { month: "short" }) : "Month"),
                                revenue: Number(data.revenue || 0),
                                profit: Number(data.profit || 0),
                                orders: Number(data.orders || 0),
                            });
                        }
                    });

                    if (daily.length > 0) {
                        daily.sort((a, b) => a.date.localeCompare(b.date));
                        setWeeklyData(daily.slice(-7));
                    }

                    if (monthly.length > 0) {
                        monthly.sort((a, b) => a.month.localeCompare(b.month));
                        setMonthlyData(monthly);
                    }
                }
            },
            (error) => {
                console.warn("Analytics time-series subscription warning:", error.message);
            }
        );

        return () => unsubscribe();
    }, []);

    // 3. Fetch product-wise sales analytics from /analytics_products
    useEffect(() => {
        const productsQuery = query(
            collection(db, "analytics_products"),
            orderBy("revenue", "desc")
        );

        const unsubscribe = onSnapshot(
            productsQuery,
            (snapshot) => {
                if (!snapshot.empty) {
                    const list = snapshot.docs.map((docSnap) => {
                        const data = docSnap.data();
                        return {
                            name: data.name || docSnap.id,
                            quantity: Number(data.quantity || 0),
                            revenue: Number(data.revenue || 0),
                            profit: Number(data.profit || 0),
                        };
                    });
                    setProductsData(list);
                }
            },
            (error) => {
                console.warn("Analytics products query warning:", error.message);
            }
        );

        return () => unsubscribe();
    }, []);

    const visibleMonthly = useMemo(() => {
        if (period === "3months") return monthlyData.slice(-3);
        if (period === "1month")  return monthlyData.slice(-1);
        return monthlyData;
    }, [period, monthlyData]);

    const totals = useMemo(() => {
        const periodRevenue = visibleMonthly.reduce((s, i) => s + i.revenue, 0);
        const periodProfit = visibleMonthly.reduce((s, i) => s + i.profit, 0);
        const periodOrders = visibleMonthly.reduce((s, i) => s + i.orders, 0);
        const totalUnits = productsData.reduce((s, i) => s + i.quantity, 0);

        return {
            revenue: periodRevenue || overviewData?.totalRevenue || 0,
            profit: periodProfit || overviewData?.netProfit || overviewData?.totalProfit || 0,
            orders: periodOrders || overviewData?.totalOrders || 0,
            quantity: totalUnits || overviewData?.itemsSold || 0,
        };
    }, [visibleMonthly, productsData, overviewData]);

    const totalProductRevenue = useMemo(() => {
        const sum = productsData.reduce((s, i) => s + i.revenue, 0);
        return sum > 0 ? sum : 0;
    }, [productsData]);

    const exportCsv = () => {
        downloadCsv([
            ["Analytics Report", period],
            [],
            ["Month", "Revenue", "Profit", "Orders"],
            ...visibleMonthly.map((i) => [i.time, i.revenue, i.profit, i.orders]),
            [],
            ["Product", "Quantity Sold", "Total Revenue", "Avg Price"],
            ...productsData.map((i) => [i.name, i.quantity, i.revenue, i.quantity ? (i.revenue / i.quantity).toFixed(2) : "0.00"]),
        ], "analytics-report.csv");
    };

    const trends = overviewData?.trends || {
        revenueGrowth: "+0.0%",
        profitGrowth: "+0.0%",
        orderGrowth: "+0.0%",
        unitsGrowth: "+0.0%",
    };

    const metrics = [
        { 
            title: "Total Revenue",  
            value: currency(totals.revenue),                   
            trend: trends.revenueGrowth || "+0.0%", 
            isUp: !(trends.revenueGrowth || "").startsWith("-"),  
            detail: "vs last period", 
            icon: FaWallet,      
            iconBg: "bg-indigo-50",   
            iconColor: "text-indigo-600"  
        },
        { 
            title: "Net Profit",     
            value: currency(totals.profit),                    
            trend: trends.profitGrowth || "+0.0%",  
            isUp: !(trends.profitGrowth || "").startsWith("-"),  
            detail: "vs last period", 
            icon: FaChartLine,   
            iconBg: "bg-emerald-50",  
            iconColor: "text-emerald-600" 
        },
        { 
            title: "Total Orders",   
            value: Number(totals.orders).toLocaleString("en-IN"),      
            trend: trends.orderGrowth || "+0.0%",  
            isUp: !(trends.orderGrowth || "").startsWith("-"),  
            detail: "vs last period", 
            icon: FaShoppingBag, 
            iconBg: "bg-violet-50",   
            iconColor: "text-violet-600"  
        },
        { 
            title: "Units Sold",     
            value: Number(totals.quantity).toLocaleString("en-IN"),    
            trend: trends.unitsGrowth || "+0.0%",  
            isUp: !(trends.unitsGrowth || "").startsWith("-"), 
            detail: "vs last period", 
            icon: FaBox,         
            iconBg: "bg-amber-50",    
            iconColor: "text-amber-600"   
        },
    ];

    return (
        <main className="page-container min-h-screen bg-slate-50/40 pb-12">
            <div className="mx-auto max-w-7xl space-y-7">

                {/* ── Header ── */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="bg-gradient-to-br from-gray-900 to-secondary bg-clip-text text-3xl font-bold tracking-tight text-transparent">
                            Analytics Overview
                        </h1>
                        <p className="mt-1 text-xs text-secondary/70">
                            Aggregated weekly, monthly, and product revenue trends from Firestore
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Period selector */}
                        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                            <FaCalendarAlt size={13} className="text-indigo-500" />
                            <span>Period</span>
                            <select
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer"
                            >
                                <option value="1month">This month</option>
                                <option value="3months">Last 3 months</option>
                                <option value="6months">Last 6 months</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={exportCsv}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 active:scale-95"
                        >
                            <FaDownload size={14} /> Export CSV
                        </button>
                    </div>
                </div>

                {/* ── KPI cards ── */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {metrics.map((m) => <MetricCard key={m.title} {...m} />)}
                </section>

                {/* ── Charts ── */}
                <section className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <AnalyticsChart
                        title="Weekly Performance"
                        subtitle="Daily revenue and profit for the current week"
                        data={weeklyData}
                        revColor="#6366f1"
                        profColor="#10b981"
                    />
                    <AnalyticsChart
                        title="Monthly Performance"
                        subtitle="Revenue and profit over the selected period"
                        data={visibleMonthly}
                        revColor="#8b5cf6"
                        profColor="#06b6d4"
                    />
                </section>

                {/* ── Product table ── */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Product-wise Sales</h2>
                            <p className="mt-0.5 text-xs text-slate-400">Total volume and revenue per product</p>
                        </div>
                        <span className="inline-flex w-fit rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                            {productsData.length} products
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] text-left text-sm">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Product</th>
                                    <th className="px-5 py-4 text-right">Qty Sold</th>
                                    <th className="px-5 py-4 text-right">Revenue</th>
                                    <th className="px-5 py-4 text-right">Avg Price</th>
                                    <th className="px-5 py-4 text-right">Share</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productsData.length > 0 ? (
                                    productsData.map((item) => {
                                        const share = totalProductRevenue > 0
                                            ? ((item.revenue / totalProductRevenue) * 100).toFixed(1)
                                            : "0.0";
                                        return (
                                            <tr key={item.name} className="border-t border-slate-100 transition-colors hover:bg-slate-50/60">
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                            <FaBox size={16} />
                                                        </div>
                                                        <span className="font-semibold text-slate-900">{item.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-right font-medium text-slate-600">{Number(item.quantity).toLocaleString("en-IN")}</td>
                                                <td className="px-5 py-4 text-right font-bold text-slate-900">{currency(item.revenue)}</td>
                                                <td className="px-5 py-4 text-right font-medium text-slate-500">{currency(item.quantity ? item.revenue / item.quantity : 0)}</td>
                                                <td className="px-5 py-4 text-right">
                                                    <div className="inline-flex min-w-[80px] flex-col items-end gap-1.5">
                                                        <span className="text-xs font-bold text-indigo-600">{share}%</span>
                                                        <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                                            <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(Math.max(Number(share), 0), 100)}%` }} />
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-xs text-slate-400">
                                            No product sales data recorded yet
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                            {productsData.length > 0 && (
                                <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                                    <tr>
                                        <td className="px-5 py-4 font-bold text-slate-900">Total</td>
                                        <td className="px-5 py-4 text-right font-bold text-slate-900">{Number(totals.quantity).toLocaleString("en-IN")}</td>
                                        <td className="px-5 py-4 text-right font-bold text-slate-900">{currency(totalProductRevenue)}</td>
                                        <td className="px-5 py-4 text-right font-semibold text-slate-400">—</td>
                                        <td className="px-5 py-4 text-right font-bold text-slate-900">100%</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

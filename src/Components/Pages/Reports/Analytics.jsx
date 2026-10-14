import React, { useMemo, useState } from "react";
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

const WEEKLY_DATA = [
    { time: "Mon", revenue: 12600, profit: 3650, orders: 67 },
    { time: "Tue", revenue: 15300, profit: 4630, orders: 80 },
    { time: "Wed", revenue: 13900, profit: 4140, orders: 73 },
    { time: "Thu", revenue: 19000, profit: 5770, orders: 98 },
    { time: "Fri", revenue: 18700, profit: 5590, orders: 97 },
    { time: "Sat", revenue: 24300, profit: 7440, orders: 127 },
    { time: "Sun", revenue: 22100, profit: 6680, orders: 114 },
];

const ALL_MONTHLY = [
    { time: "May", revenue: 180000, profit: 53000, orders: 958 },
    { time: "Jun", revenue: 193400, profit: 58000, orders: 1023 },
    { time: "Jul", revenue: 186800, profit: 55600, orders: 987 },
    { time: "Aug", revenue: 210800, profit: 63200, orders: 1112 },
    { time: "Sep", revenue: 226900, profit: 68300, orders: 1193 },
    { time: "Oct", revenue: 70431, profit: 19850, orders: 380 },
];

const PRODUCT_DATA = [
    { name: "Fresh Whole Milk (1L)",       quantity: 2070, revenue: 144900 },
    { name: "Farm Fresh Eggs (12 pcs)",    quantity: 1250, revenue: 100000 },
    { name: "Basmati Rice (5kg)",          quantity: 735,  revenue: 132300 },
    { name: "Organic Bananas (1kg)",       quantity: 1690, revenue: 84500  },
    { name: "Whole Wheat Bread",           quantity: 1155, revenue: 57750  },
];

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
            </div>
        </div>
    );
}

// ── Main component ────────────────────────────────────────────────
export default function Analytics() {
    const [period, setPeriod] = useState("6months");

    const visibleMonthly = useMemo(() => {
        if (period === "3months") return ALL_MONTHLY.slice(-3);
        if (period === "1month")  return ALL_MONTHLY.slice(-1);
        return ALL_MONTHLY;
    }, [period]);

    const totals = useMemo(() => ({
        revenue:  visibleMonthly.reduce((s, i) => s + i.revenue, 0),
        profit:   visibleMonthly.reduce((s, i) => s + i.profit,  0),
        orders:   visibleMonthly.reduce((s, i) => s + i.orders,  0),
        quantity: PRODUCT_DATA.reduce((s, i) => s + i.quantity,  0),
    }), [visibleMonthly]);

    const totalProductRevenue = PRODUCT_DATA.reduce((s, i) => s + i.revenue, 0);

    const exportCsv = () => {
        downloadCsv([
            ["Analytics Report", period],
            [],
            ["Month", "Revenue", "Profit", "Orders"],
            ...visibleMonthly.map((i) => [i.time, i.revenue, i.profit, i.orders]),
            [],
            ["Product", "Quantity Sold", "Total Revenue", "Avg Price"],
            ...PRODUCT_DATA.map((i) => [i.name, i.quantity, i.revenue, i.quantity ? (i.revenue / i.quantity).toFixed(2) : "0.00"]),
        ], "analytics-report.csv");
    };

    const metrics = [
        { title: "Total Revenue",  value: currency(totals.revenue),                   trend: "+12.8%", isUp: true,  detail: "vs last period", icon: FaWallet,      iconBg: "bg-indigo-50",   iconColor: "text-indigo-600"  },
        { title: "Net Profit",     value: currency(totals.profit),                    trend: "+8.4%",  isUp: true,  detail: "vs last period", icon: FaChartLine,   iconBg: "bg-emerald-50",  iconColor: "text-emerald-600" },
        { title: "Total Orders",   value: totals.orders.toLocaleString("en-IN"),      trend: "+6.2%",  isUp: true,  detail: "vs last period", icon: FaShoppingBag, iconBg: "bg-violet-50",   iconColor: "text-violet-600"  },
        { title: "Units Sold",     value: totals.quantity.toLocaleString("en-IN"),    trend: "-2.1%",  isUp: false, detail: "vs last period", icon: FaBox,         iconBg: "bg-amber-50",    iconColor: "text-amber-600"   },
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
                        data={WEEKLY_DATA}
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
                        </div>
                        <span className="inline-flex w-fit rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
                            {PRODUCT_DATA.length} products
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
                                {PRODUCT_DATA.map((item) => {
                                    const share = ((item.revenue / totalProductRevenue) * 100).toFixed(1);
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
                                            <td className="px-5 py-4 text-right font-medium text-slate-600">{item.quantity.toLocaleString("en-IN")}</td>
                                            <td className="px-5 py-4 text-right font-bold text-slate-900">{currency(item.revenue)}</td>
                                            <td className="px-5 py-4 text-right font-medium text-slate-500">{currency(item.quantity ? item.revenue / item.quantity : 0)}</td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="inline-flex min-w-[80px] flex-col items-end gap-1.5">
                                                    <span className="text-xs font-bold text-indigo-600">{share}%</span>
                                                    <span className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
                                                        <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${share}%` }} />
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                            <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                                <tr>
                                    <td className="px-5 py-4 font-bold text-slate-900">Total</td>
                                    <td className="px-5 py-4 text-right font-bold text-slate-900">{totals.quantity.toLocaleString("en-IN")}</td>
                                    <td className="px-5 py-4 text-right font-bold text-slate-900">{currency(totalProductRevenue)}</td>
                                    <td className="px-5 py-4 text-right font-semibold text-slate-400">—</td>
                                    <td className="px-5 py-4 text-right font-bold text-slate-900">100%</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

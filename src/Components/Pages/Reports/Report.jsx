import React, { useMemo, useState } from "react";
import {
    FaBuilding,
    FaCalendarAlt,
    FaCheckCircle,
    FaFileAlt,
    FaPrint,
    FaSyncAlt,
    FaShoppingBag,
    FaChartLine,
    FaWallet,
    FaArrowRight,
    FaBoxOpen,
    FaReceipt,
    FaPercentage,
    FaRedoAlt,
} from "react-icons/fa";

const MOCK_REPORT = {
    totalRevenue: 45231.5,
    netProfit: 12450.75,
    totalOrders: 1284,
    itemsSold: 8214,
    grossSubtotal: 43800,
    taxCollected: 2630.5,
    deliveryCharges: 840,
    discounts: 2039,
    costOfGoods: 32780.75,
    orders: [
        {
            id: "ORD-1048",
            date: "2026-10-12",
            customer: "Aarav Nair",
            items: 6,
            amount: 245.5,
            status: "Delivered",
        },
        {
            id: "ORD-1047",
            date: "2026-10-12",
            customer: "Maya Thomas",
            items: 4,
            amount: 182,
            status: "Delivered",
        },
        {
            id: "ORD-1046",
            date: "2026-10-11",
            customer: "Noah Mathew",
            items: 8,
            amount: 395.75,
            status: "Processing",
        },
        {
            id: "ORD-1045",
            date: "2026-10-10",
            customer: "Diya Joseph",
            items: 3,
            amount: 126.25,
            status: "Delivered",
        },
        {
            id: "ORD-1044",
            date: "2026-10-09",
            customer: "Ibrahim Khan",
            items: 5,
            amount: 318,
            status: "Cancelled",
        },
    ],
};

const currency = (value) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const dateLabel = (value) => {
    if (!value) return "Not selected";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

const toInputDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
};

function downloadCsv(rows, filename = "financial-report.csv") {
    const csv = rows
        .map((row) =>
            row
                .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
                .join(",")
        )
        .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = filename;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();

    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function KPI({ title, value, caption, icon: Icon, iconClass }) {
    return (
        <div className="group relative overflow-hidden rounded-2xl border border-tertiary/30 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-tertiary/60 hover:shadow-md sm:p-6">
            <div className="relative z-10 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-secondary/70">
                        {title}
                    </p>

                    <h3 className="mt-3 break-words text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                        {value}
                    </h3>

                    <p className="mt-2 text-xs font-medium text-secondary/60">
                        {caption}
                    </p>
                </div>

                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${iconClass}`}
                >
                    <Icon size={19} />
                </div>
            </div>

            <div className="pointer-events-none absolute -bottom-8 -right-6 h-20 w-20 rounded-full bg-primary/5 transition-transform duration-300 group-hover:scale-150" />
        </div>
    );
}

function SectionHeading({ number, title, description }) {
    return (
        <div className="mb-5 flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-xs font-bold text-gray-900">
                {number}
            </div>

            <div className="min-w-0">
                <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                    {title}
                </h3>

                <p className="mt-1 text-xs leading-relaxed text-secondary/60">
                    {description}
                </p>
            </div>
        </div>
    );
}

function SummaryRow({ label, value, valueClass = "text-gray-900" }) {
    return (
        <div className="flex items-center justify-between gap-4 border-b border-tertiary/20 py-3 last:border-0">
            <span className="text-sm font-medium text-secondary">{label}</span>

            <span
                className={`shrink-0 text-right text-sm font-semibold ${valueClass}`}
            >
                {value}
            </span>
        </div>
    );
}

function StatusBadge({ status }) {
    const statusClasses = {
        Delivered: "bg-emerald-50 text-emerald-700 ring-emerald-600/10",
        Processing: "bg-amber-50 text-amber-700 ring-amber-600/10",
        Cancelled: "bg-rose-50 text-rose-700 ring-rose-600/10",
    };

    const dotClasses = {
        Delivered: "bg-emerald-500",
        Processing: "bg-amber-500",
        Cancelled: "bg-rose-500",
    };

    return (
        <span
            className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-bold ring-1 ring-inset ${statusClasses[status] ||
                "bg-slate-100 text-slate-600 ring-slate-200"
                }`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${dotClasses[status] || "bg-slate-400"
                    }`}
            />
            {status}
        </span>
    );
}

export default function Report() {
    const today = new Date();
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const initialFromDate = toInputDate(firstOfMonth);
    const initialToDate = toInputDate(today);

    const [fromDate, setFromDate] = useState(initialFromDate);
    const [toDate, setToDate] = useState(initialToDate);
    const [loading, setLoading] = useState(false);

    const [generatedRange, setGeneratedRange] = useState({
        from: initialFromDate,
        to: initialToDate,
    });

    const report = useMemo(() => {
        const filteredOrders = MOCK_REPORT.orders.filter(
            (order) =>
                order.date >= generatedRange.from &&
                order.date <= generatedRange.to
        );

        return {
            ...MOCK_REPORT,
            filteredOrders,
        };
    }, [generatedRange]);

    const handleGenerate = () => {
        if (loading) return;

        if (!fromDate || !toDate) {
            window.alert("Please select both the start date and end date.");
            return;
        }

        if (fromDate > toDate) {
            window.alert(
                "The start date must be earlier than or equal to the end date."
            );
            return;
        }

        setLoading(true);

        window.setTimeout(() => {
            setGeneratedRange({
                from: fromDate,
                to: toDate,
            });

            setLoading(false);
        }, 300);
    };

    const handleReset = () => {
        if (loading) return;

        setFromDate(initialFromDate);
        setToDate(initialToDate);

        setGeneratedRange({
            from: initialFromDate,
            to: initialToDate,
        });
    };

    const exportCsv = () => {
        const rows = [
            ["Financial Report"],
            [
                "Period",
                dateLabel(generatedRange.from),
                "to",
                dateLabel(generatedRange.to),
            ],
            [],
            ["Metric", "Value"],
            ["Total Sales Revenue", report.totalRevenue],
            ["Net Profit", report.netProfit],
            ["Total Orders", report.totalOrders],
            ["Items Sold", report.itemsSold],
            ["Gross Subtotal", report.grossSubtotal],
            ["Tax Collected", report.taxCollected],
            ["Delivery Charges", report.deliveryCharges],
            ["Discounts", report.discounts],
            ["Cost of Goods Sold", report.costOfGoods],
            [],
            ["Order ID", "Date", "Customer", "Items", "Amount", "Status"],
            ...report.filteredOrders.map((order) => [
                order.id,
                order.date,
                order.customer,
                order.items,
                order.amount,
                order.status,
            ]),
        ];

        downloadCsv(rows);
    };

    const kpis = [
        {
            title: "Total Sales Revenue",
            value: currency(report.totalRevenue),
            caption: "Revenue for selected period",
            icon: FaWallet,
            iconClass: "bg-primary/15 text-gray-900",
        },
        {
            title: "Net Profit",
            value: currency(report.netProfit),
            caption: "After product costs",
            icon: FaChartLine,
            iconClass: "bg-emerald-50 text-emerald-700",
        },
        {
            title: "Total Orders",
            value: report.totalOrders.toLocaleString("en-IN"),
            caption: `${report.itemsSold.toLocaleString("en-IN")} items sold`,
            icon: FaShoppingBag,
            iconClass: "bg-tertiary/30 text-secondary",
        },
        {
            title: "Average Order Value",
            value: currency(
                report.totalOrders
                    ? report.totalRevenue / report.totalOrders
                    : 0
            ),
            caption: "Revenue per order",
            icon: FaCheckCircle,
            iconClass: "bg-amber-50 text-amber-700",
        },
    ];

    const profitMargin = report.totalRevenue
        ? (report.netProfit / report.totalRevenue) * 100
        : 0;

    return (
        <main className="page-container min-h-screen bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <div className="mx-auto max-w-[1440px] space-y-7">

                {/* Page heading and date filters */}
                <header className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between print:hidden">
                    <div>

                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">Financial Reports
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-end gap-3">
                        <label className="flex min-w-[140px] flex-1 flex-col gap-2 sm:flex-none">
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-secondary/70">
                                <FaCalendarAlt size={12} />
                                From date
                            </span>

                            <input
                                type="date"
                                value={fromDate}
                                max={toDate || undefined}
                                onChange={(event) => setFromDate(event.target.value)}
                                className="h-10 w-full rounded-xl border border-tertiary/40 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-[165px]"
                            />
                        </label>

                        <label className="flex min-w-[140px] flex-1 flex-col gap-2 sm:flex-none">
                            <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-secondary/70">
                                <FaCalendarAlt size={12} />
                                To date
                            </span>

                            <input
                                type="date"
                                value={toDate}
                                min={fromDate || undefined}
                                onChange={(event) => setToDate(event.target.value)}
                                className="h-10 w-full rounded-xl border border-tertiary/40 bg-white px-3 text-sm font-medium text-gray-800 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 sm:w-[165px]"
                            />
                        </label>

                        {/* <button
              type="button"
              onClick={handleGenerate}
              disabled={loading}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-gray-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <FaSyncAlt
                size={12}
                className={loading ? "animate-spin" : ""}
              />
              {loading ? "Generating..." : "Generate"}
            </button> */}
                        <button
                            type="button"
                            onClick={exportCsv}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-tertiary/40 bg-white px-4 text-xs font-bold text-secondary shadow-sm transition hover:bg-slate-100 hover:text-gray-900"
                        >
                            <FaFileAlt size={14} />
                            Export CSV
                        </button>

                        <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gray-900 px-4 text-xs font-bold text-white shadow-sm transition hover:bg-gray-800 active:scale-95"
                        >
                            <FaPrint size={14} />
                            Print Report
                        </button>

                        <button
                            type="button"
                            onClick={handleReset}
                            disabled={loading}
                            title="Reset date range"
                            aria-label="Reset date range"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-tertiary/40 bg-white text-secondary transition hover:bg-slate-100 hover:text-gray-900 disabled:opacity-50"
                        >
                            <FaRedoAlt size={13} />
                        </button>
                    </div>
                </header>

                {/* KPI cards */}
                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 print:hidden">
                    {kpis.map((kpi) => (
                        <KPI key={kpi.title} {...kpi} />
                    ))}
                </section>

                {/* Main report card */}
                <section
                    className={`overflow-hidden rounded-2xl border border-tertiary/30 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none ${loading ? "opacity-60" : ""
                        }`}
                >


                    <div className="space-y-8 p-5 sm:p-8">
                        {loading && (
                            <div className="flex items-center justify-center gap-3 rounded-xl border border-tertiary/30 bg-slate-50 py-4 text-sm font-semibold text-secondary">
                                <FaSyncAlt size={15} className="animate-spin" />
                                Updating report preview...
                            </div>
                        )}

                        {/* Operational overview */}
                        <section>
                            <SectionHeading
                                number="01"
                                title="Operational overview"

                            />

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <div className="rounded-xl border border-tertiary/30 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium text-secondary/70">
                                            Orders processed
                                        </span>
                                        <FaShoppingBag size={15} className="text-secondary/50" />
                                    </div>

                                    <p className="mt-3 text-2xl font-bold text-gray-900">
                                        {report.totalOrders.toLocaleString("en-IN")}
                                    </p>

                                    <p className="mt-1 text-[11px] text-secondary/60">
                                        Total recorded orders
                                    </p>
                                </div>

                                <div className="rounded-xl border border-tertiary/30 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium text-secondary/70">
                                            Items sold
                                        </span>
                                        <FaBoxOpen size={15} className="text-secondary/50" />
                                    </div>

                                    <p className="mt-3 text-2xl font-bold text-gray-900">
                                        {report.itemsSold.toLocaleString("en-IN")}
                                    </p>

                                    <p className="mt-1 text-[11px] text-secondary/60">
                                        Total quantity sold
                                    </p>
                                </div>

                                <div className="rounded-xl border border-tertiary/30 bg-slate-50/70 p-4 transition hover:bg-white hover:shadow-sm">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium text-secondary/70">
                                            Average order value
                                        </span>
                                        <FaReceipt size={15} className="text-secondary/50" />
                                    </div>

                                    <p className="mt-3 break-words text-2xl font-bold text-gray-900">
                                        {currency(
                                            report.totalOrders
                                                ? report.totalRevenue / report.totalOrders
                                                : 0
                                        )}
                                    </p>

                                    <p className="mt-1 text-[11px] text-secondary/60">
                                        Revenue per order
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Revenue and profitability */}
                        <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                            <div className="rounded-2xl border border-tertiary/30 p-5 sm:p-6">
                                <SectionHeading
                                    number="02"
                                    title="Revenue breakdown"
                                    description="A detailed view of sales and revenue adjustments."
                                />

                                <SummaryRow
                                    label="Gross subtotal"
                                    value={currency(report.grossSubtotal)}
                                />

                                <SummaryRow
                                    label="Tax collected"
                                    value={`+${currency(report.taxCollected)}`}
                                />

                                <SummaryRow
                                    label="Delivery charges"
                                    value={`+${currency(report.deliveryCharges)}`}
                                />

                                <SummaryRow
                                    label="Discounts applied"
                                    value={`−${currency(report.discounts)}`}
                                    valueClass="text-rose-600"
                                />

                                <div className="mt-4 rounded-xl bg-primary/15 p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <div>
                                            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-700">
                                                Total sales revenue
                                            </p>

                                            <p className="mt-1 text-xs text-secondary/70">
                                                Reported sales
                                            </p>
                                        </div>

                                        <p className="break-words text-right text-lg font-bold text-gray-900 sm:text-xl">
                                            {currency(report.totalRevenue)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-tertiary/30 p-5 sm:p-6">
                                <SectionHeading
                                    number="03"
                                    title="Profitability summary"
                                    description="Understand revenue, product costs, and profit."
                                />

                                <div className="rounded-xl bg-slate-50 p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-xs font-semibold text-secondary/70">
                                                Net profit
                                            </p>

                                            <p className="mt-2 break-words text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                                                {currency(report.netProfit)}
                                            </p>
                                        </div>

                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                                            <FaChartLine size={18} />
                                        </div>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between gap-3">
                                        <span className="text-xs font-medium text-secondary/70">
                                            Profit margin
                                        </span>

                                        <span className="text-sm font-bold text-emerald-700">
                                            {profitMargin.toFixed(2)}%
                                        </span>
                                    </div>

                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200">
                                        <div
                                            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                                            style={{
                                                width: `${Math.min(
                                                    Math.max(profitMargin, 0),
                                                    100
                                                )}%`,
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <SummaryRow
                                        label="Total sales revenue"
                                        value={currency(report.totalRevenue)}
                                    />

                                    <SummaryRow
                                        label="Cost of goods sold"
                                        value={currency(report.costOfGoods)}
                                        valueClass="text-rose-600"
                                    />

                                    <SummaryRow
                                        label="Net profit"
                                        value={currency(report.netProfit)}
                                        valueClass="text-emerald-700"
                                    />
                                </div>

                                <div className="mt-4 flex items-start gap-3 rounded-xl border border-tertiary/30 p-3.5">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-gray-900">
                                        <FaPercentage size={15} />
                                    </div>

                                    <div>
                                        <p className="text-xs font-bold text-gray-900">
                                            Profit performance
                                        </p>

                                        <p className="mt-1 text-[11px] leading-relaxed text-secondary/70">
                                            Net profit represents approximately{" "}
                                            {profitMargin.toFixed(2)}% of reported sales revenue.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Recent orders */}
                        <section>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <SectionHeading
                                    number="04"
                                    title="Recent orders"
                                />

                                <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-lg border border-tertiary/30 bg-slate-50 px-3 py-2 text-xs font-semibold text-secondary">
                                    <FaReceipt size={12} />
                                    {report.filteredOrders.length} sample records
                                </span>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-tertiary/30">
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[720px] text-left text-sm">
                                        <thead className="bg-slate-50">
                                            <tr className="text-[10px] font-bold uppercase tracking-wider text-secondary/70">
                                                <th className="px-5 py-4">Order details</th>
                                                <th className="px-4 py-4">Date</th>
                                                <th className="px-4 py-4">Customer</th>
                                                <th className="px-4 py-4 text-center">Items</th>
                                                <th className="px-4 py-4 text-right">Amount</th>
                                                <th className="px-5 py-4">Status</th>
                                            </tr>
                                        </thead>

                                        <tbody className="divide-y divide-tertiary/20">
                                            {report.filteredOrders.length > 0 ? (
                                                report.filteredOrders.map((order) => (
                                                    <tr
                                                        key={order.id}
                                                        className="transition-colors hover:bg-slate-50/80"
                                                    >
                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-gray-900">
                                                                    <FaShoppingBag size={14} />
                                                                </div>

                                                                <div>
                                                                    <p className="font-bold text-gray-900">
                                                                        {order.id}
                                                                    </p>

                                                                    <p className="mt-0.5 text-[10px] text-secondary/60">
                                                                        Order transaction
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-4 text-xs font-medium text-secondary">
                                                            {dateLabel(order.date)}
                                                        </td>

                                                        <td className="px-4 py-4 font-semibold text-gray-800">
                                                            {order.customer}
                                                        </td>

                                                        <td className="px-4 py-4 text-center text-xs font-semibold text-secondary">
                                                            {order.items}
                                                        </td>

                                                        <td className="whitespace-nowrap px-4 py-4 text-right font-bold text-gray-900">
                                                            {currency(order.amount)}
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <StatusBadge status={order.status} />
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={6} className="px-5 py-14 text-center">
                                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-secondary/60">
                                                            <FaReceipt size={20} />
                                                        </div>

                                                        <p className="mt-4 text-sm font-bold text-gray-900">
                                                            No orders found
                                                        </p>

                                                        <p className="mt-1 text-xs text-secondary/60">
                                                            Select a different date range to view available
                                                            transactions.
                                                        </p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="flex flex-col gap-2 border-t border-tertiary/30 bg-slate-50/70 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
                                    <p className="text-[11px] text-secondary/60">
                                        Displaying sample order records for the selected period.
                                    </p>

                                    <div className="flex items-center gap-2 text-[11px] font-semibold text-secondary/70">
                                        <FaReceipt size={12} />
                                        Order status overview
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Footer */}
                        <footer className="flex flex-col gap-2 border-t border-tertiary/30 pt-5 text-[11px] text-secondary/60 sm:flex-row sm:items-center sm:justify-between">
                            <p>Grocery Store · Financial Report</p>

                            <p>
                                {dateLabel(generatedRange.from)} –{" "}
                                {dateLabel(generatedRange.to)}
                            </p>
                        </footer>
                    </div>
                </section>
            </div>

            {/* Print-only adjustments */}
            <style>{`
        @media print {
          @page {
            size: auto;
            margin: 12mm;
          }

          html,
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          aside,
          nav,
          .sidebar,
          #sidebar,
          .print\\:hidden {
            display: none !important;
          }

          main,
          .page-container {
            width: 100% !important;
            min-height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          main > div {
            max-width: none !important;
            margin: 0 !important;
          }

          button {
            display: none !important;
          }

          .shadow-sm,
          .shadow-md,
          .shadow-lg {
            box-shadow: none !important;
          }

          .overflow-x-auto {
            overflow: visible !important;
          }

          table {
            width: 100% !important;
          }

          thead {
            display: table-header-group;
          }

          tr {
            break-inside: avoid;
          }
        }
      `}</style>
        </main>
    );
}
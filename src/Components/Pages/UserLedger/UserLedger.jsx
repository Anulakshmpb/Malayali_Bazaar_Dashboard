import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Users,
  TrendingUp,
  TrendingDown,
  BookOpen,
  Phone,
  Eye,
  X,
  ArrowUpRight,
  ShoppingBag,
  Wallet,
  RefreshCw,
  ChevronRight,
  CalendarDays,
  Filter,
  CircleDollarSign,
} from "lucide-react";
import CommonTable from "../../Shared/Pages/CommonTable";


const MOCK_LEDGER = [
  {
    id: "CUS001",
    uid: "USR-1001",
    name: "Arun Kumar",
    mobile: "+91 98765 43210",
    orders: 18,
    recievableAmount: 48500,
    paidAmount: 42000,
    payableAmount: 6500,
    updatedAt: new Date("2026-10-12T11:30:00"),
  },
  {
    id: "CUS002",
    uid: "USR-1002",
    name: "Priya Nair",
    mobile: "+91 98470 12345",
    orders: 12,
    recievableAmount: 32500,
    paidAmount: 32500,
    payableAmount: 0,
    updatedAt: new Date("2026-10-12T09:15:00"),
  },
  {
    id: "CUS003",
    uid: "USR-1003",
    name: "Rahul Menon",
    mobile: "+91 98950 67890",
    orders: 24,
    recievableAmount: 76800,
    paidAmount: 60000,
    payableAmount: 16800,
    updatedAt: new Date("2026-10-11T16:45:00"),
  },
  {
    id: "CUS004",
    uid: "USR-1004",
    name: "Sneha Thomas",
    mobile: "+91 95678 12340",
    orders: 9,
    recievableAmount: 21500,
    paidAmount: 19000,
    payableAmount: 2500,
    updatedAt: new Date("2026-10-11T13:20:00"),
  },
  {
    id: "CUS005",
    uid: "USR-1005",
    name: "Vishnu Prasad",
    mobile: "+91 94470 56789",
    orders: 31,
    recievableAmount: 95400,
    paidAmount: 95400,
    payableAmount: 0,
    updatedAt: new Date("2026-10-10T14:10:00"),
  },
  {
    id: "CUS008",
    uid: "USR-1008",
    name: "Meera Suresh",
    mobile: "+91 86060 33445",
    orders: 11,
    recievableAmount: 28700,
    paidAmount: 28700,
    payableAmount: 0,
    updatedAt: new Date("2026-10-07T15:25:00"),
  },
];

// --------------------------------------------------
// FORMATTERS
// --------------------------------------------------

const fmt = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const fmtCompact = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  })}`;

const fmtDate = (value) => {
  if (!value) return "—";

  const date = value?.toDate ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtDateTime = (value) => {
  if (!value) return "—";

  const date = value?.toDate ? value.toDate() : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// --------------------------------------------------
// SUMMARY CARD
// --------------------------------------------------

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  iconStyle,
  valueStyle = "text-main",
}) {
  return (
    <div className="group min-w-0 rounded-2xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted sm:text-sm">
            {title}
          </p>

          <h3
            className={`mt-3 break-words text-xl font-bold tracking-tight sm:text-2xl ${valueStyle}`}
          >
            {value}
          </h3>

          <p className="mt-2 text-xs leading-5 text-muted">{subtitle}</p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconStyle}`}
        >
          <Icon size={19} strokeWidth={2} />
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// CUSTOMER DETAILS MODAL
// --------------------------------------------------

function ViewModal({ customer, onClose }) {
  if (!customer) return null;

  const details = [
    {
      label: "Customer ID",
      value: customer.uid || customer.id,
    },
    {
      label: "Mobile Number",
      value: customer.mobile || "—",
    },
    {
      label: "Total Orders",
      value: customer.orders ?? 0,
    },
    {
      label: "Total Receivable",
      value: fmt(customer.recievableAmount),
      color: "text-blue-600",
    },
    {
      label: "Amount Paid",
      value: fmt(customer.paidAmount),
      color: "text-emerald-600",
    },
    {
      label: "Outstanding Balance",
      value: fmt(customer.payableAmount),
      color:
        Number(customer.payableAmount || 0) > 0
          ? "text-rose-600"
          : "text-emerald-600",
    },
    {
      label: "Last Updated",
      value: fmtDateTime(customer.updatedAt),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="customer-modal-title"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-5 py-5 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg font-bold text-primary">
              {(customer.name || "?").charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <h2
                id="customer-modal-title"
                className="truncate text-lg font-bold text-main"
              >
                {customer.name || "Customer Details"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                Customer ledger overview
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close customer details"
            className="ml-3 rounded-xl p-2 text-muted transition hover:bg-primary/10 hover:text-main"
          >
            <X size={19} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 p-5 sm:p-6">
          <div className="rounded-xl border border-border bg-primary/5 p-4">
            <p className="text-xs font-medium text-muted">Orders</p>
            <p className="mt-2 text-2xl font-bold text-main">
              {customer.orders || 0}
            </p>
          </div>

          <div className="rounded-xl border border-border bg-rose-50 p-4">
            <p className="text-xs font-medium text-rose-600">
              Outstanding
            </p>
            <p className="mt-2 break-words text-lg font-bold text-rose-600">
              {fmtCompact(customer.payableAmount)}
            </p>
          </div>
        </div>

        <div className="px-5 pb-2 sm:px-6">
          {details.map((item) => (
            <div
              key={item.label}
              className="flex items-start justify-between gap-4 border-b border-border py-3.5 last:border-0"
            >
              <span className="text-sm text-muted">{item.label}</span>

              <span
                className={`max-w-[60%] break-words text-right text-sm font-semibold ${item.color || "text-main"
                  }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        <div className="flex justify-end px-5 pb-5 pt-3 sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-main transition hover:bg-primary/5"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// --------------------------------------------------
// MAIN CUSTOMER LEDGER PAGE
// --------------------------------------------------

export default function UserLedger() {
  const navigate = useNavigate();

  const [ledger] = useState(MOCK_LEDGER);
  const [search, setSearch] = useState("");
  const [viewCustomer, setViewCustomer] = useState(null);
  const [balanceFilter, setBalanceFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();

    let result = ledger.filter((customer) => {
      const matchesSearch =
        (customer.name || "").toLowerCase().includes(term) ||
        (customer.mobile || "").toLowerCase().includes(term) ||
        (customer.uid || "").toLowerCase().includes(term) ||
        (customer.id || "").toLowerCase().includes(term);

      const balance = Number(customer.payableAmount || 0);

      const matchesBalance =
        balanceFilter === "all" ||
        (balanceFilter === "due" && balance > 0) ||
        (balanceFilter === "paid" && balance === 0);

      return matchesSearch && matchesBalance;
    });

    result = [...result].sort((a, b) => {
      if (sortOrder === "highestDue") {
        return (
          Number(b.payableAmount || 0) -
          Number(a.payableAmount || 0)
        );
      }

      if (sortOrder === "mostOrders") {
        return Number(b.orders || 0) - Number(a.orders || 0);
      }

      const dateA = a.updatedAt
        ? new Date(a.updatedAt).getTime()
        : 0;

      const dateB = b.updatedAt
        ? new Date(b.updatedAt).getTime()
        : 0;

      return dateB - dateA;
    });

    return result;
  }, [ledger, search, balanceFilter, sortOrder]);

  const totals = useMemo(
    () =>
      ledger.reduce(
        (acc, customer) => {
          acc.receivable += Number(customer.recievableAmount || 0);
          acc.paid += Number(customer.paidAmount || 0);
          acc.payable += Number(customer.payableAmount || 0);
          acc.orders += Number(customer.orders || 0);

          if (Number(customer.payableAmount || 0) > 0) {
            acc.customersWithDue += 1;
          }

          return acc;
        },
        {
          receivable: 0,
          paid: 0,
          payable: 0,
          orders: 0,
          customersWithDue: 0,
        }
      ),
    [ledger]
  );

  const resetFilters = () => {
    setSearch("");
    setBalanceFilter("all");
    setSortOrder("recent");
  };

  return (
    <main className="min-h-screen bg-background p-4 text-main sm:p-6 lg:p-8">
      <div className="mx-auto w-full max-w-[1600px] space-y-6">

        {/* PAGE HEADER */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text"> Customer Ledger
                </h1>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 self-start rounded-xl border border-border bg-card px-3.5 py-2.5 sm:self-auto">
            <CalendarDays size={16} className="text-muted" />
            <span className="text-sm font-medium text-main">
              {new Date().toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {/* SUMMARY CARDS */}

        <section
          aria-label="Ledger summary"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        >
          <SummaryCard
            title="Total Customers"
            value={ledger.length.toLocaleString("en-IN")}
            subtitle={`${totals.orders.toLocaleString("en-IN")} total orders processed`}
            icon={Users}
            iconStyle="bg-primary/10 text-primary"
          />

          <SummaryCard
            title="Total Receivable"
            value={fmtCompact(totals.receivable)}
            subtitle="Total amount billed to customers"
            icon={TrendingUp}
            iconStyle="bg-blue-50 text-blue-600"
            valueStyle="text-blue-600"
          />

          <SummaryCard
            title="Total Collected"
            value={fmtCompact(totals.paid)}
            subtitle="Payments received from customers"
            icon={Wallet}
            iconStyle="bg-emerald-50 text-emerald-600"
            valueStyle="text-emerald-600"
          />

          <SummaryCard
            title="Outstanding Balance"
            value={fmtCompact(totals.payable)}
            subtitle={`${totals.customersWithDue} customers have pending dues`}
            icon={TrendingDown}
            iconStyle="bg-rose-50 text-rose-600"
            valueStyle="text-rose-600"
          />
        </section>


        <section className="overflow-hidden rounded-2xl border border-border bg-card">

          {/* TABLE HEADER */}

          <div className="border-b border-border p-4 sm:p-5">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-main">
                    Customer Transactions
                  </h2>

                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                    {filtered.length}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <div className="relative min-w-0 sm:w-72">
                  <Search
                    size={17}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                  />

                  <input
                    type="text"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search customers..."
                    aria-label="Search customers"
                    className="w-full rounded-xl border border-border bg-background py-2.5 pl-10 pr-9 text-sm text-main outline-none transition placeholder:text-muted focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />

                  {search && (
                    <button
                      type="button"
                      onClick={() => setSearch("")}
                      aria-label="Clear search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-main"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3.5 py-2.5 text-sm font-semibold text-muted transition hover:bg-primary/5 hover:text-main"
                >
                  <RefreshCw size={15} />
                  Reset
                </button>
              </div>
            </div>

            {/* FILTER CONTROLS */}

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-xs font-semibold text-muted">
                <Filter size={15} />
                Filters
              </div>

              <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                <select
                  value={balanceFilter}
                  onChange={(event) => setBalanceFilter(event.target.value)}
                  aria-label="Filter by payment status"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-main outline-none focus:border-primary sm:w-48"
                >
                  <option value="all">All customers</option>
                  <option value="due">Outstanding only</option>
                  <option value="paid">Fully paid</option>
                </select>

                <select
                  value={sortOrder}
                  onChange={(event) => setSortOrder(event.target.value)}
                  aria-label="Sort customers"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-main outline-none focus:border-primary sm:w-52"
                >
                  <option value="recent">Recently updated</option>
                  <option value="highestDue">Highest outstanding</option>
                  <option value="mostOrders">Most orders</option>
                </select>
              </div>
            </div>
          </div>

          {/* TABLE */}

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Search size={24} />
              </div>

              <h3 className="mt-4 text-base font-bold text-main">
                No customers found
              </h3>

              <p className="mt-1 max-w-sm text-sm text-muted">
                Try another search term or change the selected filters.
              </p>

              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <CommonTable
              title="Customer Ledger"
              subtitle="Review balances, payments, and recent activity"
              columns={[
                {
                  key: "name",
                  header: "Customer",
                  sortable: true,
                  render: (customer) => (
                    <div className="flex min-w-[190px] items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-sm font-bold text-primary">
                        {(customer.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-main">{customer.name || "Unnamed customer"}</p>
                        <p className="mt-1 text-xs text-muted">{customer.uid || customer.id}</p>
                      </div>
                    </div>
                  ),
                },
                { key: "mobile", header: "Mobile", sortable: true, render: (customer) => customer.mobile || "—" },
                { key: "orders", header: "Orders", sortable: true, align: "center" },
                {
                  key: "recievableAmount",
                  header: "Receivable",
                  sortable: true,
                  align: "right",
                  render: (customer) => fmt(customer.recievableAmount),
                  cellClassName: "font-semibold text-blue-600",
                },
                {
                  key: "paidAmount",
                  header: "Paid",
                  sortable: true,
                  align: "right",
                  render: (customer) => fmt(customer.paidAmount),
                  cellClassName: "font-semibold text-emerald-600",
                },
                {
                  key: "payableAmount",
                  header: "Outstanding",
                  sortable: true,
                  align: "right",
                  render: (customer) => {
                    const hasDue = Number(customer.payableAmount || 0) > 0;
                    return (
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-sm font-bold ${hasDue ? "text-rose-600" : "text-emerald-600"}`}>
                          {fmt(customer.payableAmount)}
                        </span>
                        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${hasDue ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {hasDue ? "PAYMENT DUE" : "SETTLED"}
                        </span>
                      </div>
                    );
                  },
                },
                {
                  key: "updatedAt",
                  header: "Last Updated",
                  sortable: true,
                  render: (customer) => (
                    <span className="flex items-center gap-2 text-xs text-muted">
                      <CalendarDays size={14} />
                      {fmtDate(customer.updatedAt)}
                    </span>
                  ),
                },
              ]}
              data={filtered}
              total={filtered.length}
              clientSide
              showSearch={false}
              rowKey="id"
              searchPlaceholder="Search customers..."
              emptyMessage="No customers found"
              emptyDescription="Try another search term or change the selected filters."
              actions={(customer) => (
                <button
                  type="button"
                  onClick={() => navigate("/customer-ledger/view/id")}
                  title="View ledger details"
                  aria-label={`View ledger details for ${customer.name}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-semibold text-main transition hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
                >
                  <Eye size={15} />
                  View
                  <ChevronRight size={13} />
                </button>
              )}
            />
          )}

          {/* TABLE FOOTER */}

          {filtered.length > 0 && (
            <div className="flex flex-col gap-2 border-t border-border bg-background/50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-muted">
                Showing{" "}
                <span className="font-bold text-main">{filtered.length}</span>{" "}
                of{" "}
                <span className="font-bold text-main">{ledger.length}</span>{" "}
                customers
              </p>

              <div className="flex items-center gap-2 text-xs font-medium text-muted">
                <CircleDollarSign size={15} />
                Outstanding in view:{" "}
                <span className="font-bold text-rose-600">
                  {fmtCompact(
                    filtered.reduce(
                      (sum, customer) =>
                        sum + Number(customer.payableAmount || 0),
                      0
                    )
                  )}
                </span>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* CUSTOMER DETAILS MODAL */}

      <ViewModal
        customer={viewCustomer}
        onClose={() => setViewCustomer(null)}
      />
    </main>
  );
}

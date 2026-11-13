
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Search,
  UserRound,
  Phone,
  FileText,
  Printer,
  IndianRupee,
  CreditCard,
  X,
  ShoppingBag,
  Wallet,
  TrendingUp,
  ChevronRight,
  Package,
  CheckCircle2,
  Clock3,
  Filter,
  Download,
  ReceiptText,
} from "lucide-react";
import { doc, onSnapshot, collection, query, where } from "firebase/firestore";
import { db, app } from "../../Config/Firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from "../../Shared/hooks/ToastContext";

const formatCurrency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value) => {
  if (!value) return "—";

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : value instanceof Date
        ? value
        : new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatDateTime = (value) => {
  if (!value) return "—";

  const date =
    typeof value?.toDate === "function"
      ? value.toDate()
      : new Date(value);

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
// REUSABLE COMPONENTS
// --------------------------------------------------

const StatusBadge = ({ status }) => {
  const styles = {
    Paid: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
    Partial: "bg-amber-50 text-amber-700 ring-amber-600/15",
    Pending: "bg-rose-50 text-rose-700 ring-rose-600/15",
  };

  const Icon = status === "Paid" ? CheckCircle2 : Clock3;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${
        styles[status] || styles.Pending
      }`}
    >
      <Icon size={12} />
      {status}
    </span>
  );
};

// --------------------------------------------------
// MAIN PAGE
// --------------------------------------------------

export default function ViewLedger() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { showToast } = useToast();
  const functions = useMemo(() => getFunctions(app, "europe-west1"), []);

  const [customer, setCustomer] = useState({
    id: id || "",
    name: "Customer",
    mobile: "—",
    email: "",
    orders: 0,
    paidAmount: 0,
    recievableAmount: 0,
    payableAmount: 0,
    createdAt: "",
  });

  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState("invoices"); // "invoices" | "payments"

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) => {
      const search = searchTerm.toLowerCase();

      const matchesSearch =
        (sale.billNo || "").toLowerCase().includes(search) ||
        (sale.items || []).some((item) =>
          (item.productName || "").toLowerCase().includes(search)
        );

      const matchesStatus =
        statusFilter === "All" || sale.paymentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sales, searchTerm, statusFilter]);

  const filteredPayments = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return payments.filter((p) => {
      return (
        (p.paymentId || p.id || "").toLowerCase().includes(search) ||
        (p.billNo || "").toLowerCase().includes(search) ||
        (p.paymentMethod || "").toLowerCase().includes(search) ||
        (p.note || "").toLowerCase().includes(search)
      );
    });
  }, [payments, searchTerm]);

  // Fetch real customer from Firestore user_ledgers collection
  useEffect(() => {
    if (!id) return;

    const unsubscribeCustomer = onSnapshot(
      doc(db, "user_ledgers", id),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setCustomer({
            id: docSnap.id,
            name: data.name || "Customer",
            mobile: data.phone || data.mobile || "—",
            email:
              data.email ||
              `${(data.name || "customer")
                .toLowerCase()
                .replace(/[^a-z0-9]/g, "")}@example.com`,
            orders: Number(data.orders || 0),
            paidAmount: Number(data.paidAmount || 0),
            recievableAmount: Number(
              data.receivableAmount ?? data.recievableAmount ?? 0
            ),
            payableAmount: Number(data.payableAmount || 0),
            createdAt: data.createdAt || "2026-01-12",
          });
        }
      },
      (err) => console.warn("Customer ledger query warning:", err.message)
    );

    return () => unsubscribeCustomer();
  }, [id]);

  // Fetch customer orders from Firestore orders collection
  useEffect(() => {
    if (!id) return;

    const mapOrder = (orderDoc) => {
      const data = orderDoc.data();
      return {
        id: orderDoc.id,
        customerId: id,
        billNo: data.orderId || orderDoc.id,
        createdAt:
          data.orderDate ||
          (data.createdAt?.toDate
            ? data.createdAt.toDate().toISOString()
            : new Date().toISOString()),
        items: Array.isArray(data.items)
          ? data.items
          : [
              {
                productName: "Order items",
                quantity: Number(data.totalItems || 1),
                rate: Number(data.totalAmount || 0),
              },
            ],
        subTotal: Number(
          data.grossSubtotal || data.subtotal || data.totalAmount || 0
        ),
        discount: Number(data.discount || 0),
        tax: Number(data.taxCollected || data.tax || 0),
        roundOff: 0,
        grandTotal: Number(data.totalAmount || data.total || 0),
        paidAmount: Number(data.paidAmount || 0),
        paymentStatus:
          data.paymentStatus ||
          (data.status === "Delivered" ? "Paid" : "Partial"),
      };
    };

    let ordersByCustomer = [];
    let ordersByUser = [];

    const mergeAndSet = () => {
      const map = new Map();
      [...ordersByCustomer, ...ordersByUser].forEach((o) => map.set(o.id, o));
      setSales(Array.from(map.values()));
    };

    const q1 = query(collection(db, "orders"), where("customerId", "==", id));
    const unsub1 = onSnapshot(
      q1,
      (snap) => {
        ordersByCustomer = snap.docs.map(mapOrder);
        mergeAndSet();
      },
      (err) => console.warn("Customer orders query warning:", err.message)
    );

    const q2 = query(collection(db, "orders"), where("userId", "==", id));
    const unsub2 = onSnapshot(
      q2,
      (snap) => {
        ordersByUser = snap.docs.map(mapOrder);
        mergeAndSet();
      },
      (err) => console.warn("User orders query warning:", err.message)
    );

    return () => {
      unsub1();
      unsub2();
    };
  }, [id]);

  // Fetch recorded customer payment receipts from /user_ledgers/{id}/payments
  useEffect(() => {
    if (!id) return;

    const paymentsRef = collection(db, "user_ledgers", id, "payments");
    const unsubscribePayments = onSnapshot(
      paymentsRef,
      (snapshot) => {
        const list = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }))
          .sort((a, b) => {
            const tA = a.createdAt?.toDate
              ? a.createdAt.toDate().getTime()
              : new Date(a.createdAt || 0).getTime();
            const tB = b.createdAt?.toDate
              ? b.createdAt.toDate().getTime()
              : new Date(b.createdAt || 0).getTime();
            return tB - tA;
          });
        setPayments(list);
      },
      (err) => console.warn("Customer payments query warning:", err.message)
    );

    return () => unsubscribePayments();
  }, [id]);

  const totalItems = useMemo(
    () =>
      sales.reduce(
        (total, sale) =>
          total +
          (sale.items || []).reduce(
            (count, item) => count + Number(item.quantity || 1),
            0
          ),
        0
      ),
    [sales]
  );

  const totalOutstanding = Number(customer?.recievableAmount || 0);

  // --------------------------------------------------
  // RECORD PAYMENT (VIA CLOUD FUNCTION)
  // --------------------------------------------------

  const handlePayment = async () => {
    const amount = Number(paymentAmount);

    if (!paymentAmount || !Number.isFinite(amount) || amount <= 0) {
      showToast("Please enter a valid payment amount.", "error");
      return;
    }

    setIsProcessingPayment(true);

    try {
      const recordPaymentFn = httpsCallable(functions, "recordCustomerPayment");
      const result = await recordPaymentFn({
        customerId: id,
        amount: Number(amount.toFixed(2)),
        paymentMethod: paymentMethod || "Cash",
        orderId: selectedBill?.id || null,
        billNo:
          selectedBill?.billNo ||
          selectedBill?.invoiceNumber ||
          selectedBill?.id ||
          null,
        note: paymentNote ? paymentNote.trim() : "",
      });

      if (result.data?.success) {
        showToast(
          result.data.message ||
            `Payment of ${formatCurrency(amount)} recorded successfully.`,
          "success"
        );
        setShowPayModal(false);
        setSelectedBill(null);
        setPaymentAmount("");
        setPaymentNote("");
        setPaymentMethod("Cash");
      } else {
        showToast(result.data?.message || "Failed to record payment.", "error");
      }
    } catch (error) {
      console.error("Payment error:", error);
      showToast(error.message || "Failed to record payment.", "error");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const openPaymentModal = (sale = null) => {
    setSelectedBill(sale);
    if (sale) {
      const billTotal = Number(sale.grandTotal || 0);
      const billPaid = Number(sale.paidAmount || 0);
      const billRemaining = Math.max(0, billTotal - billPaid);
      setPaymentAmount(
        billRemaining > 0 ? String(billRemaining) : String(billTotal || "")
      );
    } else {
      setPaymentAmount("");
    }
    setPaymentMethod("Cash");
    setPaymentNote("");
    setShowPayModal(true);
  };

  // --------------------------------------------------
  // PRINT INVOICE
  // --------------------------------------------------

  const handlePrint = (sale) => {
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      showToast("Please allow pop-ups to print the invoice.", "error");
      return;
    }

    const escapeHtml = (value) =>
      String(value ?? "").replace(/[&<>"']/g, (char) => {
        const entities = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        };

        return entities[char];
      });

    const itemsHtml = (sale.items || [])
      .map((item, index) => {
        const quantity = Number(item.quantity || item.cartQty || 1);
        const rate = Number(item.rate || item.offerPrice || 0);

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHtml(item.productName || "Product")}</td>
            <td class="center">${quantity}</td>
            <td class="right">${formatCurrency(rate)}</td>
            <td class="right">${formatCurrency(quantity * rate)}</td>
          </tr>
        `;
      })
      .join("");

    const invoiceNumber = sale.billNo || sale.id;
    const customerName = customer.name || "Customer";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invoice - ${escapeHtml(invoiceNumber)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0;
            padding: 36px;
            color: #1e293b;
            font-family: Arial, sans-serif;
            font-size: 13px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #0f172a;
            padding-bottom: 20px;
            margin-bottom: 25px;
          }
          .brand {
            font-size: 25px;
            font-weight: 800;
            color: #0f766e;
          }
          .muted { color: #64748b; }
          .label {
            margin-bottom: 8px;
            color: #64748b;
            font-size: 10px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          .details {
            display: flex;
            justify-content: space-between;
            gap: 30px;
            margin-bottom: 28px;
          }
          .details p { margin: 5px 0; }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 25px;
          }
          th {
            padding: 12px 9px;
            background: #f1f5f9;
            text-align: left;
            font-size: 11px;
          }
          td {
            padding: 12px 9px;
            border-bottom: 1px solid #e2e8f0;
          }
          .center { text-align: center; }
          .right { text-align: right; }
          .totals {
            width: 280px;
            margin-left: auto;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #e2e8f0;
          }
          .grand {
            font-size: 16px;
            font-weight: bold;
            color: #0f766e;
            border-bottom: 2px solid #0f172a;
          }
          .footer {
            margin-top: 50px;
            padding-top: 15px;
            text-align: center;
            border-top: 1px solid #e2e8f0;
            color: #64748b;
          }
          @media print {
            body { padding: 15px; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">CHEFCO</div>
            <p class="muted">Customer Sales Invoice</p>
          </div>
          <div style="text-align:right">
            <div class="label">Invoice Number</div>
            <strong>${escapeHtml(invoiceNumber)}</strong>
            <p>${escapeHtml(formatDateTime(sale.createdAt))}</p>
          </div>
        </div>

        <div class="details">
          <div>
            <div class="label">Billed To</div>
            <p><strong>${escapeHtml(customerName)}</strong></p>
            <p>${escapeHtml(customer.mobile || "")}</p>
          </div>
          <div>
            <div class="label">Invoice Information</div>
            <p>Items: ${(sale.items || []).length}</p>
            <p>Status: ${escapeHtml(sale.paymentStatus || "Pending")}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th class="center">Qty</th>
              <th class="right">Unit Price</th>
              <th class="right">Amount</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span>Subtotal</span>
            <span>${formatCurrency(sale.subTotal)}</span>
          </div>
          <div class="total-row">
            <span>Discount</span>
            <span>-${formatCurrency(sale.discount)}</span>
          </div>
          <div class="total-row">
            <span>Tax</span>
            <span>${formatCurrency(sale.tax)}</span>
          </div>
          <div class="total-row">
            <span>Round Off</span>
            <span>${formatCurrency(sale.roundOff)}</span>
          </div>
          <div class="total-row grand">
            <span>Grand Total</span>
            <span>${formatCurrency(sale.grandTotal)}</span>
          </div>
        </div>

        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p>Computer-generated invoice.</p>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (!customer) {
    return (
      <main className="min-h-[60vh] bg-slate-50 p-6 sm:p-8">
        <div className="mx-auto flex max-w-md flex-col items-center rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <UserRound size={38} className="text-slate-300" />
          <h2 className="mt-4 text-lg font-bold text-slate-800">
            Customer not found
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            This customer ledger is not available.
          </p>
          <button
            onClick={() => navigate("/customer-ledger")}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            Back to Customer Ledger
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50/80 p-4 text-slate-800 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-[1600px] space-y-6">

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex items-start gap-3">
            <button
              onClick={() => navigate("/customer-ledger")}
              aria-label="Back to customer ledger"
              className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-100"
            >
              <ArrowLeft size={19} />
            </button>

            {/* <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  Rahul Nair
                </h1>
                <span className="rounded-md bg-slate-200/70 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-600">
                  Active
                </span>
              </div>
             
            </div> */}
          </div>

          <div className="flex flex-wrap items-center gap-2 pl-13 sm:pl-0">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
            >
              <Download size={16} />
              Export / Print
            </button>

            <button
              onClick={() => openPaymentModal(null)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90"
            >
              <CreditCard size={16} />
              Record Payment
            </button>
          </div>
        </div>

        {/* CUSTOMER PROFILE */}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">

          <div className="p-5 sm:p-6">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="flex min-w-0 items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-2xl font-bold text-primary ring-1 ring-primary/10">
                  {(customer.name || "C").charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                      {customer.name}
                    </h2>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Active
                    </span>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <Phone size={14} />
                      {customer.mobile || "No mobile number"}
                    </span>

                    {customer.email && (
                      <span className="truncate">{customer.email}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-3 sm:min-w-[310px]">
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex items-center gap-2 text-slate-700">
                    <ShoppingBag size={15} />
                    <span className="text-xs font-medium">Total Orders</span>
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {customer.orders || 0}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <TrendingUp size={15} />
                    <span className="text-xs font-medium">Total Receivable</span>
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatCurrency(customer.recievableAmount || 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Wallet size={15} />
                    <span className="text-xs font-medium">Total Paid</span>
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatCurrency(customer.paidAmount || 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
                  <div className="flex items-center gap-2 text-slate-500">
                    <IndianRupee size={15} />
                    <span className="text-xs font-medium">Payable Due</span>
                  </div>
                  <p className="mt-2 text-xl font-bold text-slate-900">
                    {formatCurrency(customer.payableAmount || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* PURCHASE & PAYMENT HISTORY SECTION */}

        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          {/* TABS HEADER */}
          <div className="flex flex-col justify-between gap-4 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:px-6">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("invoices");
                  setSearchTerm("");
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  activeTab === "invoices"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <ReceiptText size={16} />
                Invoices & Orders
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeTab === "invoices"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {sales.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("payments");
                  setSearchTerm("");
                }}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition ${
                  activeTab === "payments"
                    ? "bg-primary text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <CreditCard size={16} />
                Payment Receipts
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                    activeTab === "payments"
                      ? "bg-white/20 text-white"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {payments.length}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
                {activeTab === "invoices"
                  ? `${filteredSales.length} of ${sales.length} bills`
                  : `${filteredPayments.length} of ${payments.length} receipts`}
              </span>
            </div>
          </div>

          {/* SEARCH AND FILTER */}

          <div className="flex flex-col gap-3 border-b border-slate-100 bg-slate-50/50 p-4 sm:flex-row sm:items-center sm:p-5">
            <div className="relative flex-1">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={
                  activeTab === "invoices"
                    ? "Search invoice number or product..."
                    : "Search receipt ID, invoice number, or note..."
                }
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {activeTab === "invoices" && (
              <div className="relative sm:w-48">
                <Filter
                  size={15}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-slate-600 outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10"
                >
                  <option value="All">All payment statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Partial">Partial</option>
                  <option value="Pending">Pending</option>
                </select>
                <ChevronRight
                  size={15}
                  className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-slate-400"
                />
              </div>
            )}
          </div>

          {/* INVOICES TABLE */}

          {activeTab === "invoices" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Invoice
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Date
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Products
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Subtotal
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Discount
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Tax
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Grand Total
                    </th>
                    <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSales.map((sale) => (
                    <tr
                      key={sale.id}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500 transition group-hover:bg-primary/10 group-hover:text-primary">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="whitespace-nowrap text-sm font-bold text-slate-800">
                              {sale.billNo || sale.id}
                            </p>
                            <p className="mt-1 text-[11px] text-slate-400">
                              {(sale.items || []).length} products
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {formatDate(sale.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex max-w-[220px] flex-col gap-1.5">
                          {(sale.items || []).slice(0, 2).map((item, index) => (
                            <div
                              key={`${sale.id}-${index}`}
                              className="flex items-center gap-2 text-xs text-slate-600"
                            >
                              <Package
                                size={13}
                                className="shrink-0 text-slate-400"
                              />
                              <span className="truncate">
                                {item.quantity || 1} × {item.productName}
                              </span>
                            </div>
                          ))}

                          {(sale.items || []).length > 2 && (
                            <span className="pl-5 text-[11px] font-semibold text-primary">
                              +{sale.items.length - 2} more items
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-slate-500">
                        {formatCurrency(sale.subTotal)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-medium text-rose-500">
                        -{formatCurrency(sale.discount)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm text-slate-500">
                        {formatCurrency(sale.tax)}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <span className="text-sm font-bold text-slate-900">
                          {formatCurrency(sale.grandTotal)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={sale.paymentStatus || "Pending"} />
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openPaymentModal(sale)}
                            title="Record payment"
                            aria-label={`Record payment for ${sale.billNo}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600"
                          >
                            <CreditCard size={15} />
                          </button>

                          <button
                            onClick={() => handlePrint(sale)}
                            title="Print invoice"
                            aria-label={`Print ${sale.billNo}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-primary/20 hover:bg-primary/5 hover:text-primary"
                          >
                            <Printer size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {filteredSales.length === 0 && (
                    <tr>
                      <td colSpan={9} className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <Search size={23} />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-800">
                          No invoices found
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Try changing your search or payment status filter.
                        </p>
                        <button
                          onClick={() => {
                            setSearchTerm("");
                            setStatusFilter("All");
                          }}
                          className="mt-4 text-sm font-semibold text-primary hover:underline"
                        >
                          Clear filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>

                {filteredSales.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50/70">
                      <td
                        colSpan={6}
                        className="px-5 py-4 text-right text-xs font-semibold text-slate-500"
                      >
                        Filtered invoice total
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-slate-900">
                        {formatCurrency(
                          filteredSales.reduce(
                            (total, sale) =>
                              total + Number(sale.grandTotal || 0),
                            0
                          )
                        )}
                      </td>
                      <td colSpan={2} />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* PAYMENT RECEIPTS TABLE */}

          {activeTab === "payments" && (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-white">
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Receipt ID
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Date & Time
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Method
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Linked Invoice
                    </th>
                    <th className="px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Note / Reference
                    </th>
                    <th className="px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Amount Paid
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredPayments.map((p) => (
                    <tr
                      key={p.id || p.paymentId}
                      className="group transition-colors hover:bg-slate-50/80"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 transition group-hover:bg-emerald-100">
                            <CreditCard size={16} />
                          </div>
                          <div>
                            <p className="whitespace-nowrap font-mono text-xs font-bold text-slate-800">
                              {p.paymentId || p.id}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              Receipt
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                        {formatDateTime(p.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                          {p.paymentMethod || "Cash"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-sm text-slate-600">
                        {p.billNo || p.orderId ? (
                          <span className="inline-flex items-center gap-1.5 font-semibold text-primary">
                            <FileText size={13} />
                            {p.billNo || p.orderId}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">
                            General ledger payment
                          </span>
                        )}
                      </td>

                      <td className="max-w-[220px] truncate px-5 py-4 text-sm text-slate-500">
                        {p.note || "—"}
                      </td>

                      <td className="whitespace-nowrap px-5 py-4 text-right">
                        <span className="text-sm font-bold text-emerald-600">
                          +{formatCurrency(p.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}

                  {filteredPayments.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                          <CreditCard size={23} />
                        </div>
                        <h3 className="mt-4 text-sm font-bold text-slate-800">
                          No payment receipts found
                        </h3>
                        <p className="mt-1 text-sm text-slate-500">
                          Payments recorded for this customer will appear here.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>

                {filteredPayments.length > 0 && (
                  <tfoot>
                    <tr className="border-t border-slate-200 bg-slate-50/70">
                      <td
                        colSpan={5}
                        className="px-5 py-4 text-right text-xs font-semibold text-slate-500"
                      >
                        Total Recorded Payments
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-emerald-600">
                        +{formatCurrency(
                          filteredPayments.reduce(
                            (sum, p) => sum + Number(p.amount || 0),
                            0
                          )
                        )}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}

          {/* TABLE FOOTER */}

          <div className="flex flex-col justify-between gap-2 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center">
            {activeTab === "invoices" ? (
              <>
                <p className="text-xs text-slate-400">
                  Showing {filteredSales.length} invoice
                  {filteredSales.length !== 1 ? "s" : ""}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ShoppingBag size={14} />
                  {totalItems} items across all invoices
                </p>
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">
                  Showing {filteredPayments.length} payment receipt
                  {filteredPayments.length !== 1 ? "s" : ""}
                </p>
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Wallet size={14} />
                  Cumulative paid: {formatCurrency(customer.paidAmount)}
                </p>
              </>
            )}
          </div>
        </section>

        {/* PAYMENT MODAL */}

        {showPayModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/40 p-4 backdrop-blur-[3px]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !isProcessingPayment) {
                setShowPayModal(false);
              }
            }}
          >
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="payment-modal-title"
              className="my-auto w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
            >
              {/* Modal header */}

              <div className="flex items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <CreditCard size={21} />
                  </div>
                  <div>
                    <h3
                      id="payment-modal-title"
                      className="text-lg font-bold text-slate-900"
                    >
                      Record Payment
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">
                      Record a customer payment and update ledger balances.
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowPayModal(false)}
                  disabled={isProcessingPayment}
                  aria-label="Close payment modal"
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                >
                  <X size={19} />
                </button>
              </div>

              <div className="space-y-4 p-5 sm:p-6">
                {/* Selected invoice */}

                {selectedBill && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm">
                        <ReceiptText size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-slate-500">
                          Selected invoice
                        </p>
                        <p className="mt-1 text-sm font-bold text-slate-800">
                          {selectedBill.billNo}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Bill total</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatCurrency(selectedBill.grandTotal)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Balance summary */}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3.5">
                    <p className="text-xs font-medium text-amber-700">
                      Receivable
                    </p>
                    <p className="mt-1.5 break-words text-lg font-bold text-amber-700">
                      {formatCurrency(customer.recievableAmount)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-amber-700/70">
                      Amount to collect
                    </p>
                  </div>

                  <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-3.5">
                    <p className="text-xs font-medium text-rose-700">
                      Payable / Advance
                    </p>
                    <p className="mt-1.5 break-words text-lg font-bold text-rose-700">
                      {formatCurrency(customer.payableAmount)}
                    </p>
                    <p className="mt-0.5 text-[11px] text-rose-700/70">
                      Customer credit
                    </p>
                  </div>
                </div>

                {/* Payment amount */}

                <div>
                  <label
                    htmlFor="paymentAmount"
                    className="mb-1.5 block text-sm font-semibold text-slate-700"
                  >
                    Payment Amount <span className="text-rose-500">*</span>
                  </label>

                  <div className="relative">
                    <IndianRupee
                      size={17}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      id="paymentAmount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      inputMode="decimal"
                      autoFocus
                      value={paymentAmount}
                      onChange={(event) =>
                        setPaymentAmount(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter" && !isProcessingPayment) {
                          handlePayment();
                        }
                      }}
                      placeholder="Enter payment amount"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-lg font-bold text-slate-900 outline-none transition placeholder:text-sm placeholder:font-normal focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                  </div>

                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {selectedBill && Number(selectedBill.grandTotal || 0) > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          const billTotal = Number(selectedBill.grandTotal || 0);
                          const billPaid = Number(selectedBill.paidAmount || 0);
                          const due = Math.max(0, billTotal - billPaid);
                          setPaymentAmount(String(due > 0 ? due : billTotal));
                        }}
                        className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition hover:bg-primary/20"
                      >
                        Full bill amount (
                        {formatCurrency(
                          Math.max(
                            0,
                            Number(selectedBill.grandTotal || 0) -
                              Number(selectedBill.paidAmount || 0)
                          ) || selectedBill.grandTotal
                        )}
                        )
                      </button>
                    )}

                    {totalOutstanding > 0 && (
                      <button
                        type="button"
                        onClick={() =>
                          setPaymentAmount(String(totalOutstanding))
                        }
                        className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        Full receivable ({formatCurrency(totalOutstanding)})
                      </button>
                    )}
                  </div>
                </div>

                {/* Payment Method */}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600">
                    Payment Method
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "Cash",
                      "UPI",
                      "Bank Transfer",
                      "Credit Card",
                      "Debit Card",
                      "Cheque",
                      "Other",
                    ].map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                          paymentMethod === method
                            ? "border-primary bg-primary text-white shadow-sm"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        {method}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note / Reference */}

                <div>
                  <label
                    htmlFor="paymentNote"
                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600"
                  >
                    Note / Reference{" "}
                    <span className="font-normal lowercase text-slate-400">
                      (optional)
                    </span>
                  </label>
                  <input
                    id="paymentNote"
                    type="text"
                    maxLength={500}
                    value={paymentNote}
                    onChange={(event) => setPaymentNote(event.target.value)}
                    placeholder="e.g. UPI Txn ID, cheque no, remark..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10"
                  />
                </div>

                {/* Payment preview */}

                {Number(paymentAmount) > 0 && (
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-3.5">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-slate-600">
                        New receivable balance
                      </span>
                      <span className="font-bold text-slate-900">
                        {formatCurrency(
                          Math.max(
                            0,
                            totalOutstanding - Number(paymentAmount)
                          )
                        )}
                      </span>
                    </div>
                    {Number(paymentAmount) > totalOutstanding &&
                      totalOutstanding > 0 && (
                        <p className="mt-1.5 text-xs leading-5 text-slate-500">
                          Excess ₹
                          {(
                            Number(paymentAmount) - totalOutstanding
                          ).toLocaleString("en-IN")}{" "}
                          will be added to customer's payable/credit balance.
                        </p>
                      )}
                  </div>
                )}
              </div>

              {/* Modal actions */}

              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  onClick={() => setShowPayModal(false)}
                  disabled={isProcessingPayment}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handlePayment}
                  disabled={
                    isProcessingPayment ||
                    !paymentAmount ||
                    !Number.isFinite(Number(paymentAmount)) ||
                    Number(paymentAmount) <= 0
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      Confirm Payment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

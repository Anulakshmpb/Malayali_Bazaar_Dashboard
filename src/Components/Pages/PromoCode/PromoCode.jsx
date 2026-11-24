import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, getDocs } from "firebase/firestore";
import {
  Plus,
  Edit,
  Trash2,
  X,
  RefreshCw,
  Loader2,
  Search,
  Tag,
  CalendarDays,
  Eye,
  EyeOff,
  Check,
  Users,
  Package,
  ChevronDown,
} from "lucide-react";

import { app, db } from "../../Config/Firebase";
import CommonTable from "../../Shared/Pages/CommonTable";

const functions = getFunctions(app, "europe-west1");
const initialForm = {
  name: "",
  code: "",
  desc: "",
  discountType: "percentage",
  discountValue: "",
  startDate: "",
  expirationDate: "",
  minimumOrderValue: "0",
  maxDiscountValue: "",
  usageLimit: "1000",
  usagePerUser: "1",
  currentUsage: "",
  eligibleCustomers: [],
  eligibleProducts: [],
  isCommon: false,
  isCustomersOnly: false,
  isSingleUse: false,
  status: true,
  visibility: true,
};

const toDateTimeLocal = (value) => {
  if (!value) return "";
  let date;
  if (value instanceof Date) date = value;
  else if (typeof value?.toDate === "function") date = value.toDate();
  else if (typeof value === "object" && (value.seconds || value._seconds)) {
    date = new Date((value.seconds || value._seconds) * 1000);
  } else {
    date = new Date(value);
  }
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const toIdArray = (value) =>
  Array.isArray(value)
    ? value
    : typeof value === "string"
      ? [...new Set(value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean))]
      : [];

const formatDate = (value) => {
  const local = toDateTimeLocal(value);
  if (!local) return "—";
  const date = new Date(local);
  return date.toLocaleString([], {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const getPromoId = (promo) => promo.promoCodeId || promo.id || promo.docId;

const getErrorMessage = (error) =>
  error?.details?.message || error?.message || "Something went wrong. Please try again.";

export default function PromoCode() {
  const managePromoCode = useMemo(
    () => httpsCallable(functions, "managePromoCode"),
    []
  );

  const [promos, setPromos] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productDropdownOpen, setProductDropdownOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const customerDropdownRef = useRef(null);
  const productDropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        customerDropdownRef.current &&
        !customerDropdownRef.current.contains(event.target)
      ) {
        setCustomerDropdownOpen(false);
      }
      if (
        productDropdownRef.current &&
        !productDropdownRef.current.contains(event.target)
      ) {
        setProductDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadOptions = async () => {
      try {
        const [usersSnap, productsSnap] = await Promise.all([
          getDocs(collection(db, "users")),
          getDocs(collection(db, "products")),
        ]);
        if (!active) return;
        const customerList = usersSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            name: d.name || d.displayName || "Unknown customer",
            email: d.email || "",
            phone: d.phone || d.mobile || "",
          };
        });
        const productList = productsSnap.docs.map((docSnap) => {
          const d = docSnap.data();
          return {
            id: docSnap.id,
            productName: d.productName || d.name || "Unknown product",
            productId: d.productId || d.productSKU || docSnap.id,
            thumbnail: d.thumbnail || d.images?.[0] || "",
          };
        });
        setCustomers(customerList.sort((a, b) => a.name.localeCompare(b.name)));
        setProducts(
          productList.sort((a, b) => a.productName.localeCompare(b.productName))
        );
      } catch (err) {
        console.error("Failed to load users/products for promocode:", err);
      }
    };
    loadOptions();
    return () => {
      active = false;
    };
  }, []);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q)
    );
  }, [customers, customerSearch]);

  const toggleCustomer = (id) => {
    setForm((prev) => {
      const exists = prev.eligibleCustomers.includes(id);
      return {
        ...prev,
        eligibleCustomers: exists
          ? prev.eligibleCustomers.filter((cId) => cId !== id)
          : [...prev.eligibleCustomers, id],
      };
    });
  };

  const handleSelectAllCustomers = (e) => {
    if (e.target.checked) {
      setForm((prev) => ({
        ...prev,
        eligibleCustomers: customers.map((c) => c.id),
      }));
    } else {
      setForm((prev) => ({ ...prev, eligibleCustomers: [] }));
    }
  };

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.productName.toLowerCase().includes(q) ||
        p.productId.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const toggleProduct = (id) => {
    setForm((prev) => {
      const exists = prev.eligibleProducts.includes(id);
      return {
        ...prev,
        eligibleProducts: exists
          ? prev.eligibleProducts.filter((pId) => pId !== id)
          : [...prev.eligibleProducts, id],
      };
    });
  };

  const handleSelectAllProducts = (e) => {
    if (e.target.checked) {
      setForm((prev) => ({
        ...prev,
        eligibleProducts: products.map((p) => p.id),
      }));
    } else {
      setForm((prev) => ({ ...prev, eligibleProducts: [] }));
    }
  };

  const fetchPromos = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await managePromoCode({ action: "list" });
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Unable to load promo codes.");
      }
      const rows = response.data.data || [];
      setPromos(
        [...rows].sort((a, b) => Number(a.order || 0) - Number(b.order || 0))
      );
    } catch (err) {
      console.error("Failed to load promo codes:", err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [managePromoCode]);

  useEffect(() => {
    fetchPromos();
  }, [fetchPromos]);

  const openAddModal = () => {
    setEditingPromo(null);
    setForm(initialForm);
    setError("");
    setNotice("");
    setCustomerSearch("");
    setProductSearch("");
    setCustomerDropdownOpen(false);
    setProductDropdownOpen(false);
    setIsModalOpen(true);
  };

  const openEditModal = (promo) => {
    setEditingPromo(promo);
    setForm({
      name: promo.name || "",
      code: promo.code || "",
      desc: promo.desc || "",
      discountType: promo.discountType || "percentage",
      discountValue: String(promo.discountValue ?? ""),
      startDate: toDateTimeLocal(promo.startDate),
      expirationDate: toDateTimeLocal(promo.expirationDate),
      minimumOrderValue: String(promo.minimumOrderValue ?? promo.minOrderValue ?? 0),
      maxDiscountValue: String(promo.maxDiscountValue ?? ""),
      usageLimit: String(promo.usageLimit ?? ""),
      usagePerUser: String(promo.usagePerUser ?? "1"),
      currentUsage: String(promo.currentUsage ?? "0"),
      eligibleCustomers: Array.isArray(promo.eligibleCustomers)
        ? promo.eligibleCustomers
        : typeof promo.eligibleCustomers === "string" && promo.eligibleCustomers.trim()
        ? toIdArray(promo.eligibleCustomers)
        : [],
      eligibleProducts: Array.isArray(promo.eligibleProducts)
        ? promo.eligibleProducts
        : typeof promo.eligibleProducts === "string" && promo.eligibleProducts.trim()
        ? toIdArray(promo.eligibleProducts)
        : [],
      isCommon: Boolean(promo.isCommon),
      isCustomersOnly: Boolean(promo.isCustomersOnly),
      isSingleUse: Boolean(promo.isSingleUse),
      status: promo.status !== false,
      visibility: promo.visibility !== false,
    });
    setError("");
    setNotice("");
    setCustomerSearch("");
    setProductSearch("");
    setCustomerDropdownOpen(false);
    setProductDropdownOpen(false);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setIsModalOpen(false);
    setEditingPromo(null);
    setForm(initialForm);
    setError("");
    setCustomerSearch("");
    setProductSearch("");
    setCustomerDropdownOpen(false);
    setProductDropdownOpen(false);
  };

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setNotice("");

    const name = form.name.trim();
    const code = form.code.trim().toUpperCase();
    const discountValue = Number(form.discountValue);
    const usageLimit = Number(form.usageLimit);
    const usagePerUser = Number(form.usagePerUser);
    const minimumOrderValue = Number(form.minimumOrderValue);
    const maxDiscountValue =
      form.maxDiscountValue === "" ? null : Number(form.maxDiscountValue);

    if (!name || !code) {
      setError("Please enter both promo code name and promo code.");
      return;
    }
    if (!Number.isFinite(discountValue) || discountValue <= 0) {
      setError("Enter a valid discount value greater than zero.");
      return;
    }
    if (form.discountType === "percentage" && discountValue > 100) {
      setError("Percentage discount cannot be greater than 100.");
      return;
    }
    if (!form.startDate || !form.expirationDate) {
      setError("Please select both start date and expiration date.");
      return;
    }
    const startDate = new Date(form.startDate);
    const expirationDate = new Date(form.expirationDate);
    if (expirationDate <= startDate) {
      setError("Expiration date must be later than the start date.");
      return;
    }
    if (!Number.isFinite(usageLimit) || usageLimit < 0 ||
      !Number.isFinite(usagePerUser) || usagePerUser < 1 ||
      !Number.isFinite(minimumOrderValue) || minimumOrderValue < 0) {
      setError("Please enter valid usage and minimum order values.");
      return;
    }
    if (maxDiscountValue !== null &&
      (!Number.isFinite(maxDiscountValue) || maxDiscountValue < 0)) {
      setError("Maximum discount value must be zero or greater.");
      return;
    }

    const previousUsage = Number(editingPromo?.currentUsage || 0);
    const fields = {
      name,
      code,
      desc: form.desc.trim(),
      discountType: form.discountType,
      discountValue,
      startDate: startDate.toISOString(),
      expirationDate: expirationDate.toISOString(),
      minimumOrderValue,
      maxDiscountValue,
      usageLimit,
      usagePerUser,
      currentUsage: Number(form.currentUsage || previousUsage || 0),
      usageLeft: Math.max(usageLimit - Number(form.currentUsage || previousUsage || 0), 0),
      eligibleCustomers: Array.isArray(form.eligibleCustomers)
        ? form.eligibleCustomers
        : toIdArray(form.eligibleCustomers || ""),
      eligibleProducts: Array.isArray(form.eligibleProducts)
        ? form.eligibleProducts
        : toIdArray(form.eligibleProducts || ""),
      isCommon: form.isCommon,
      isCustomersOnly: form.isCustomersOnly,
      isSingleUse: form.isSingleUse,
      status: form.status,
      visibility: form.visibility,
    };

    if (editingPromo) {
      fields.promoCodeId = getPromoId(editingPromo);
    }

    setSaving(true);
    try {
      const action = editingPromo ? "update" : "add";
      const response = await managePromoCode({ action, fields });
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Promo code operation failed.");
      }
      setNotice(
        response.data.message ||
        (editingPromo ? "Promo code updated successfully." : "Promo code added successfully.")
      );
      setIsModalOpen(false);
      setEditingPromo(null);
      setForm(initialForm);
      await fetchPromos();
    } catch (err) {
      console.error("Save promo code error:", err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (promo) => {
    const promoCodeId = getPromoId(promo);
    if (!promoCodeId) {
      setError("Cannot delete this promo code: document ID is missing.");
      return;
    }
    if (!window.confirm(`Delete promo code "${promo.code || promo.name}"? This cannot be undone.`)) {
      return;
    }

    setError("");
    setNotice("");
    setDeletingId(promoCodeId);
    try {
      const response = await managePromoCode({
        action: "delete",
        fields: { promoCodeId },
      });
      if (!response.data?.success) {
        throw new Error(response.data?.message || "Failed to delete promo code.");
      }
      setNotice(response.data.message || "Promo code deleted successfully.");
      setPromos((previous) =>
        previous.filter((item) => getPromoId(item) !== promoCodeId)
      );
    } catch (err) {
      console.error("Delete promo code error:", err);
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  const activeCount = promos.filter((promo) => promo.status === true).length;
  const inactiveCount = promos.length - activeCount;

  const stats = [
    {
      title: "Total Promo Codes",
      value: promos.length,
      icon: Tag,
      color: "text-primary",
      bg: "bg-primary/10",
      border: "border-tertiary/40",
    },
    {
      title: "Active",
      value: activeCount,
      icon: Eye,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    {
      title: "Inactive",
      value: inactiveCount,
      icon: EyeOff,
      color: "text-slate-500",
      bg: "bg-slate-100",
      border: "border-slate-200",
    },
  ];

  return (
    <div className="min-h-screen bg-white pb-10 page-container">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="items-start">
            <h1 className="bg-gradient-to-br from-gray-900 to-secondary bg-clip-text text-3xl font-bold text-transparent">
              Promo Code Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Create, manage and track promotional discounts.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={openAddModal}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-secondary focus:outline-none"
            >
              <Plus size={18} />
              Add Promo Code
            </button>
            <button
              type="button"
              onClick={fetchPromos}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-white border border-tertiary/60 px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-slate-50 focus:outline-none disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={`text-secondary ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>

        {error && !isModalOpen && (
          <div
            role="alert"
            className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}
        {notice && (
          <div
            role="status"
            className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice("")}
              aria-label="Dismiss message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`flex items-center gap-4 rounded-xl border ${stat.border} bg-white p-5 shadow-sm`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}
              >
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{stat.title}</p>
                <p className={`text-2xl font-black mt-0.5 ${stat.color}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* CommonTable */}
        <CommonTable
          title="Promo Codes"
          subtitle="All promo codes stored in your database."
          columns={[
            {
              key: "code",
              header: "Promo Code",
              sortable: true,
              render: (promo) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Tag size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-gray-900">{promo.code || "—"}</p>
                    <p className="max-w-xs truncate text-xs text-gray-500">
                      {promo.name || "—"}{promo.desc ? ` · ${promo.desc}` : ""}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "discountValue",
              header: "Discount",
              sortable: true,
              render: (promo) => (
                <span className="font-semibold text-gray-800">
                  {promo.discountType === "percentage"
                    ? `${promo.discountValue ?? 0}%`
                    : `₹${Number(promo.discountValue || 0).toLocaleString("en-IN")}`}
                </span>
              ),
            },
            {
              key: "minimumOrderValue",
              header: "Minimum Order",
              sortable: true,
              render: (promo) => (
                <span className="text-gray-700">
                  ₹{Number(promo.minimumOrderValue || 0).toLocaleString("en-IN")}
                </span>
              ),
            },
            {
              key: "startDate",
              header: "Validity",
              sortable: true,
              render: (promo) => (
                <div className="flex items-center gap-2 text-gray-600">
                  <CalendarDays size={15} className="text-gray-400" />
                  <span>
                    {formatDate(promo.startDate)} – {formatDate(promo.expirationDate)}
                  </span>
                </div>
              ),
            },
            {
              key: "currentUsage",
              header: "Usage",
              sortable: true,
              render: (promo) => (
                <div className="text-gray-700">
                  <span className="font-semibold">{Number(promo.currentUsage || 0)}</span>
                  <span className="text-gray-400"> / {Number(promo.usageLimit || 0)}</span>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {Number(
                      promo.usageLeft ??
                        Math.max(
                          Number(promo.usageLimit || 0) - Number(promo.currentUsage || 0),
                          0
                        )
                    )}{" "}
                    left
                  </p>
                </div>
              ),
            },
            {
              key: "status",
              header: "Status",
              sortable: true,
              render: (promo) => {
                const isActive = promo.status === true;
                return (
                  <div>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                    <p className="mt-1 flex items-center gap-1 text-xs text-gray-400">
                      {promo.visibility === false ? <EyeOff size={12} /> : <Eye size={12} />}
                      {promo.visibility === false ? "Hidden" : "Visible"}
                    </p>
                  </div>
                );
              },
            },
          ]}
          data={promos}
          total={promos.length}
          loading={loading}
          clientSide
          showRowNumbers={false}
          rowKey={(promo) => getPromoId(promo) || promo.code}
          searchPlaceholder="Search promo codes..."
          actions={(promo) => {
            const id = getPromoId(promo);
            return (
              <div className="flex justify-end gap-1">
                <button
                  type="button"
                  title="Edit promo code"
                  onClick={() => openEditModal(promo)}
                  className="rounded-lg p-2 text-gray-700 transition hover:bg-slate-100 hover:text-primary"
                >
                  <Edit size={16} />
                </button>
                <button
                  type="button"
                  title="Delete promo code"
                  onClick={() => handleDelete(promo)}
                  disabled={deletingId === id}
                  className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50 disabled:opacity-50"
                >
                  {deletingId === id ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </div>
            );
          }}
        />
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 p-3 backdrop-blur-sm">
          <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-tertiary/30 px-6 py-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {editingPromo ? "Edit Promocode" : "Add Promocode"}
                </h2>
              </div>
              <button type="button" onClick={closeModal} disabled={saving} aria-label="Close modal" className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-slate-100 hover:text-gray-900 disabled:opacity-50">
                <X size={21} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="overflow-y-auto px-6 py-6">
                {error && (
                  <div role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Promo Code Name *</label>
                    <input name="name" value={form.name} onChange={updateField} required maxLength={100} placeholder="e.g. FAMILY" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Promo Code *</label>
                    <input name="code" value={form.code} onChange={updateField} required maxLength={40} placeholder="e.g. FAMILY20" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm uppercase outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Description</label>
                    <input name="desc" value={form.desc} onChange={updateField}  placeholder="Enter Description" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Discount Type *</label>
                    <select name="discountType" value={form.discountType} onChange={updateField} className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10">
                      <option value="percentage">Percentage</option>
                      <option value="fixed">Fixed Amount</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Discount Value *</label>
                    <input name="discountValue" type="number" min="0.01" step="0.01" max={form.discountType === "percentage" ? 100 : undefined} value={form.discountValue} onChange={updateField} required placeholder={form.discountType === "percentage" ? "e.g. 20" : "e.g. 200"} className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Start Date *</label>
                    <input name="startDate" type="datetime-local" value={form.startDate} onChange={updateField} required className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Expiration Date *</label>
                    <input name="expirationDate" type="datetime-local" value={form.expirationDate} onChange={updateField} required className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Minimum Order Value</label>
                    <input name="minimumOrderValue" type="number" min="0" step="0.01" value={form.minimumOrderValue} onChange={updateField} className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Maximum Discount Value</label>
                    <input name="maxDiscountValue" type="number" min="0" step="0.01" value={form.maxDiscountValue} onChange={updateField} placeholder="Leave blank for no limit" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Usage Limit</label>
                    <input name="usageLimit" type="number" min="0" step="1" value={form.usageLimit} onChange={updateField} className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Usage Per User</label>
                    <input name="usagePerUser" type="number" min="1" step="1" value={form.usagePerUser} onChange={updateField} className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>
                   <div>
                    <label className="mb-1.5 block text-sm font-semibold text-gray-900">Current Usage</label>
                    <input name="currentUsage" type="number" min="0" step="1" value={form.currentUsage} onChange={updateField} className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                  </div>

                  {/* Eligible Customers Autoselect Multi-Select */}
                  <div className="md:col-span-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-900">
                        Eligible Customers
                      </label>
                      {customers.length > 0 && (
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:text-secondary">
                          <input
                            type="checkbox"
                            checked={
                              form.eligibleCustomers.length > 0 &&
                              form.eligibleCustomers.length === customers.length
                            }
                            onChange={handleSelectAllCustomers}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span>Select All Customers ({customers.length})</span>
                        </label>
                      )}
                    </div>

                    <div className="relative" ref={customerDropdownRef}>
                      <div className="relative">
                        <Search
                          size={16}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={customerSearch}
                          onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setCustomerDropdownOpen(true);
                          }}
                          onFocus={() => setCustomerDropdownOpen(true)}
                          placeholder="Search customers"
                          className="w-full rounded-lg border border-tertiary/60 bg-slate-50 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                        />
                        <ChevronDown
                          size={16}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      </div>

                      {customerDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-tertiary/50 bg-white p-1 shadow-xl">
                          {customers.length === 0 ? (
                            <p className="px-3 py-3 text-center text-xs text-gray-500">
                              No customers found in database.
                            </p>
                          ) : filteredCustomers.length === 0 ? (
                            <p className="px-3 py-3 text-center text-xs text-gray-500">
                              No matching customers for "{customerSearch}".
                            </p>
                          ) : (
                            filteredCustomers.map((customer) => {
                              const isSelected = form.eligibleCustomers.includes(customer.id);
                              return (
                                <button
                                  key={customer.id}
                                  type="button"
                                  onClick={() => toggleCustomer(customer.id)}
                                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition ${
                                    isSelected
                                      ? "bg-primary/10 text-primary font-semibold"
                                      : "hover:bg-slate-50 text-gray-800"
                                  }`}
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-gray-900">
                                      {customer.name}
                                    </p>
                                    <p className="truncate text-[11px] text-gray-500">
                                      {customer.phone || customer.email || customer.id}
                                    </p>
                                  </div>
                                  <div
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                      isSelected
                                        ? "border-primary bg-primary text-white"
                                        : "border-gray-300 bg-white"
                                    }`}
                                  >
                                    {isSelected && <Check size={11} strokeWidth={3} />}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Display Added Customers */}
                    {form.eligibleCustomers.length > 0 && (
                      <div className="mt-2.5 rounded-xl border border-tertiary/40 bg-slate-50/70 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700">
                            Added Customers ({form.eligibleCustomers.length})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, eligibleCustomers: [] }))
                            }
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                          {form.eligibleCustomers.map((id) => {
                            const cust = customers.find((c) => c.id === id);
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary shadow-xs"
                              >
                                <Users size={12} className="shrink-0 text-primary/70" />
                                <span className="max-w-[180px] truncate">
                                  {cust?.name || id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleCustomer(id)}
                                  className="rounded p-0.5 text-primary transition hover:bg-primary/20"
                                  title="Remove customer"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Eligible Products Autoselect Multi-Select */}
                  <div className="md:col-span-2">
                    <div className="mb-1.5 flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-900">
                        Eligible Products
                      </label>
                      {products.length > 0 && (
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:text-secondary">
                          <input
                            type="checkbox"
                            checked={
                              form.eligibleProducts.length > 0 &&
                              form.eligibleProducts.length === products.length
                            }
                            onChange={handleSelectAllProducts}
                            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span>Select All Products ({products.length})</span>
                        </label>
                      )}
                    </div>

                    <div className="relative" ref={productDropdownRef}>
                      <div className="relative">
                        <Search
                          size={16}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                        <input
                          type="text"
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setProductDropdownOpen(true);
                          }}
                          onFocus={() => setProductDropdownOpen(true)}
                          placeholder="Search products"
                          className="w-full rounded-lg border border-tertiary/60 bg-slate-50 py-2.5 pl-9 pr-9 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                        />
                        <ChevronDown
                          size={16}
                          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                        />
                      </div>

                      {productDropdownOpen && (
                        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-60 overflow-y-auto rounded-xl border border-tertiary/50 bg-white p-1 shadow-xl">
                          {products.length === 0 ? (
                            <p className="px-3 py-3 text-center text-xs text-gray-500">
                              No products found in database.
                            </p>
                          ) : filteredProducts.length === 0 ? (
                            <p className="px-3 py-3 text-center text-xs text-gray-500">
                              No matching products for "{productSearch}".
                            </p>
                          ) : (
                            filteredProducts.map((product) => {
                              const isSelected = form.eligibleProducts.includes(product.id);
                              return (
                                <button
                                  key={product.id}
                                  type="button"
                                  onClick={() => toggleProduct(product.id)}
                                  className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-xs transition ${
                                    isSelected
                                      ? "bg-primary/10 text-primary font-semibold"
                                      : "hover:bg-slate-50 text-gray-800"
                                  }`}
                                >
                                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded bg-slate-100">
                                      {product.thumbnail ? (
                                        <img
                                          src={product.thumbnail}
                                          alt=""
                                          className="h-full w-full object-cover"
                                        />
                                      ) : (
                                        <Package size={14} className="text-gray-400" />
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate font-semibold text-gray-900">
                                        {product.productName}
                                      </p>
                                      <p className="truncate text-[11px] text-gray-500">
                                        ID: {product.productId || product.id}
                                      </p>
                                    </div>
                                  </div>
                                  <div
                                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                                      isSelected
                                        ? "border-primary bg-primary text-white"
                                        : "border-gray-300 bg-white"
                                    }`}
                                  >
                                    {isSelected && <Check size={11} strokeWidth={3} />}
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>

                    {/* Display Added Products */}
                    {form.eligibleProducts.length > 0 && (
                      <div className="mt-2.5 rounded-xl border border-tertiary/40 bg-slate-50/70 p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-700">
                            Added Products ({form.eligibleProducts.length})
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setForm((prev) => ({ ...prev, eligibleProducts: [] }))
                            }
                            className="text-xs font-semibold text-rose-600 hover:text-rose-800"
                          >
                            Clear All
                          </button>
                        </div>
                        <div className="flex max-h-36 flex-wrap gap-1.5 overflow-y-auto">
                          {form.eligibleProducts.map((id) => {
                            const prod = products.find((p) => p.id === id);
                            return (
                              <span
                                key={id}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/20 bg-secondary/10 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-xs"
                              >
                                <Package size={12} className="shrink-0 text-gray-500" />
                                <span className="max-w-[180px] truncate">
                                  {prod?.productName || id}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleProduct(id)}
                                  className="rounded p-0.5 text-gray-600 transition hover:bg-black/10"
                                  title="Remove product"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Promocode Type Radio Button Group */}
                  <div className="rounded-xl border border-tertiary/40 bg-slate-50/60 p-2 md:col-span-2">
                    <label className="mb-2 block text-sm font-bold text-gray-900">
                      Promocode Type <span className="text-rose-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                          !form.isCustomersOnly
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-tertiary/50 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="promoCodeType"
                          value="common"
                          checked={!form.isCustomersOnly}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              isCommon: true,
                              isCustomersOnly: false,
                            }))
                          }
                          className="mt-0.5 h-4 w-4 text-primary focus:ring-primary"
                        />
                        <div>
                          <span className="block text-sm font-bold text-gray-900">Common</span>
                        </div>
                      </label>

                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                          form.isCustomersOnly
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                            : "border-tertiary/50 bg-white hover:bg-slate-50"
                        }`}
                      >
                        <input
                          type="radio"
                          name="promoCodeType"
                          value="customersOnly"
                          checked={form.isCustomersOnly}
                          onChange={() =>
                            setForm((prev) => ({
                              ...prev,
                              isCommon: false,
                              isCustomersOnly: true,
                            }))
                          }
                          className="mt-0.5 h-4 w-4 text-primary focus:ring-primary"
                        />
                        <div>
                          <span className="block text-sm font-bold text-gray-900">Customers only</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Status, Visibility Status, Single Use Only Toggle Buttons */}
                  <div className="rounded-xl border border-tertiary/40 bg-slate-50/50 p-2 md:col-span-2">
                    <h3 className="mb-1 text-sm font-bold text-gray-900">Settings & Visibility</h3>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      {/* Status Toggle */}
                      <div className="flex items-center justify-between rounded-xl border border-tertiary/40 bg-white p-3.5 shadow-sm">
                        <div className="pr-2">
                          <p className="text-sm font-bold text-gray-900">Status</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            name="status"
                            checked={form.status}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, status: e.target.checked }))
                            }
                            className="peer sr-only"
                          />
                          <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-emerald-500 peer-focus:outline-none"></div>
                          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm"></span>
                        </label>
                      </div>

                      {/* Visibility Status Toggle */}
                      <div className="flex items-center justify-between rounded-xl border border-tertiary/40 bg-white p-3.5 shadow-sm">
                        <div className="pr-2">
                          <p className="text-sm font-bold text-gray-900">Visibility Status</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            name="visibility"
                            checked={form.visibility}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, visibility: e.target.checked }))
                            }
                            className="peer sr-only"
                          />
                          <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-blue-600 peer-focus:outline-none"></div>
                          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm"></span>
                        </label>
                      </div>

                      {/* Single Use Only Toggle */}
                      <div className="flex items-center justify-between rounded-xl border border-tertiary/40 bg-white p-3.5 shadow-sm">
                        <div className="pr-2">
                          <p className="text-sm font-bold text-gray-900">Single Use Only</p>
                        </div>
                        <label className="relative inline-flex cursor-pointer items-center">
                          <input
                            type="checkbox"
                            name="isSingleUse"
                            checked={form.isSingleUse}
                            onChange={(e) =>
                              setForm((prev) => ({ ...prev, isSingleUse: e.target.checked }))
                            }
                            className="peer sr-only"
                          />
                          <div className="h-6 w-11 rounded-full bg-slate-200 transition peer-checked:bg-indigo-600 peer-focus:outline-none"></div>
                          <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5 shadow-sm"></span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-tertiary/30 bg-slate-50 px-6 py-4">
                <button type="button" onClick={closeModal} disabled={saving} className="rounded-lg px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-slate-200 disabled:opacity-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving} className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60">
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving ? "Saving..." : editingPromo ? "Update Promo Code" : "Save Promo Code"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

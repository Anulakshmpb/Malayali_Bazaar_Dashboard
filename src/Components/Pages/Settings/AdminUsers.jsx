
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  Shield,
  Mail,
  Phone,
  LoaderCircle,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  UserRound,
} from "lucide-react";

import { collection, onSnapshot } from "firebase/firestore";
import { getApp } from "firebase/app";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db } from "../../Config/Firebase";
import CommonTable from "../../Shared/Pages/CommonTable";

const ADMIN_ROLES = ["Super Admin", "Manager Admin", "Editor"];
const functions = getFunctions(getApp(), "europe-west1");
const adminCallable = httpsCallable(functions, "manageAdmin");

const INITIAL_FORM = {
  name: "",
  role: "Editor",
  email: "",
  mobile: "",
  password: "",
  confirmPassword: "",
};

const inputClass =
  "w-full rounded-xl border border-tertiary/70 bg-slate-50 px-4 py-2.5 text-sm text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15";

function getErrorMessage(error) {
  if (error?.code === "functions/unauthenticated") {
    return "Your session has expired. Please sign in again.";
  }

  if (error?.code === "functions/permission-denied") {
    return "You do not have permission to manage admin accounts.";
  }

  if (error?.code === "functions/not-found") {
    return "The backend function was not found. Check its deployment and export.";
  }

  return (
    error?.message ||
    "Something went wrong. Please try again."
  );
}

export default function AdminUsers() {
  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState("");
  const [adminForm, setAdminForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    const adminsRef = collection(db, "adminUsers");
    const unsubscribe = onSnapshot(
      adminsRef,
      (snapshot) => {
        const adminList = snapshot.docs
          .map((document) => ({
            id: document.id,
            ...document.data(),
          }))
          .filter((admin) => admin.status !== "removed")
          .sort((a, b) =>
            String(a.name || "").localeCompare(
              String(b.name || "")
            )
          );

        setAdmins(adminList);
        setLoading(false);
        setError("");
      },
      (err) => {
        console.error("Failed to load admin users:", err);
        setError(
          "Unable to load administrators. Check your Firestore permissions."
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const filteredAdmins = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return admins;
    return admins.filter((admin) =>
      [
        admin.name,
        admin.email,
        admin.mobile,
        admin.role,
      ].some((value) =>
        String(value || "").toLowerCase().includes(term)
      )
    );
  }, [admins, search]);

  const closeForm = useCallback(() => {
    if (saving) return;

    setAdminForm(false);
    setEditingAdmin(null);
    setForm(INITIAL_FORM);
    setError("");
  }, [saving]);

  const openAddForm = () => {
    setEditingAdmin(null);
    setForm(INITIAL_FORM);
    setError("");
    setSuccess("");
    setAdminForm(true);
  };

  const handleEdit = (admin) => {
    setEditingAdmin(admin);

    setForm({
      name: admin.name || "",
      role: admin.role || "Editor",
      email: admin.email || "",
      mobile: admin.mobile || "",
      password: "",
      confirmPassword: "",
    });

    setError("");
    setSuccess("");
    setAdminForm(true);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const name = form.name.trim();
    const email = form.email.trim().toLowerCase();
    const mobile = form.mobile.trim();
    const password = form.password;
    const confirmPassword = form.confirmPassword;

    if (!name || !email || !mobile || !form.role) {
      setError("Please complete all required fields.");
      return;
    }

    if (!editingAdmin && !password) {
      setError("Password is required when creating an admin.");
      return;
    }

    if (password && password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password and confirm password do not match.");
      return;
    }

    try {
      setSaving(true);

      let payload;

      if (editingAdmin) {
        payload = {
          action: "update",
          id: editingAdmin.id,
        };

        if (name !== (editingAdmin.name || "")) {
          payload.name = name;
        }

        if (email !== (editingAdmin.email || "").toLowerCase()) {
          payload.email = email;
        }

        if (mobile !== (editingAdmin.mobile || "")) {
          payload.mobile = mobile;
        }

        if (form.role !== (editingAdmin.role || "")) {
          payload.role = form.role;
        }

        if (password) {
          payload.password = password;
        }

        if (Object.keys(payload).length === 2) {
          setError("No changes to save.");
          return;
        }
      } else {
        payload = {
          action: "add",
          name,
          role: form.role,
          email,
          mobile,
          password,
        };
      }

      const response = await adminCallable(payload);
      const result = response.data;
      if (!result?.success) {
        const backendError = result?.error;

        throw new Error(
          Array.isArray(backendError)
            ? backendError.join(", ")
            : backendError ||
                result?.message ||
                "The admin operation failed."
        );
      }

      setSuccess(
        editingAdmin
          ? "Admin updated successfully."
          : "Admin created successfully."
      );

      setAdminForm(false);
      setEditingAdmin(null);
      setForm(INITIAL_FORM);
    } catch (err) {
      console.error("Admin save failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (admin) => {
    if (deletingId || saving) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${admin.name || admin.email}? This will disable their Firebase Authentication account.`
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      setDeletingId(admin.id);

      const response = await adminCallable({
        action: "delete",
        id: admin.id,
      });

      const result = response.data;

      if (!result?.success) {
        const backendError = result?.error;

        throw new Error(
          Array.isArray(backendError)
            ? backendError.join(", ")
            : backendError ||
                result?.message ||
                "Unable to delete this admin."
        );
      }

      setSuccess("Admin removed successfully.");
    } catch (err) {
      console.error("Admin deletion failed:", err);
      setError(getErrorMessage(err));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="page-container min-h-screen bg-white pb-12">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="bg-gradient-to-br from-gray-900 to-secondary bg-clip-text text-3xl font-bold text-transparent">
              Admin Users
            </h1>
          </div>

          <button
            type="button"
            onClick={openAddForm}
            className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-white shadow-md transition duration-300 hover:-translate-y-0.5 hover:bg-secondary hover:shadow-lg"
          >
            <Plus size={20} />
            <span>Add Admin</span>
          </button>
        </div>

        {/* Notifications */}
        {error && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"
          >
            <AlertCircle size={19} className="mt-0.5 shrink-0" />
            <p className="flex-1">{error}</p>
            <button
              type="button"
              onClick={() => setError("")}
              className="shrink-0 rounded-md p-1 hover:bg-rose-100"
              aria-label="Dismiss error"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
          >
            <CheckCircle2 size={19} />
            <p className="flex-1">{success}</p>
            <button
              type="button"
              onClick={() => setSuccess("")}
              className="rounded-md p-1 hover:bg-emerald-100"
              aria-label="Dismiss success message"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Search */}
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-tertiary/40 bg-white p-4 shadow-sm">
          <div className="relative w-full max-w-md">
            <Search
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/50"
              size={18}
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search administrators..."
              className="w-full rounded-xl border border-tertiary/60 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-primary transition-all focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setError("");
              setSuccess("");
            }}
            className="ml-3 rounded-lg border border-tertiary/50 p-2.5 text-secondary transition hover:bg-tertiary/10"
            title="Dismiss notifications"
            aria-label="Dismiss notifications"
          >
            <RefreshCw size={17} />
          </button>
        </div>

        <CommonTable
          title="Administrators"
          subtitle="Manage administrator accounts and roles"
          columns={[
            {
              key: "name",
              header: "Admin Details",
              sortable: true,
              render: (admin) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-tertiary/30 font-bold text-primary shadow-sm">
                    {admin.name?.trim()?.charAt(0)?.toUpperCase() || <UserRound size={18} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-primary">{admin.name || "Unnamed Admin"}</p>
                    <p className="mt-0.5 flex items-center gap-1 break-all text-xs text-secondary/70">
                      <Mail size={12} className="shrink-0" />
                      {admin.email || "No email"}
                    </p>
                  </div>
                </div>
              ),
            },
            {
              key: "mobile",
              header: "Contact",
              sortable: true,
              render: (admin) => (
                <span className="flex items-center gap-1.5 text-sm text-primary">
                  <Phone size={14} className="shrink-0 text-secondary/60" />
                  {admin.mobile || "Not provided"}
                </span>
              ),
            },
            {
              key: "role",
              header: "Role",
              sortable: true,
              render: (admin) => (
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-tertiary/50 bg-tertiary/30 px-2.5 py-1 text-xs font-medium text-primary">
                  <Shield size={12} />
                  {admin.role || "Unassigned"}
                </span>
              ),
            },
          ]}
          data={filteredAdmins}
          total={filteredAdmins.length}
          loading={loading}
          clientSide
          showSearch={false}
          showRowNumbers={false}
          rowKey="id"
          emptyMessage={search.trim() ? "No administrators match your search." : "No administrators found."}
          actions={(admin) => (
            <>
              <button
                type="button"
                onClick={() => handleEdit(admin)}
                disabled={Boolean(deletingId) || saving}
                className="rounded-md border border-tertiary/40 bg-slate-50 p-2 text-secondary transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                title="Edit Admin"
                aria-label={`Edit ${admin.name || "admin"}`}
              >
                <Edit2 size={15} />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(admin)}
                disabled={Boolean(deletingId) || saving}
                className="rounded-md border border-rose-200/60 bg-rose-50/70 p-2 text-rose-500 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                title="Delete Admin"
                aria-label={`Delete ${admin.name || "admin"}`}
              >
                {deletingId === admin.id ? <LoaderCircle size={15} className="animate-spin" /> : <Trash2 size={15} />}
              </button>
            </>
          )}
        />

        {/* Add/Edit Modal */}
        {adminForm && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target === event.currentTarget &&
                !saving
              ) {
                closeForm();
              }
            }}
          >
            <div className="my-auto w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-tertiary/40 bg-tertiary/5 px-6 py-4">
                <div>
                  <h2 className="text-lg font-bold text-primary">
                    {editingAdmin ? "Edit Admin" : "Add New Admin"}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  disabled={saving}
                  className="rounded-full p-2 text-secondary transition-colors hover:bg-tertiary/20 hover:text-primary disabled:opacity-50"
                  aria-label="Close form"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Form */}
              <form
                className="space-y-5 p-6"
                onSubmit={handleSubmit}
              >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="admin-name"
                      className="mb-1.5 block text-sm font-semibold text-gray-900"
                    >
                      Full Name
                    </label>
                    <input
                      id="admin-name"
                      name="name"
                      type="text"
                      value={form.name}
                      onChange={handleChange}
                      placeholder="John Doe"
                      maxLength={100}
                      autoComplete="name"
                      className={inputClass}
                      required
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-role"
                      className="mb-1.5 block text-sm font-semibold text-gray-900"
                    >
                      Role
                    </label>
                    <select
                      id="admin-role"
                      name="role"
                      value={form.role}
                      onChange={handleChange}
                      className={inputClass}
                      required
                      disabled={saving}
                    >
                      {ADMIN_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-1.5 block text-sm font-semibold text-gray-900"
                  >
                    Email Address
                  </label>
                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="admin@example.com"
                    autoComplete="email"
                    className={inputClass}
                    required
                    disabled={saving}
                  />
                </div>

                <div>
                  <label
                    htmlFor="admin-mobile"
                    className="mb-1.5 block text-sm font-semibold text-gray-900"
                  >
                    Phone Number
                  </label>
                  <input
                    id="admin-mobile"
                    name="mobile"
                    type="tel"
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="+919876543210"
                    autoComplete="tel"
                    className={inputClass}
                    required
                    disabled={saving}
                  />
                </div>

                {editingAdmin && (
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs leading-5 text-secondary/80">
                    Leave both password fields empty to keep the
                    current password unchanged.
                  </p>
                )}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="admin-password"
                      className="mb-1.5 block text-sm font-semibold text-gray-900"
                    >
                      Password
                      {editingAdmin && (
                        <span className="ml-1 font-normal text-secondary/60">
                          (optional)
                        </span>
                      )}
                    </label>
                    <input
                      id="admin-password"
                      name="password"
                      type="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder={
                        editingAdmin
                          ? "Leave blank to keep"
                          : "Minimum 6 characters"
                      }
                      autoComplete="new-password"
                      minLength={6}
                      maxLength={128}
                      className={inputClass}
                      required={!editingAdmin}
                      disabled={saving}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-confirm-password"
                      className="mb-1.5 block text-sm font-semibold text-gray-900"
                    >
                      Confirm Password
                    </label>
                    <input
                      id="admin-confirm-password"
                      name="confirmPassword"
                      type="password"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm password"
                      autoComplete="new-password"
                      minLength={6}
                      maxLength={128}
                      className={inputClass}
                      required={!editingAdmin || Boolean(form.password)}
                      disabled={saving}
                    />
                  </div>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
                  >
                    <AlertCircle
                      size={17}
                      className="mt-0.5 shrink-0"
                    />
                    <span>{error}</span>
                  </div>
                )}

                {/* Actions */}
                <div className="mt-6 flex items-center justify-end gap-3 border-t border-tertiary/30 pt-5">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-lg px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-slate-200 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="flex min-w-[145px] items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-secondary hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/20 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <LoaderCircle
                          size={17}
                          className="animate-spin"
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        {editingAdmin ? (
                          <CheckCircle2 size={17} />
                        ) : (
                          <Plus size={17} />
                        )}
                        {editingAdmin
                          ? "Save Changes"
                          : "Create Admin"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

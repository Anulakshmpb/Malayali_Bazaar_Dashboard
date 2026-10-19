
import React, { useEffect, useMemo, useState } from "react";
import {
    Plus,
    Edit2,
    Trash2,
    X,
    ShieldCheck,
    Settings,
    KeyRound,
    Search,
} from "lucide-react";
import {
    collection,
    onSnapshot,
    orderBy,
    query,
} from "firebase/firestore";
import {
    getFunctions,
    httpsCallable,
} from "firebase/functions";

import { useToast } from "../../Shared/hooks/ToastContext";
import { PROTECTED_ROUTES as systemRoutes } from "../../Routes/RoutesConfig";
import { db, app } from "../../Config/Firebase";
import CommonTable from "../../Shared/Pages/CommonTable";

const normalizeRoutes = (routes = []) =>
    routes.map((path) => {
        if (path === "/users-ist") return "/users-list";
        if (path === "/passenger-ist") return "/passenger-list";
        return path;
    });

const getPermissionTitle = (permission) =>
    permission.permissionName ||
    permission.roleName ||
    "Unnamed Role";

const getErrorMessage = (error) => {
    if (Array.isArray(error)) {
        return error.join(", ");
    }

    if (typeof error === "string" && error.trim()) {
        return error;
    }

    return "Unable to complete the permission operation.";
};

export default function AdminSettings() {
    const { showToast } = useToast();

    const [permissions, setPermissions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [adminForm, setAdminForm] = useState(false);
    const [editingPermission, setEditingPermission] = useState(null);
    const [permissionName, setPermissionName] = useState("");
    const [selectedRoutes, setSelectedRoutes] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");

    // Must match the region where the callable is deployed.
    const functions = useMemo(
        () => getFunctions(app, "europe-west1"),
        []
    );

    // FIX: the deployed callable is managePermission, not editPermissions.
    const managePermissionCallable = useMemo(
        () => httpsCallable(functions, "managePermission"),
        [functions]
    );

    // Load permissions from Firestore.
    useEffect(() => {
        const permissionsQuery = query(
            collection(db, "permissions"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            permissionsQuery,
            (snapshot) => {
                setPermissions(
                    snapshot.docs.map((document) => ({
                        id: document.id,
                        ...document.data(),
                    }))
                );
                setLoading(false);
            },
            (error) => {
                console.error("Error loading permissions:", {
                    code: error.code,
                    message: error.message,
                    details: error.details,
                });

                setLoading(false);
                showToast(
                    "Unable to load roles and permissions.",
                    "error"
                );
            }
        );

        return unsubscribe;
    }, [showToast]);

    const filteredPermissions = useMemo(() => {
        const search = searchTerm.trim().toLowerCase();

        if (!search) return permissions;

        return permissions.filter((permission) => {
            const text = [
                getPermissionTitle(permission),
                ...(Array.isArray(permission.permissions)
                    ? permission.permissions
                    : []),
            ]
                .join(" ")
                .toLowerCase();

            return text.includes(search);
        });
    }, [permissions, searchTerm]);

    const resetForm = () => {
        setPermissionName("");
        setSelectedRoutes([]);
        setEditingPermission(null);
    };

    const closeForm = () => {
        if (saving) return;

        setAdminForm(false);
        resetForm();
    };

    const handleAdd = () => {
        resetForm();
        setAdminForm(true);
    };

    const handleEdit = (permission) => {
        setEditingPermission(permission);
        setPermissionName(getPermissionTitle(permission));
        setSelectedRoutes(
            normalizeRoutes(
                Array.isArray(permission.permissions)
                    ? permission.permissions
                    : []
            )
        );
        setAdminForm(true);
    };

    const handleSelectAll = () => {
        const allSelected =
            systemRoutes.length > 0 &&
            systemRoutes.every((route) =>
                selectedRoutes.includes(route.path)
            );

        setSelectedRoutes(
            allSelected
                ? []
                : systemRoutes.map((route) => route.path)
        );
    };

    const handleCheckboxChange = (path) => {
        setSelectedRoutes((previous) =>
            previous.includes(path)
                ? previous.filter((item) => item !== path)
                : [...previous, path]
        );
    };

    // Create or update a role's page permissions.
    const handleSave = async (event) => {
        event.preventDefault();

        if (saving) return;

        const name = permissionName.trim();

        if (name.length < 2) {
            showToast(
                "Enter a role name with at least 2 characters.",
                "error"
            );
            return;
        }

        const validPaths = new Set(
            systemRoutes.map((route) => route.path)
        );

        const routes = [
            ...new Set(normalizeRoutes(selectedRoutes)),
        ].filter((path) => validPaths.has(path));

        if (routes.length === 0) {
            showToast(
                "Select at least one allowed page.",
                "error"
            );
            return;
        }

        const duplicate = permissions.some((permission) => {
            if (permission.id === editingPermission?.id) {
                return false;
            }

            return (
                getPermissionTitle(permission).trim().toLowerCase() ===
                name.toLowerCase()
            );
        });

        if (duplicate) {
            showToast(
                "A role with this name already exists.",
                "error"
            );
            return;
        }

        // Preserve the existing request contract.
        const request = {
            action: editingPermission ? "update" : "add",
            permissionName: name,
            roleName: name,
            permissions: routes,
        };

        if (editingPermission) {
            request.id = editingPermission.id;
        }

        setSaving(true);

        try {
            const result = await managePermissionCallable(request);

            if (!result.data?.success) {
                throw new Error(
                    getErrorMessage(result.data?.error) ||
                    "Unable to save role permissions."
                );
            }

            showToast(
                editingPermission
                    ? "Role permissions updated successfully."
                    : "Role and permissions created successfully.",
                "success"
            );

            setAdminForm(false);
            resetForm();
        } catch (error) {
            console.error("Permission save failed:", {
                code: error.code,
                message: error.message,
                details: error.details,
                stack: error.stack,
            });

            showToast(
                error.message || "Failed to save permissions.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    // Delete a role through the same callable.
    const handleDelete = async (permission) => {
        if (!permission?.id || saving) return;

        const confirmed = window.confirm(
            `Delete the role "${getPermissionTitle(permission)}"?`
        );

        if (!confirmed) return;

        setSaving(true);

        try {
            const result = await managePermissionCallable({
                action: "delete",
                id: permission.id,
            });

            if (!result.data?.success) {
                throw new Error(
                    getErrorMessage(result.data?.error) ||
                    "Unable to delete role."
                );
            }

            if (editingPermission?.id === permission.id) {
                setAdminForm(false);
                resetForm();
            }

            showToast("Role deleted successfully.", "success");
        } catch (error) {
            console.error("Error deleting permission:", {
                code: error.code,
                message: error.message,
                details: error.details,
                stack: error.stack,
            });

            showToast(
                error.message || "Unable to delete role.",
                "error"
            );
        } finally {
            setSaving(false);
        }
    };

    const getAccessLevel = (permission) => {
        const allowed = normalizeRoutes(
            Array.isArray(permission.permissions)
                ? permission.permissions
                : []
        );

        if (
            systemRoutes.length > 0 &&
            systemRoutes.every((route) =>
                allowed.includes(route.path)
            )
        ) {
            return "Full Access";
        }

        return allowed.length ? "Partial Access" : "No Access";
    };

    const getModuleNames = (permission) => {
        const allowed = normalizeRoutes(
            Array.isArray(permission.permissions)
                ? permission.permissions
                : []
        );

        return systemRoutes
            .filter((route) => allowed.includes(route.path))
            .map((route) => route.name);
    };

    const allRoutesSelected =
        systemRoutes.length > 0 &&
        systemRoutes.every((route) =>
            selectedRoutes.includes(route.path)
        );

    return (
        <div className="page-container min-h-screen bg-white pb-12">
            <div className="mx-auto max-w-7xl">
                {/* Page header */}
                <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="bg-gradient-to-br from-gray-900 to-secondary bg-clip-text text-3xl font-bold text-transparent">
                            Roles &amp; Permissions
                        </h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Manage roles and control application page access.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleAdd}
                        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-white shadow-md transition hover:bg-secondary"
                    >
                        <Plus size={20} />
                        Add Role
                    </button>
                </div>

                {/* Search */}
                <div className="mb-6 rounded-2xl border border-tertiary/40 bg-white p-4 shadow-sm">
                    <div className="relative max-w-md">
                        <Search
                            size={18}
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/50"
                        />
                        <input
                            type="search"
                            value={searchTerm}
                            onChange={(event) =>
                                setSearchTerm(event.target.value)
                            }
                            placeholder="Search roles or page permissions..."
                            className="w-full rounded-xl border border-tertiary/60 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-primary outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                    </div>
                </div>

                <CommonTable
                    title="Roles & Permissions"
                    subtitle="Configure application access by role"
                    columns={[
                        {
                            key: "permissionName",
                            header: "Role Name",
                            sortable: true,
                            render: (permission) => (
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-tertiary/30 text-primary">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-primary">{getPermissionTitle(permission)}</p>
                                        <p className="mt-1 text-xs text-gray-500">
                                            {(Array.isArray(permission.permissions) ? permission.permissions : []).length} pages assigned
                                        </p>
                                    </div>
                                </div>
                            ),
                        },
                        {
                            key: "roleName",
                            header: "Access Level",
                            sortable: true,
                            render: (permission) => {
                                const access = getAccessLevel(permission);
                                return (
                                    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
                                        access === "Full Access"
                                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                            : access === "Partial Access"
                                                ? "border-blue-200 bg-blue-50 text-blue-700"
                                                : "border-slate-200 bg-slate-100 text-slate-600"
                                    }`}>
                                        {access}
                                    </span>
                                );
                            },
                        },
                        {
                            key: "permissions",
                            header: "Allowed Pages",
                            render: (permission) => {
                                const modules = getModuleNames(permission);
                                return (
                                    <div className="flex max-w-lg flex-wrap gap-1.5">
                                        {modules.length ? modules.slice(0, 5).map((module) => (
                                            <span key={module} className="rounded-md border border-slate-200 bg-slate-100 px-2 py-1 text-xs text-secondary">
                                                {module}
                                            </span>
                                        )) : (
                                            <span className="text-xs text-gray-500">No pages assigned</span>
                                        )}
                                        {modules.length > 5 && (
                                            <span className="rounded-md bg-tertiary/20 px-2 py-1 text-xs text-primary">
                                                +{modules.length - 5} more
                                            </span>
                                        )}
                                    </div>
                                );
                            },
                        },
                    ]}
                    data={filteredPermissions}
                    total={filteredPermissions.length}
                    loading={loading}
                    clientSide
                    showSearch={false}
                    showRowNumbers={false}
                    rowKey="id"
                    emptyMessage={searchTerm ? "No matching roles found" : "No roles configured yet"}
                    emptyDescription={searchTerm ? "Try another search term." : "Add a role to configure page access."}
                    actions={(permission) => (
                        <>
                            <button
                                type="button"
                                title="Edit role"
                                disabled={saving}
                                onClick={() => handleEdit(permission)}
                                className="rounded-lg border border-tertiary/40 bg-slate-50 p-2 text-secondary transition hover:bg-slate-100 disabled:opacity-50"
                            >
                                <Edit2 size={15} />
                            </button>
                            <button
                                type="button"
                                title="Delete role"
                                disabled={saving}
                                onClick={() => handleDelete(permission)}
                                className="rounded-lg border border-rose-200/60 bg-rose-50 p-2 text-rose-500 transition hover:bg-rose-100 disabled:opacity-50"
                            >
                                <Trash2 size={15} />
                            </button>
                        </>
                    )}
                />

                {/* Add / edit modal */}
                {adminForm && (
                    <div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
                        onMouseDown={(event) => {
                            if (event.target === event.currentTarget) {
                                closeForm();
                            }
                        }}
                    >
                        <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
                            <div className="flex shrink-0 items-center justify-between border-b border-tertiary/40 bg-tertiary/5 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/30 text-primary">
                                        <Settings size={21} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-primary">
                                            {editingPermission
                                                ? "Edit Role Permissions"
                                                : "Create Role"}
                                        </h2>
                                        <p className="mt-1 text-xs text-secondary/70">
                                            Define a role and its page access.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    aria-label="Close modal"
                                    className="rounded-full p-2 text-secondary transition hover:bg-tertiary/20 hover:text-primary disabled:opacity-50"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form
                                id="permissionForm"
                                onSubmit={handleSave}
                                className="space-y-6 overflow-y-auto p-6"
                            >
                                <div>
                                    <label
                                        htmlFor="permissionName"
                                        className="mb-1 block text-sm font-semibold text-gray-900"
                                    >
                                        Role Name
                                    </label>
                                    <input
                                        id="permissionName"
                                        type="text"
                                        value={permissionName}
                                        onChange={(event) =>
                                            setPermissionName(event.target.value)
                                        }
                                        placeholder="e.g. Administrator, Manager, Staff"
                                        maxLength={80}
                                        minLength={2}
                                        autoFocus
                                        required
                                        className="w-full rounded-xl border border-tertiary/80 bg-slate-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                                    />
                                </div>

                                <hr className="border-tertiary/30" />

                                <div>
                                    <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Page Permissions
                                        </h3>
                                        <button
                                            type="button"
                                            onClick={handleSelectAll}
                                            className="rounded-lg border border-tertiary/50 px-3 py-2 text-xs font-semibold text-primary transition hover:bg-tertiary/10"
                                        >
                                            {allRoutesSelected
                                                ? "Deselect All"
                                                : "Select All Pages"}
                                        </button>
                                    </div>

                                    <div className="mb-4 flex items-center justify-between rounded-xl border border-tertiary/30 bg-tertiary/10 p-3">
                                        <div className="flex items-center gap-2">
                                            <KeyRound size={17} className="text-primary" />
                                            <span className="text-sm font-medium text-primary">
                                                Selected pages
                                            </span>
                                        </div>
                                        <span className="text-sm font-bold text-primary">
                                            {
                                                selectedRoutes.filter((path) =>
                                                    systemRoutes.some(
                                                        (route) => route.path === path
                                                    )
                                                ).length
                                            }{" "}
                                            / {systemRoutes.length}
                                        </span>
                                    </div>

                                    {systemRoutes.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                            {systemRoutes.map((route, index) => (
                                                <label
                                                    key={route.path}
                                                    htmlFor={`module-${index}`}
                                                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${selectedRoutes.includes(route.path)
                                                            ? "border-primary/50 bg-tertiary/10"
                                                            : "border-tertiary/40 hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <input
                                                        id={`module-${index}`}
                                                        type="checkbox"
                                                        checked={selectedRoutes.includes(route.path)}
                                                        onChange={() =>
                                                            handleCheckboxChange(route.path)
                                                        }
                                                        className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer accent-primary"
                                                    />
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {route.name}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="py-6 text-center text-sm text-gray-500">
                                            No application pages are configured in RoutesConfig.
                                        </p>
                                    )}
                                </div>
                            </form>

                            <div className="flex shrink-0 flex-col-reverse justify-end gap-3 border-t border-tertiary/30 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    className="rounded-xl px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-slate-200 disabled:opacity-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    form="permissionForm"
                                    disabled={saving || systemRoutes.length === 0}
                                    className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={17} />
                                            {editingPermission
                                                ? "Update Role"
                                                : "Create Role"}
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

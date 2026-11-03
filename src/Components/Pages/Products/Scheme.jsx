
import React, { useEffect, useState, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  CircleAlert,
  Tag,
  Eye,
  X,
  RefreshCw,
  Search,
  CalendarDays,
  Hash,
  Layers,
} from "lucide-react";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useToast } from "../../Shared/hooks/ToastContext";
import { app } from "../../Config/Firebase";

const functions = getFunctions(app, "europe-west1");
const manageScheme = httpsCallable(functions, "manageScheme");

function SchemeManagement() {
  const [schemes, setSchemes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSchemeName, setNewSchemeName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editSchemeId, setEditSchemeId] = useState("");
  const [editSchemeName, setEditSchemeName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteSchemeId, setDeleteSchemeId] = useState("");
  const [deleteSchemeName, setDeleteSchemeName] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const { showToast } = useToast();

  const fetchSchemes = useCallback(async () => {
    setLoading(true);

    try {
      const response = await manageScheme({
        action: "list",
      });

      if (response.data?.success) {
        const schemeData = response.data.data || [];
        const formattedSchemes = schemeData.map((scheme) => ({
          ...scheme,
          schemeId: scheme.schemeId || scheme.id,
        }));

        setSchemes(formattedSchemes);
      } else {
        showToast(
          response.data?.message || "Failed to fetch schemes",
          "error"
        );
      }
    } catch (error) {
      console.error("Fetch schemes error:", error);

      showToast(
        error.message || "Failed to load schemes",
        "error"
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchSchemes();
  }, [fetchSchemes]);

  const handleAdd = async (e) => {
    e.preventDefault();

    const trimmedName = newSchemeName.trim();

    if (!trimmedName) {
      showToast("Scheme name is required", "error");
      return;
    }

    setIsSaving(true);

    try {
      const response = await manageScheme({
        action: "add",
        fields: {
          schemeName: trimmedName,
        },
      });

      if (!response.data?.success) {
        showToast(
          response.data?.message || "Failed to add scheme",
          "error"
        );
        return;
      }

      showToast(
        response.data.message || "Scheme added successfully",
        "success"
      );

      setShowAddModal(false);
      setNewSchemeName("");

      await fetchSchemes();
    } catch (error) {
      console.error("Add scheme error:", error);

      showToast(
        error.message || "Failed to add scheme",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const openEdit = (scheme) => {
    setEditSchemeId(scheme.schemeId);
    setEditSchemeName(scheme.schemeName || "");
    setShowEditModal(true);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    const trimmedName = editSchemeName.trim();

    if (!editSchemeId) {
      showToast("Scheme ID is missing", "error");
      return;
    }

    if (!trimmedName) {
      showToast("Scheme name is required", "error");
      return;
    }

    setIsUpdating(true);

    try {
      const response = await manageScheme({
        action: "update",
        fields: {
          schemeId: editSchemeId,
          schemeName: trimmedName,
        },
      });

      if (!response.data?.success) {
        showToast(
          response.data?.message || "Failed to update scheme",
          "error"
        );
        return;
      }

      showToast(
        response.data.message || "Scheme updated successfully",
        "success"
      );

      setShowEditModal(false);
      setEditSchemeId("");
      setEditSchemeName("");

      await fetchSchemes();
    } catch (error) {
      console.error("Update scheme error:", error);

      showToast(
        error.message || "Failed to update scheme",
        "error"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const closeEditModal = () => {
    if (isUpdating) return;

    setShowEditModal(false);
    setEditSchemeId("");
    setEditSchemeName("");
  };

  const closeAddModal = () => {
    if (isSaving) return;

    setShowAddModal(false);
    setNewSchemeName("");
  };

  const openView = (scheme) => {
    setSelectedScheme(scheme);
    setShowViewModal(true);
  };
  const openDelete = (scheme) => {
    setDeleteSchemeId(scheme.schemeId);
    setDeleteSchemeName(scheme.schemeName || "");
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteSchemeId) {
      showToast("Scheme ID is missing", "error");
      return;
    }

    setIsDeleting(true);

    try {
      const response = await manageScheme({
        action: "delete",
        fields: {
          schemeId: deleteSchemeId,
        },
      });

      if (!response.data?.success) {
        showToast(
          response.data?.message || "Failed to delete scheme",
          "error"
        );
        return;
      }

      showToast(
        response.data.message || "Scheme deleted successfully",
        "success"
      );

      setShowDeleteModal(false);
      setDeleteSchemeId("");
      setDeleteSchemeName("");

      await fetchSchemes();
    } catch (error) {
      console.error("Delete scheme error:", error);

      showToast(
        error.message || "Failed to delete scheme",
        "error"
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSchemes = schemes.filter((scheme) =>
    (scheme.schemeName || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );
  const formatDate = (timestamp) => {
    if (!timestamp) return "Not available";

    let date;

    if (typeof timestamp.toDate === "function") {
      date = timestamp.toDate();
    } else if (timestamp.seconds != null) {
      date = new Date(timestamp.seconds * 1000);
    } else {
      date = new Date(timestamp);
    }

    if (Number.isNaN(date.getTime())) {
      return "Not available";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const inputStyle =
    "w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:bg-white focus:border-slate-500 focus:ring-4 focus:ring-slate-100";
  return (
    <div className="min-h-screen bg-slate-50/70 p-5 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center">
                <Layers size={18} className="text-white" />
              </div>

              <span className="text-xs font-semibold uppercase tracking-widest text-slate-400">
                Product Configuration
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Scheme Management
            </h1>

            <p className="text-sm text-slate-500 mt-1">
              Create, view and manage your product schemes.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-all"
          >
            <Plus size={18} />
            Add Scheme
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Total Schemes
                </p>

                <h2 className="text-3xl font-bold text-slate-900 mt-2">
                  {schemes.length}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center">
                <Tag size={22} className="text-slate-700" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Displayed Schemes
                </p>

                <h2 className="text-3xl font-bold text-slate-900 mt-2">
                  {filteredSchemes.length}
                </h2>
              </div>

              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Layers size={22} className="text-indigo-600" />
              </div>
            </div>
          </div>

        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">

          <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-800">
                All Schemes
              </h2>

              <p className="text-xs text-slate-400 mt-1">
                Manage your available schemes here.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-full sm:w-64">
                <Search
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="text"
                  placeholder="Search schemes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 bg-slate-50 rounded-xl text-sm outline-none focus:border-slate-400"
                />
              </div>

              <button
                onClick={fetchSchemes}
                disabled={loading}
                title="Refresh"
                className="p-2.5 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-500 disabled:opacity-50"
              >
                <RefreshCw
                  size={17}
                  className={loading ? "animate-spin" : ""}
                />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-16 text-center">
              <RefreshCw
                size={26}
                className="animate-spin mx-auto text-slate-400"
              />

              <p className="text-sm text-slate-400 mt-3">
                Loading schemes...
              </p>
            </div>
          ) : filteredSchemes.length === 0 ? (

            <div className="p-16 text-center">
              <Tag size={38} className="mx-auto text-slate-300 mb-3" />

              <h3 className="text-sm font-semibold text-slate-700">
                {searchTerm
                  ? "No matching schemes found"
                  : "No schemes available"}
              </h3>

              <p className="text-xs text-slate-400 mt-1">
                {searchTerm
                  ? "Try another search term."
                  : "Click Add Scheme to create your first scheme."}
              </p>
            </div>

          ) : (

            <div className="overflow-x-auto">
              <table className="w-full text-sm">

                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-100">
                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider w-20">
                      Order
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Scheme Name
                    </th>

                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredSchemes.map((scheme, index) => (
                    <tr
                      key={scheme.schemeId}
                      className="hover:bg-slate-50/70 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center justify-center w-8 h-8 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                          {scheme.order ?? index + 1}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-indigo-50 rounded-xl flex items-center justify-center">
                            <Tag size={16} className="text-indigo-600" />
                          </div>

                          <span className="font-semibold text-slate-800">
                            {scheme.schemeName}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex justify-end items-center gap-1.5">

                          {/* View */}

                          <button
                            onClick={() => openView(scheme)}
                            title="View Scheme"
                            className="p-2.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                          >
                            <Eye size={17} />
                          </button>

                          {/* Edit */}

                          <button
                            onClick={() => openEdit(scheme)}
                            title="Edit Scheme"
                            className="p-2.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          >
                            <Edit size={17} />
                          </button>

                          {/* Delete */}

                          <button
                            onClick={() => openDelete(scheme)}
                            title="Delete Scheme"
                            className="p-2.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                          >
                            <Trash2 size={17} />
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}

          <div className="px-6 py-4 border-t border-slate-100 flex justify-between items-center">
            <p className="text-xs text-slate-400">
              Showing {filteredSchemes.length} of {schemes.length} schemes
            </p>
          </div>

        </div>
      </div>

      {showAddModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeAddModal();
          }}
        >
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Plus size={20} className="text-indigo-600" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Add New Scheme
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Enter a name for your new scheme.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeAddModal}
                disabled={isSaving}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleAdd} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Scheme Name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  placeholder="Enter scheme name"
                  value={newSchemeName}
                  onChange={(e) => setNewSchemeName(e.target.value)}
                  className={inputStyle}
                  required
                  maxLength={100}
                  autoFocus
                />

                <p className="text-xs text-slate-400 mt-2">
                  The scheme order and ID will be generated automatically.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeAddModal}
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isSaving || !newSchemeName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50 transition-all"
                >
                  {isSaving ? "Saving..." : "Add Scheme"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                  <Edit size={19} className="text-indigo-600" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Edit Scheme
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Update your scheme details.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeEditModal}
                disabled={isUpdating}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Scheme Name <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={editSchemeName}
                  onChange={(e) => setEditSchemeName(e.target.value)}
                  className={inputStyle}
                  placeholder="Enter scheme name"
                  required
                  maxLength={100}
                  autoFocus
                />
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
                <div className="flex items-center gap-2 text-slate-500">
                  <Hash size={15} />

                  <span className="text-xs font-semibold">
                    Scheme ID
                  </span>
                </div>

                <code className="block text-xs text-slate-500 mt-2 break-all">
                  {editSchemeId}
                </code>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeEditModal}
                  disabled={isUpdating}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={isUpdating || !editSchemeName.trim()}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-700 disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {showViewModal && selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <Eye size={19} className="text-emerald-600" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Scheme Details
                  </h2>

                  <p className="text-xs text-slate-400 mt-0.5">
                    View complete scheme information.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowViewModal(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X size={19} />
              </button>
            </div>

            <div className="p-6 space-y-5">

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Scheme Name
                </p>

                <h3 className="text-xl font-bold text-slate-900 mt-2">
                  {selectedScheme.schemeName}
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Layers size={15} />
                    <span className="text-xs font-semibold">Order</span>
                  </div>

                  <p className="text-lg font-bold text-slate-800 mt-2">
                    {selectedScheme.order ?? "-"}
                  </p>
                </div>

                <div className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Hash size={15} />
                    <span className="text-xs font-semibold">
                      Scheme ID
                    </span>
                  </div>

                  <p className="text-xs font-semibold text-slate-700 mt-2 break-all">
                    {selectedScheme.schemeId}
                  </p>
                </div>

              </div>

              <div className="border border-slate-200 rounded-xl p-4 space-y-4">

                <div>
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <CalendarDays size={15} />
                    <span className="text-xs font-semibold">
                      Created At
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(selectedScheme.createAt)}
                  </p>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2 text-slate-400 mb-2">
                    <RefreshCw size={15} />
                    <span className="text-xs font-semibold">
                      Last Updated
                    </span>
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {formatDate(selectedScheme.updatedAt)}
                  </p>
                </div>

              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={() => setShowViewModal(false)}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 text-center">

            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CircleAlert size={27} className="text-red-500" />
            </div>

            <h2 className="text-lg font-bold text-slate-900">
              Delete Scheme?
            </h2>

            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              Are you sure you want to delete{" "}
              <span className="font-bold text-slate-800">
                "{deleteSchemeName}"
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex items-center gap-3 mt-7">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>

              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
export default SchemeManagement;

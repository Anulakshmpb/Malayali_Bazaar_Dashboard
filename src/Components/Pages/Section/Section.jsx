import React, { useState } from 'react';
import {
    Plus,
    Upload,
    Edit,
    Trash2,
    X,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CommonTable from '../../Shared/Pages/CommonTable';

export default function Section() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    // Mock Data
    const [section] = useState([
        { id: 1, name: "Featured Products", image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=200&h=200" },
        { id: 2, name: "Featured Products", image: "https://images.unsplash.com/photo-1589363460779-fd4be9b64b38?auto=format&fit=crop&w=200&h=200" },
        { id: 3, name: "Featured Products", image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=200&h=200" }
    ]);

    return (
        <div className="min-h-screen bg-white pb-10 page-container">
            <div className="mx-auto max-w-5xl space-y-6">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Section Management</h1>

                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button className="flex items-center gap-2 rounded-xl bg-white border border-tertiary/60 px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-slate-50 focus:outline-none">
                            <Upload size={16} />
                            Bulk Upload
                        </button>
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-secondary focus:outline-none focus:ring-4 focus:ring-primary/20"
                        >
                            <Plus size={18} />
                            Add Section
                        </button>
                    </div>
                </div>

                <CommonTable
                    title="Sections"
                    subtitle="Manage the sections shown in your catalogue"
                    columns={[
                        {
                            key: "name",
                            header: "Name",
                            sortable: true,
                            cellClassName: "font-semibold text-gray-900",
                        },
                    ]}
                    data={section}
                    total={section.length}
                    clientSide
                    rowKey="id"
                    searchPlaceholder="Search sections..."
                    actions={() => (
                        <>
                            <button
                                type="button"
                                title="View section"
                                className="rounded-lg p-2 text-emerald-700 transition hover:bg-emerald-50"
                                onClick={() => navigate("/section/view")}
                            >
                                <Eye size={16} />
                            </button>
                            <button
                                type="button"
                                title="Edit section"
                                className="rounded-lg p-2 text-gray-700 transition hover:bg-slate-100 hover:text-primary"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                type="button"
                                title="Delete section"
                                className="rounded-lg p-2 text-rose-600 transition hover:bg-rose-50"
                            >
                                <Trash2 size={16} />
                            </button>
                        </>
                    )}
                />

            </div>

            {/* Add Category Modal overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-tertiary/30 px-6 py-4">
                            <h2 className="text-lg font-bold text-gray-900">Add New Section</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-slate-100 hover:text-gray-900 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-6 space-y-5">
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                                    Section Name <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Coffee Beans"
                                    className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                                    Display Order <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter order number"
                                    className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                />
                            </div>

                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-tertiary/30 bg-slate-50 px-6 py-4">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="rounded-lg px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-slate-200"
                            >
                                Cancel
                            </button>
                            <button className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary active:scale-95 focus:outline-none focus:ring-4 focus:ring-gray-900/20">
                                Save Section
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

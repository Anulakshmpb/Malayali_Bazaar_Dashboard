import React, { useState } from 'react';
import {
    Plus,
    Upload,
    Search,
    Edit,
    Trash2,
    X,
    Eye
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-tertiary/40 bg-white p-4 shadow-sm">
                    <div className="relative w-full sm:max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" />
                        <input
                            type="text"
                            placeholder="Search categories..."
                            className="w-full rounded-lg border border-tertiary/60 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                        />
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                        Total: {section.length} Sections
                    </div>
                </div>

                {/* Categories Table */}
                <div className="overflow-hidden rounded-xl border border-tertiary/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-900">
                            <thead className="bg-slate-50 border-b border-tertiary/40">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider">SL No</th>
                                    <th className="px-6 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider">Name</th>
                                    <th className="px-6 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider text-center">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tertiary/20">
                                {section.map((category, index) => (
                                    <tr key={category.id} className="transition-colors hover:bg-slate-50/50 group">
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            #{index + 1}
                                        </td>

                                        <td className="px-6 py-4">
                                            <span className="text-base font-bold text-gray-900">{category.name}</span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-center gap-2">
                                                <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 border border-tertiary/60 text-emerald-900 shadow-sm transition hover:bg-white hover:text-emerald-900 focus:outline-none"
                                                    onClick={() => navigate(`/section/view`)}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 border border-tertiary/60 text-gray-900 shadow-sm transition hover:bg-white hover:text-primary focus:outline-none">
                                                    <Edit size={16} />
                                                </button>
                                                <button className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 border border-rose-200 text-rose-600 shadow-sm transition hover:bg-rose-500 hover:text-white hover:border-rose-500 focus:outline-none">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

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

import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, ShieldCheck, Settings } from 'lucide-react';

export default function AdminSettings() {
    const [adminForm, setAdminForm] = useState(false);

    const [permissions, setPermissions] = useState([
        { id: 1, designation: "Super Admin", access: "Full System Access", modules: ["All Modules"] },
        { id: 2, designation: "Manager", access: "Partial Access", modules: ["Dashboard", "Orders", "Products", "Users"] },
        { id: 3, designation: "Editor", access: "Restricted Access", modules: ["Dashboard", "Products (Read Only)"] },
    ]);

    const availableModules = [
        "Dashboard Overview",
        "Order Management",
        "Product Catalog",
        "User & Customer Data",
        "Banner & Marketing",
        "System Settings & Policies"
    ];

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to remove this permission set?")) {
            setPermissions(permissions.filter(p => p.id !== id));
        }
    };

    const handleEdit = (id) => {
        setAdminForm(true);
    };

    return (
        <div className='w-full min-h-screen bg-white pt-24 pb-12 page-container'>
            <div className='max-w-7xl mx-auto'>
                {/* Header Section */}
                <div className='flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8'>
                    <div className='flex flex-col'>
                        <h1 className='text-3xl font-bold bg-gradient-to-br from-primary to-secondary text-transparent bg-clip-text'>Admin Settings & Permissions</h1>
                        <p className='text-secondary/80 mt-1 text-sm'>Configure role-based access control and system settings.</p>
                    </div>
                    <button
                        onClick={() => setAdminForm(true)}
                        className='flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-secondary text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5'
                    >
                        <Plus size={20} />
                        <span>Add Role Permission</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className='bg-white p-4 rounded-2xl shadow-sm border border-tertiary/40 mb-6 flex items-center justify-between'>
                    <div className='relative w-full max-w-md'>
                        <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/50' size={18} />
                        <input
                            type="text"
                            placeholder='Search roles or permissions...'
                            className='w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-tertiary/60 rounded-xl text-primary text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all'
                        />
                    </div>
                </div>

                {/* Table Section */}
                <div className='bg-white rounded-2xl shadow-sm border border-tertiary/40 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left border-collapse'>
                            <thead>
                                <tr className='bg-tertiary/10 border-b border-tertiary/40'>
                                    <th className='px-6 py-4 text-xs font-semibold text-primary uppercase tracking-wider'>Role / Designation</th>
                                    <th className='px-6 py-4 text-xs font-semibold text-primary uppercase tracking-wider'>Access Level</th>
                                    <th className='px-6 py-4 text-xs font-semibold text-primary uppercase tracking-wider'>Allowed Modules</th>
                                    <th className='px-6 py-4 text-xs font-semibold text-primary uppercase tracking-wider text-right'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-tertiary/30'>
                                {permissions.map((perm) => (
                                    <tr key={perm.id} className='hover:bg-tertiary/5 transition-colors duration-150 group'>
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='w-10 h-10 rounded-full bg-tertiary/30 flex items-center justify-center text-primary font-bold shadow-sm'>
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <p className='font-medium text-primary'>{perm.designation}</p>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <span className='inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-tertiary/20 text-primary border border-tertiary/50'>
                                                {perm.access}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <div className='flex flex-wrap gap-1.5'>
                                                {perm.modules.map((mod, idx) => (
                                                    <span key={idx} className='inline-block px-2 py-1 bg-slate-100 text-secondary text-xs rounded-md border border-slate-200'>
                                                        {mod}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className='px-6 py-4 text-right'>
                                            <div className='flex items-center justify-end gap-2 opacity-100 transition-opacity duration-200'>
                                                <button
                                                    onClick={() => handleEdit(perm.id)}
                                                    className='p-2 text-secondary hover:text-primary hover:bg-tertiary/20 rounded-lg transition-colors'
                                                    title='Edit Permissions'
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(perm.id)}
                                                    className='p-2 text-red-800 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors'
                                                    title='Delete Role'
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {permissions.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-secondary/70 text-sm">
                                            No permission sets found.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Modal Overlay for Form */}
                {adminForm && (
                    <div className='fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]'>
                        <div className='bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out] flex flex-col max-h-[90vh]'>
                            <div className='px-6 py-4 border-b border-tertiary/40 flex items-center justify-between bg-tertiary/5 shrink-0'>
                                <div className='flex items-center gap-2'>
                                    <Settings className="text-primary" size={20} />
                                    <h2 className='text-lg font-bold text-primary'>Configure Role Permissions</h2>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setAdminForm(false)}
                                    className='p-2 text-secondary hover:text-primary hover:bg-tertiary/20 rounded-full transition-colors'
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="overflow-y-auto p-6">
                                <form id="permissionForm" className='space-y-6' onSubmit={(e) => { e.preventDefault(); setAdminForm(false); }}>

                                    {/* Role Name */}
                                    <div>
                                        <label className='block text-xs font-semibold text-primary uppercase tracking-wider mb-2'>Role Designation</label>
                                        <input
                                            type="text"
                                            placeholder='e.g., Support Staff, Content Editor'
                                            className='w-full px-4 py-2.5 bg-slate-50 border border-tertiary/80 rounded-xl text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all'
                                            required
                                        />
                                    </div>

                                    <hr className="border-tertiary/30" />

                                    {/* Permissions Grid */}
                                    <div>
                                        <div className='flex items-center justify-between mb-4'>
                                            <label className='block text-xs font-semibold text-primary uppercase tracking-wider'>Module Access Permissions</label>
                                            <span className='text-xs text-secondary'>Select areas this role can access</span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {availableModules.map((module, index) => (
                                                <div key={index} className="flex items-start gap-3 p-3 rounded-xl border border-tertiary/40 hover:bg-tertiary/5 transition-colors">
                                                    <div className="flex items-center h-5 mt-0.5">
                                                        <input
                                                            id={`module-${index}`}
                                                            name={`module-${index}`}
                                                            type="checkbox"
                                                            className="w-4 h-4 text-primary bg-slate-50 border-tertiary rounded focus:ring-primary focus:ring-2 cursor-pointer"
                                                        />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <label htmlFor={`module-${index}`} className="text-sm font-medium text-primary cursor-pointer">
                                                            {module}
                                                        </label>
                                                        {/* <div className="flex gap-4 mt-2">
                                                            <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer hover:text-primary transition-colors">
                                                                <input type="checkbox" className="rounded-sm border-tertiary text-primary focus:ring-primary w-3 h-3 cursor-pointer" /> Read
                                                            </label>
                                                            <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer hover:text-primary transition-colors">
                                                                <input type="checkbox" className="rounded-sm border-tertiary text-primary focus:ring-primary w-3 h-3 cursor-pointer" /> Write
                                                            </label>
                                                            <label className="flex items-center gap-1.5 text-xs text-secondary cursor-pointer hover:text-primary transition-colors">
                                                                <input type="checkbox" className="rounded-sm border-tertiary text-primary focus:ring-primary w-3 h-3 cursor-pointer" /> Delete
                                                            </label>
                                                        </div> */}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </form>
                            </div>

                            <div className='px-6 py-4 border-t border-tertiary/30 bg-slate-50 flex items-center justify-end gap-3 shrink-0 rounded-b-3xl'>
                                <button
                                    type='button'
                                    onClick={() => setAdminForm(false)}
                                    className='px-5 py-2.5 text-sm font-medium text-secondary hover:text-primary hover:bg-tertiary/20 rounded-xl transition-all'
                                >
                                    Cancel
                                </button>
                                <button
                                    form="permissionForm"
                                    type='submit'
                                    className='px-5 py-2.5 text-sm font-medium bg-primary hover:bg-secondary text-white rounded-xl transition-all shadow-md hover:shadow-lg'
                                >
                                    Save Permissions
                                </button>
                            </div>

                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

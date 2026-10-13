import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2, X, Shield, Mail, Phone } from 'lucide-react';

export default function AdminUsers() {
    const [adminForm, setAdminForm] = useState(false);
    const [admins, setAdmins] = useState([
        { id: 1, name: 'Admin', email: 'ram@kenmerk.com', phone: '+1 (555) 123-4567', role: 'Super Admin' },
    ]);

    const handleDelete = (id) => {
        if (window.confirm("Are you sure you want to delete this admin?")) {
            setAdmins(admins.filter(a => a.id !== id));
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
                        <h1 className='text-3xl font-bold bg-gradient-to-br from-primary to-secondary text-transparent bg-clip-text'>Admin Users</h1>
                        <p className='text-secondary/80 mt-1 text-sm'>Manage system administrators and their roles</p>
                    </div>
                    <button 
                        onClick={() => setAdminForm(true)}
                        className='flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-secondary text-white rounded-xl transition-all duration-300 shadow-md hover:shadow-lg hover:-translate-y-0.5'
                    >
                        <Plus size={20} />
                        <span>Add Admin</span>
                    </button>
                </div>

                {/* Search Bar */}
                <div className='bg-white p-4 rounded-2xl shadow-sm border border-tertiary/40 mb-6 flex items-center justify-between'>
                    <div className='relative w-full max-w-md'>
                        <Search className='absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/50' size={18} />
                        <input 
                            type="text" 
                            placeholder='Search administrators...' 
                            className='w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-tertiary/60 rounded-xl text-primary text-sm focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all' 
                        />
                    </div>
                </div>

                {/* Table  */}
                <div className='bg-white rounded-2xl shadow-sm border border-tertiary/40 overflow-hidden'>
                    <div className='overflow-x-auto'>
                        <table className='w-full text-left border-collapse'>
                            <thead>
                                <tr className='bg-tertiary/10 border-b border-tertiary/40'>
                                    <th className='px-6 py-4 text-xs font-semibold text-primary uppercase tracking-wider'>Admin Details</th>
                                    <th className='px-6 py-4 text-xs font-semibold text-primary uppercase tracking-wider'>Contact</th>
                                    <th className='px-6 py-4 text-xs font-semibold text-primary uppercase tracking-wider'>Role</th>
                                    <th className='px-6 py-4 text-xs font-semibold text-primary uppercase tracking-wider text-right'>Actions</th>
                                </tr>
                            </thead>
                            <tbody className='divide-y divide-tertiary/30'>
                                {admins.map((admin) => (
                                    <tr key={admin.id} className='hover:bg-tertiary/5 transition-colors duration-150 group'>
                                        <td className='px-6 py-4'>
                                            <div className='flex items-center gap-3'>
                                                <div className='w-10 h-10 rounded-full bg-tertiary/30 flex items-center justify-center text-primary font-bold shadow-sm'>
                                                    {admin.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className='font-medium text-primary'>{admin.name}</p>
                                                    <p className='text-xs text-secondary/70 mt-0.5 flex items-center gap-1'>
                                                        <Mail size={12} /> {admin.email}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <p className='text-sm text-primary flex items-center gap-1.5'>
                                                <Phone size={14} className="text-secondary/60" /> {admin.phone}
                                            </p>
                                        </td>
                                        <td className='px-6 py-4'>
                                            <span className='inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-tertiary/30 text-primary border border-tertiary/50'>
                                                <Shield size={12} /> {admin.role}
                                            </span>
                                        </td>
                                        <td className='px-6 py-4 text-right'>
                                            <div className='flex items-center justify-end gap-2 opacity-100 transition-opacity duration-200'>
                                                <button 
                                                    onClick={() => handleEdit(admin.id)}
                                                    className='p-2 text-secondary hover:text-primary hover:bg-tertiary/20 rounded-lg transition-colors'
                                                    title='Edit Admin'
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(admin.id)}
                                                    className='p-2 text-red-800 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors'
                                                    title='Delete Admin'
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {admins.length === 0 && (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-8 text-center text-secondary/70 text-sm">
                                            No administrators found.
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
                        <div className='bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-[slideUp_0.3s_ease-out]'>
                            <div className='px-6 py-4 border-b border-tertiary/40 flex items-center justify-between bg-tertiary/5'>
                                <h2 className='text-lg font-bold text-primary'>Add New Admin</h2>
                                <button 
                                    onClick={() => setAdminForm(false)}
                                    className='p-2 text-secondary hover:text-primary hover:bg-tertiary/20 rounded-full transition-colors'
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <form className='p-6 space-y-5' onSubmit={(e) => { e.preventDefault(); setAdminForm(false); }}>
                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                                    <div>
                                        <label className='block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5'>Full Name</label>
                                        <input type="text" placeholder='John Doe' className='w-full px-4 py-2.5 bg-slate-50 border border-tertiary/80 rounded-xl text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all' required />
                                    </div>
                                    <div>
                                        <label className='block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5'>Role</label>
                                        <select className='w-full px-4 py-2.5 bg-slate-50 border border-tertiary/80 rounded-xl text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all'>
                                            <option>Super Admin</option>
                                            <option>Manager Admin</option>
                                            <option>Editor</option>
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className='block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5'>Email Address</label>
                                    <input type="email" placeholder='admin@example.com' className='w-full px-4 py-2.5 bg-slate-50 border border-tertiary/80 rounded-xl text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all' required />
                                </div>

                                <div>
                                    <label className='block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5'>Phone Number</label>
                                    <input type="tel" placeholder='+1 (555) 000-0000' className='w-full px-4 py-2.5 bg-slate-50 border border-tertiary/80 rounded-xl text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all' required />
                                </div>

                                <div className='grid grid-cols-1 sm:grid-cols-2 gap-5'>
                                    <div>
                                        <label className='block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5'>Password</label>
                                        <input type="password" placeholder='••••••••' className='w-full px-4 py-2.5 bg-slate-50 border border-tertiary/80 rounded-xl text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all' required />
                                    </div>
                                    <div>
                                        <label className='block text-xs font-semibold text-primary uppercase tracking-wider mb-1.5'>Confirm Password</label>
                                        <input type="password" placeholder='••••••••' className='w-full px-4 py-2.5 bg-slate-50 border border-tertiary/80 rounded-xl text-primary text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all' required />
                                    </div>
                                </div>

                                <div className='pt-2 flex items-center justify-end gap-3 border-t border-tertiary/30 mt-6 pt-5'>
                                    <button 
                                        type='button' 
                                        onClick={() => setAdminForm(false)}
                                        className='px-5 py-2.5 text-sm font-medium text-secondary hover:text-primary hover:bg-tertiary/20 rounded-xl transition-all'
                                    >
                                        Cancel
                                    </button>
                                    <button 
                                        type='submit' 
                                        className='px-5 py-2.5 text-sm font-medium bg-primary hover:bg-secondary text-white rounded-xl transition-all shadow-md hover:shadow-lg'
                                    >
                                        Create Admin
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

import React, { useState } from 'react';
import { 
    Plus, 
    Upload, 
    Search, 
    Edit, 
    Trash2, 
    X,
    Image as ImageIcon
} from 'lucide-react';

export default function Category() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [categories, setCategories] = useState([
        { 
            id: 1, 
            name: "Coffee", 
            image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=600&h=400",
            isVisible: true,
            itemCount: 24
        },
        { 
            id: 2, 
            name: "Tea", 
            image: "https://images.unsplash.com/photo-1589363460779-fd4be9b64b38?auto=format&fit=crop&w=600&h=400",
            isVisible: true,
            itemCount: 18
        },
        { 
            id: 3, 
            name: "Accessories", 
            image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=600&h=400",
            isVisible: false,
            itemCount: 32
        },
        { 
            id: 4, 
            name: "Syrups & Flavors", 
            image: "https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&h=400",
            isVisible: true,
            itemCount: 12
        }
    ]);

    const [searchQuery, setSearchQuery] = useState('');

    const toggleVisibility = (id) => {
        setCategories(categories.map(c => 
            c.id === id ? { ...c, isVisible: !c.isVisible } : c
        ));
    };

    const handleDeleteCategory = (id) => {
        if (window.confirm("Are you sure you want to delete this category?")) {
            setCategories(categories.filter(c => c.id !== id));
        }
    };

    const filteredCategories = categories.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white pb-10 page-container">
            <div className="mx-auto max-w-7xl space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Category Management
                        </h1>
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
                            Add Category
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
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full rounded-lg border border-tertiary/60 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                        />
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                        Total: {filteredCategories.length} Categories
                    </div>
                </div>

                {/* Categories Cards Grid (Like in Banner Page) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {filteredCategories.map((category) => (
                        <div 
                            key={category.id} 
                            className="group relative overflow-hidden rounded-2xl border border-tertiary/40 bg-white shadow-sm transition-all hover:shadow-lg hover:border-tertiary/60 flex flex-col"
                        >
                            {/* Card Image Header */}
                            <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                                <img 
                                    src={category.image} 
                                    alt={category.name} 
                                    className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${!category.isVisible ? 'grayscale opacity-70' : ''}`}
                                />
                                <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                {/* Overlay Actions */}
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    <button 
                                        type="button"
                                        onClick={() => setIsModalOpen(true)}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-gray-900 shadow-lg backdrop-blur transition hover:bg-white hover:text-primary focus:outline-none"
                                        title="Edit Category"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => handleDeleteCategory(category.id)}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-rose-500 shadow-lg backdrop-blur transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none"
                                        title="Delete Category"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            
                            {/* Card Body */}
                            <div className="flex flex-col p-5 flex-1 bg-white justify-between">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <span className="inline-flex items-center justify-center rounded-md border border-tertiary/60 bg-slate-50 px-2.5 py-0.5 text-xs font-bold text-gray-900 shadow-sm mb-2">
                                            {category.itemCount} Products
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900">{category.name}</h3>
                                    </div>
                                    
                                    {/* Visibility Toggle */}
                                    <label className="relative inline-flex items-center cursor-pointer mt-1" title={category.isVisible ? 'Visible' : 'Hidden'}>
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={category.isVisible}
                                            onChange={() => toggleVisibility(category.id)}
                                        />
                                        <div className="h-6 w-11 rounded-full bg-slate-200 shadow-inner peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* Add Category Modal overlay */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-tertiary/30 px-6 py-4">
                            <h2 className="text-lg font-bold text-gray-900">Add New Category</h2>
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
                                    Category Name <span className="text-rose-500">*</span>
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="e.g. Coffee Beans" 
                                    className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                                    Category Image
                                </label>
                                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-tertiary/60 bg-slate-50/70 p-4 text-center transition hover:border-primary/60 hover:bg-primary/5">
                                    <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm text-secondary group-hover:scale-105 transition-transform">
                                        <ImageIcon size={20} />
                                    </div>
                                    <p className="text-sm font-bold text-gray-900">Click to upload image</p>
                                    <p className="mt-1 text-xs text-secondary/70">JPG, PNG or WEBP (Max 2MB)</p>
                                    <input type="file" className="sr-only" accept="image/*" />
                                </label>
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
                                Save Category
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

import React, { useState } from 'react';
import { 
    Search, 
    Plus, 
    Upload, 
    Download, 
    Tags, 
    Layers, 
    Archive,
    Edit,
    Trash2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Products() {
    // Mock products data
    const [products, setProducts] = useState([
        {
            id: 1,
            name: "Premium Arabica Coffee",
            description: "High-quality roasted coffee beans sourced directly from the finest farms.",
            unit: "500g",
            price: 24.99,
            image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            isVisible: true
        },
        {
            id: 2,
            name: "Ceramic Coffee Mug",
            description: "Minimalist ceramic mug, perfect for your morning brew. Holds 12oz.",
            unit: "1 piece",
            price: 15.50,
            image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            isVisible: true
        },
        {
            id: 3,
            name: "Barista Apron",
            description: "Durable canvas apron with leather straps and deep pockets.",
            unit: "1 piece",
            price: 45.00,
            image: "https://images.unsplash.com/photo-1589363460779-fd4be9b64b38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            isVisible: false
        },
        {
            id: 4,
            name: "Espresso Machine",
            description: "Professional grade espresso machine for the perfect shot every time.",
            unit: "1 piece",
            price: 299.00,
            image: "https://images.unsplash.com/photo-1520286884323-5e921d7b0f69?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
            isVisible: true
        }
    ]);
  const navigate = useNavigate();
    const toggleVisibility = (id) => {
        setProducts(products.map(p => 
            p.id === id ? { ...p, isVisible: !p.isVisible } : p
        ));
    };

    const handleDeleteProduct = (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            setProducts(products.filter(p => p.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-white pb-12 page-container">
            <div className="max-w-7xl mx-auto space-y-6">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                                Products Management
                        </h1>
                        
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-tertiary/60 text-gray-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onClick={()=>navigate('/products/stock')}>
                            <Archive size={16} className="text-secondary" /> Stock Management
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-tertiary/60 text-gray-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onClick={()=>navigate('/products/category')}>
                            <Layers size={16} className="text-secondary" /> Categories
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-tertiary/60 text-gray-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        onClick={()=>navigate('/products/brand')}>
                            <Tags size={16} className="text-secondary" /> Brand
                        </button>
                    </div>
                </div>

                {/* Toolbar Section */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col xl:flex-row justify-between items-center gap-4">
                    
                    {/* Search */}
                    <div className="relative w-full xl:max-w-md">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={18} className="text-secondary/50" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search Products..."
                            className="block w-full pl-10 pr-3 py-2.5 border border-tertiary/60 rounded-xl focus:ring-1 focus:ring-tertiary/40 focus:border-tertiary sm:text-sm text-gray-900 bg-slate-50 hover:bg-white transition-colors outline-none placeholder:text-secondary/50 font-medium"
                        />
                    </div>

                    {/* Primary Actions */}
                    <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-gray-900 border border-tertiary/50 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <Download size={16} className="text-secondary" />
                            <span>Export CSV</span>
                        </button>
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-50 text-gray-900 border border-tertiary/50 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20">
                            <Upload size={16} className="text-secondary" />
                            <span>Bulk Upload</span>
                        </button>
                        <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-secondary transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-primary/40"
                        onClick={()=>navigate('/products/add')}>
                            <Plus size={18} />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {products.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl border border-tertiary/40 overflow-hidden shadow-sm hover:shadow-md hover:border-tertiary/80 transition-all duration-300 group flex flex-col">
                            
                            {/* Image Container */}
                            <div className="h-32 w-full relative overflow-hidden bg-slate-100">
                                <img 
                                    src={product.image} 
                                    alt={product.name} 
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                />
                            </div>

                            {/* Content */}
                            <div className="p-2.5 flex flex-col justify-between flex-1">
                                <div>
                                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1" title={product.name}>
                                        {product.name}
                                    </h3>
                                    
                                    <div className="mt-1 flex items-baseline justify-between">
                                        <span className="text-sm font-extrabold text-gray-900">${product.price.toFixed(2)}</span>
                                        <span className="text-[11px] font-medium text-gray-500">{product.unit}</span>
                                    </div>
                                </div>

                                {/* Bottom Row: Visibility Toggle & Actions */}
                                <div className="mt-2 pt-2 border-t border-tertiary/20 flex items-center justify-between gap-1.5">
                                    {/* Visibility Toggle */}
                                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none" title={product.isVisible ? 'Visible to customers' : 'Hidden from customers'}>
                                        <div className="relative inline-flex items-center">
                                            <input 
                                                type="checkbox" 
                                                className="sr-only peer" 
                                                checked={product.isVisible}
                                                onChange={() => toggleVisibility(product.id)}
                                            />
                                            <div className="w-8 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-600 hidden xs:inline sm:inline">
                                            {product.isVisible ? 'Visible' : 'Hidden'}
                                        </span>
                                    </label>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <button 
                                            type="button"
                                            onClick={() => navigate('/products/add')}
                                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-secondary rounded-md border border-tertiary/40 transition-colors"
                                            title="Edit Product"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => handleDeleteProduct(product.id)}
                                            className="p-1.5 bg-rose-50/70 hover:bg-rose-100 text-rose-600 rounded-md border border-rose-200/60 transition-colors"
                                            title="Delete Product"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </div>
    )
}

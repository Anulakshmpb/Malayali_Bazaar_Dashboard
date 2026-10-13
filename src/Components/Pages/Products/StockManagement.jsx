import React, { useState } from 'react';
import {
    Download,
    RefreshCw,
    Search,
    AlertCircle,
    PackageX,
    PackageCheck,
    ChevronDown,
} from 'lucide-react';

export default function StockManagement() {
    const [products, setProducts] = useState([
        {
            id: '1',
            name: 'Premium Arabica Coffee',
            sku: 'PRD-001',
            category: 'Coffee',
            price: 150.00,
            stock: 45,
            image: 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: '2',
            name: 'Ceramic Coffee Mug',
            sku: 'PRD-002',
            category: 'Accessories',
            price: 250.00,
            stock: 120,
            image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: '3',
            name: 'Matcha Green Tea',
            sku: 'PRD-003',
            category: 'Tea',
            price: 300.00,
            stock: 3,
            image: 'https://images.unsplash.com/photo-1589363460779-fd4be9b64b38?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        },
        {
            id: '4',
            name: 'Paper Filter Packs',
            sku: 'PRD-004',
            category: 'Accessories',
            price: 45.00,
            stock: 0,
            image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
        }
    ]);

    const handleUpdateStock = (productId, newStock) => {
        if (isNaN(newStock) || newStock < 0) return;
        setProducts(prevProducts =>
            prevProducts.map(p =>
                p.id === productId ? { ...p, stock: newStock } : p
            )
        );
    };

    const stats = [
        { 
            title: 'Low Stock Products', 
            value: products.filter(p => p.stock > 0 && p.stock <= 5).length, 
            icon: AlertCircle, 
            color: 'text-amber-500', 
            bg: 'bg-amber-50', 
            border: 'border-amber-200' 
        },
        { 
            title: 'Out of Stock', 
            value: products.filter(p => p.stock === 0).length, 
            icon: PackageX, 
            color: 'text-rose-500', 
            bg: 'bg-rose-50', 
            border: 'border-rose-200' 
        },
        { 
            title: 'In Stock', 
            value: products.filter(p => p.stock > 5).length, 
            icon: PackageCheck, 
            color: 'text-emerald-500', 
            bg: 'bg-emerald-50', 
            border: 'border-emerald-200' 
        },
    ];

    return (
        <div className="min-h-screen bg-white pb-10 page-container">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className='items-start'>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Stock Management</h1>
                    </div>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 rounded-lg bg-rose-50 px-4 py-2.5 text-sm font-bold text-rose-600 transition hover:bg-rose-100 border border-rose-200 shadow-sm focus:outline-none">
                            <Download size={16} />
                            Download CSV
                        </button>
                        <button className="flex items-center gap-2 rounded-lg bg-white border border-tertiary/60 px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-slate-50 focus:outline-none">
                            <RefreshCw size={16} className="text-secondary" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    {stats.map((stat, idx) => (
                        <div key={idx} className={`flex items-center gap-4 rounded-xl border ${stat.border} bg-white p-5 shadow-sm`}>
                            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stat.bg} ${stat.color}`}>
                                <stat.icon size={24} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-900">{stat.title}</p>
                                <p className={`text-2xl font-black mt-0.5 ${stat.color}`}>{stat.value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 rounded-xl border border-tertiary/40 bg-white p-4 shadow-sm">

                    <div className="flex flex-1 flex-wrap items-center gap-3">
                        <div className="relative w-full max-w-sm">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" />
                            <input
                                type="text"
                                placeholder="Search products, SKU..."
                                className="w-full rounded-lg border border-tertiary/60 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 transition-colors placeholder:text-secondary/50"
                            />
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                            <input type="date" className="rounded-lg border border-tertiary/60 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:bg-white transition-colors text-secondary" />
                            <span className="text-secondary/60 font-bold">to</span>
                            <input type="date" className="rounded-lg border border-tertiary/60 bg-slate-50 px-3 py-2.5 text-sm font-semibold outline-none focus:border-primary focus:bg-white transition-colors text-secondary" />
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex rounded-lg border border-tertiary/60 bg-slate-50 p-1">
                            {['All', 'Low Stock', 'Out of Stock', 'In Stock'].map(tab => (
                                <button key={tab} className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${tab === 'All' ? 'bg-white text-gray-900 shadow-sm border border-tertiary/40' : 'text-secondary/70 hover:text-gray-900'}`}>
                                    {tab}
                                </button>
                            ))}
                        </div>

                        <div className="relative">
                            <select className="appearance-none rounded-lg border border-tertiary/60 bg-white py-2.5 pl-4 pr-9 text-sm font-bold text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-colors shadow-sm cursor-pointer">
                                <option value="">Sort By</option>
                                <option value="stock_asc">Stock: Low to High</option>
                                <option value="stock_desc">Stock: High to Low</option>
                                <option value="name_asc">Name: A to Z</option>
                                <option value="name_desc">Name: Z to A</option>
                            </select>
                            <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary/70" />
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-tertiary/40 bg-white shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-900">
                            <thead className="bg-slate-50 border-b border-tertiary/40">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider w-20">SL NO.</th>
                                    <th className="px-6 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider">Product</th>
                                    <th className="px-6 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider">Category</th>
                                    <th className="px-6 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider">Price</th>
                                    <th className="px-6 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider">Current stock</th>
                                    <th className="px-6 py-4 font-bold text-secondary uppercase text-[11px] tracking-wider text-right">Update Stock</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-tertiary/20">
                                {products.map((product, index) => {
                                    const isOutOfStock = product.stock === 0;
                                    const isLowStock = product.stock > 0 && product.stock <= 5;

                                    return (
                                        <tr key={product.id} className="transition-colors hover:bg-slate-50/50 group">
                                            
                                            {/* 1. SL NO. */}
                                            <td className="px-6 py-4 font-bold text-gray-700 whitespace-nowrap">
                                                #{index + 1}
                                            </td>

                                            {/* 2. Product */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-tertiary/40 bg-slate-100 shadow-sm">
                                                        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{product.name}</p>
                                                        <p className="text-xs font-semibold text-secondary/70 mt-0.5">SKU: <span className="text-gray-900">{product.sku}</span></p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* 3. Category */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex items-center justify-center rounded-md border border-tertiary/60 bg-white px-2.5 py-1 text-xs font-bold text-gray-900 shadow-sm">
                                                    {product.category}
                                                </span>
                                            </td>

                                            {/* 4. Price */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="text-sm font-extrabold text-gray-900">
                                                    ₹{Number(product.price).toFixed(2)}
                                                </span>
                                            </td>

                                            {/* 5. Current stock */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                                        isOutOfStock ? 'bg-rose-50 text-rose-600 border border-rose-200' :
                                                        isLowStock ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                                                        'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                    }`}>
                                                        {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                                                    </span>
                                                    <span className={`text-base font-black ${
                                                        isOutOfStock ? 'text-rose-600' :
                                                        isLowStock ? 'text-amber-600' :
                                                        'text-gray-900'
                                                    }`}>
                                                        {product.stock}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* 6. Update Stock */}
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <div className="inline-flex items-center justify-end gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        id={`stock-input-${product.id}`}
                                                        defaultValue={product.stock}
                                                        key={`input-${product.id}-${product.stock}`}
                                                        className="w-20 rounded-md border border-tertiary/60 bg-white px-2 py-1 text-center text-xs font-bold text-gray-900 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-inner"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const input = document.getElementById(`stock-input-${product.id}`);
                                                            if (input && input.value !== '') {
                                                                handleUpdateStock(product.id, parseInt(input.value, 10));
                                                            }
                                                        }}
                                                        className="rounded-md bg-gray-900 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-900/40"
                                                    >
                                                        Set
                                                    </button>
                                                </div>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}

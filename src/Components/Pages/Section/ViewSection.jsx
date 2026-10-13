import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Link2, Trash2, Loader2, Plus } from 'lucide-react';

// Mock AutocompleteBox for the template
const AutocompleteBox = ({ collectionName, labelField, value, onChange, placeholder, id }) => {
    return (
        <select
            id={id}
            className="w-full h-[42px] px-3 py-2 border border-slate-200 rounded-xl bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            onChange={(e) => {
                if (e.target.value) {
                    onChange({ [labelField]: e.target.value });
                } else {
                    onChange(null);
                }
            }}
        >
            <option value="">{placeholder}</option>
            <option value="Premium Arabica Coffee">Premium Arabica Coffee</option>
            <option value="Ceramic Coffee Mug">Ceramic Coffee Mug</option>
            <option value="Organic Matcha Tea">Organic Matcha Tea</option>
        </select>
    );
};

export default function ViewSection() {
    const navigate = useNavigate();

    // Mock Data State
    const [section] = useState({ name: "Featured Products" });
    const [categories, setCategories] = useState([
        { 
            id: 1, 
            title: "Coffee", 
            image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=200&h=200" 
        },
        { 
            id: 2, 
            title: "Accessories", 
            image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=200&h=200" 
        }
    ]);
    const [products, setProducts] = useState([
        { 
            id: 1, 
            productName: "Premium Arabica Coffee", 
            image: "https://images.unsplash.com/photo-1559525839-b184a4d698c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200" 
        },
        { 
            id: 2, 
            productName: "Ceramic Coffee Mug", 
            image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200" 
        }
    ]);

    // Form State
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [addingProduct, setAddingProduct] = useState(false);
    const [loadingProducts] = useState(false);

    // Handlers
    const handleRemoveCategory = (cat) => {
        setCategories(categories.filter(c => c.id !== cat.id));
    };

    const handleRemoveProduct = (prod) => {
        setProducts(products.filter(p => p.id !== prod.id));
    };

    const handleAddProduct = (e) => {
        e.preventDefault();
        if (selectedProduct) {
            setAddingProduct(true);
            const productImages = {
                "Premium Arabica Coffee": "https://images.unsplash.com/photo-1559525839-b184a4d698c7?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
                "Ceramic Coffee Mug": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
                "Organic Matcha Tea": "https://images.unsplash.com/photo-1589363460779-fd4be9b64b38?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"
            };
            // Simulate network request
            setTimeout(() => {
                const newProduct = {
                    id: Date.now(),
                    productName: selectedProduct.productName,
                    image: productImages[selectedProduct.productName] || "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=200&h=200"
                };
                setProducts([...products, newProduct]);
                setAddingProduct(false);
                setSelectedProduct(null);
            }, 500);
        }
    };

    return (
        <div className="min-h-screen bg-white pb-10 page-container">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Page Header */}
                <div className="flex items-center gap-4 pt-2">
                    <button
                        onClick={() => navigate('/section')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer flex items-center justify-center focus:outline-none"
                        title="Back to Sections"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div className='text-left'>
                        <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Section Details</span>
                        <h2 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            {section?.name}</h2>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Category Linker Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Link2 size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Linked Categories</h3>
                        </div>
                        <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {categories.length} {categories.length === 1 ? 'Category' : 'Categories'}
                        </span>
                    </div>

                        <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                            <table className="w-full border-collapse text-left">
                                <thead>
                                    <tr className="border-b border-slate-200 bg-slate-50/50 font-semibold">
                                        <th className="p-4 text-[0.8rem] uppercase tracking-wider text-slate-500 font-bold text-center w-[50px]">#</th>
                                        <th className="p-4 text-[0.8rem] uppercase tracking-wider text-slate-500 font-bold w-[70px]">Image</th>
                                        <th className="p-4 text-[0.8rem] uppercase tracking-wider text-slate-500 font-bold">Category Name</th>
                                        <th className="p-4 text-[0.8rem] uppercase tracking-wider text-slate-500 font-bold text-right w-[90px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {categories.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-center py-10 text-slate-400 font-medium">
                                                No categories linked to this section yet.
                                            </td>
                                        </tr>
                                    ) : (
                                        categories.map((cat, index) => (
                                            <tr key={cat.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-b-0 transition-colors">
                                                <td className="p-3 text-center text-slate-500 font-semibold">{index + 1}</td>
                                                <td className="p-3">
                                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
                                                        <img 
                                                            src={cat.image} 
                                                            alt={cat.title} 
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="p-3 text-slate-800 font-semibold">{cat.title}</td>
                                                <td className="p-3 text-right">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveCategory(cat)}
                                                        className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border-none cursor-pointer focus:outline-none"
                                                        title="Remove category link"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                </div>

                {/* Product Linker Card */}
                <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <Link2 size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Linked Products</h3>
                        </div>
                        <span className="bg-slate-100 text-slate-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {products.length} {products.length === 1 ? 'Product' : 'Products'}
                        </span>
                    </div>

                    <form onSubmit={handleAddProduct} className="flex gap-3 items-end">
                        <div className="flex-1 space-y-2">
                            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">Select Product</label>
                            <AutocompleteBox
                                collectionName="products"
                                labelField="productName"
                                value={selectedProduct ? (selectedProduct.productName || '') : ''}
                                onChange={(item) => setSelectedProduct(item)}
                                placeholder="Search products..."
                                id="products-select"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={addingProduct || !selectedProduct}
                            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 h-[42px] min-w-[90px] rounded-xl font-semibold border-none transition-all bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-900/20"
                        >
                            {addingProduct ? <Loader2 size={16} className="animate-spin text-white" /> : <><Plus size={16} /><span>Add</span></>}
                        </button>
                    </form>

                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-inner">
                        <table className="w-full border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/50 font-semibold">
                                    <th className="p-4 text-[0.8rem] uppercase tracking-wider text-slate-500 font-bold text-center w-[50px]">#</th>
                                    <th className="p-4 text-[0.8rem] uppercase tracking-wider text-slate-500 font-bold w-[70px]">Image</th>
                                    <th className="p-4 text-[0.8rem] uppercase tracking-wider text-slate-500 font-bold">Product Name</th>
                                    <th className="p-4 text-[0.8rem] uppercase tracking-wider text-slate-500 font-bold text-right w-[90px]">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingProducts ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-slate-400 font-medium">
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Loading linked products...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="text-center py-10 text-slate-400 font-medium">
                                            No products linked to this section yet.
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((prod, index) => (
                                        <tr key={prod.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-b-0 transition-colors">
                                            <td className="p-3 text-center text-slate-500 font-semibold">{index + 1}</td>
                                            <td className="p-3">
                                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 shadow-sm">
                                                    <img 
                                                        src={prod.image} 
                                                        alt={prod.productName} 
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-800 font-semibold">{prod.productName}</td>
                                            <td className="p-3 text-right">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveProduct(prod)}
                                                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition-colors border-none cursor-pointer focus:outline-none"
                                                    title="Remove product link"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
         </div>
    );
}

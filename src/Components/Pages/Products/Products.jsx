import React, { useEffect, useMemo, useState } from 'react';
import {
    Search,
    Plus,
    Upload,
    Download,
    Tags,
    Layers,
    Archive,
    Edit,
    Trash2,
    X,
    Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { collection, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../../Config/Firebase';
import { useToast } from '../../Shared/hooks/ToastContext';

export default function Products() {
    const navigate = useNavigate();
    const { showToast } = useToast();
    const functions = useMemo(() => getFunctions(app, 'europe-west1'), []);
    const manageProductCallable = useMemo(
        () => httpsCallable(functions, 'manageProduct'),
        [functions]
    );
    const manageProductTypeCallable = useMemo(
        () => httpsCallable(functions, 'manageProductType'),
        [functions]
    );
    const [productTypeModal, setProductTypeModal] = useState(false);
    const [productTypes, setProductTypes] = useState([]);
    const [newTypeName, setNewTypeName] = useState("");
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [editingTypeName, setEditingTypeName] = useState("");
    const [productTypesLoading, setProductTypesLoading] = useState(false);
    const [savingProductType, setSavingProductType] = useState(false);
    const [deletingProductTypeId, setDeletingProductTypeId] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingProductId, setUpdatingProductId] = useState(null);
    const [deletingProductId, setDeletingProductId] = useState(null);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'products'),
            (snapshot) => {
                setProducts(snapshot.docs.map(document => ({
                    id: document.id,
                    ...document.data(),
                })));
                setLoading(false);
            },
            (error) => {
                console.error('Failed to load products:', error);
                setLoading(false);
                showToast('Unable to load products.', 'error');
            }
        );

        return unsubscribe;
    }, [showToast]);

    const loadProductTypes = async () => {
        setProductTypesLoading(true);
        try {
            const response = await manageProductTypeCallable({ action: 'list' });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to load product types.');
            }
            setProductTypes(response.data.data || []);
        } catch (error) {
            console.error('Failed to load product types:', error);
            showToast(error.message || 'Unable to load product types.', 'error');
        } finally {
            setProductTypesLoading(false);
        }
    };

    useEffect(() => {
        loadProductTypes();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const handleAddProductType = async () => {
        const productTypeName = newTypeName.trim();
        if (!productTypeName) return;
        setSavingProductType(true);
        try {
            const response = await manageProductTypeCallable({
                action: 'add',
                fields: { productTypeName },
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to add product type.');
            }
            showToast(response.data.message || 'Product type added successfully.', 'success');
            setNewTypeName('');
            await loadProductTypes();
        } catch (error) {
            console.error('Failed to add product type:', error);
            showToast(error.message || 'Unable to add product type.', 'error');
        } finally {
            setSavingProductType(false);
        }
    };

    const handleDeleteProductType = async (type) => {
        if (!window.confirm(`Are you sure you want to delete ${type.productTypeName}?`)) return;
        setDeletingProductTypeId(type.id);
        try {
            const response = await manageProductTypeCallable({
                action: 'delete',
                fields: { productTypeId: type.id },
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to delete product type.');
            }
            showToast(response.data.message || 'Product type deleted successfully.', 'success');
            if (editingTypeId === type.id) {
                setEditingTypeId(null);
                setEditingTypeName('');
            }
            await loadProductTypes();
        } catch (error) {
            console.error('Failed to delete product type:', error);
            showToast(error.message || 'Unable to delete product type.', 'error');
        } finally {
            setDeletingProductTypeId(null);
        }
    };

    const handleStartEdit = (type) => {
        setEditingTypeId(type.id);
        setEditingTypeName(type.productTypeName);
    };

    const handleSaveEdit = async (id) => {
        const productTypeName = editingTypeName.trim();
        if (!productTypeName) return;
        setSavingProductType(true);
        try {
            const response = await manageProductTypeCallable({
                action: 'update',
                fields: { productTypeId: id, productTypeName },
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to update product type.');
            }
            showToast(response.data.message || 'Product type updated successfully.', 'success');
            setEditingTypeId(null);
            setEditingTypeName('');
            await loadProductTypes();
        } catch (error) {
            console.error('Failed to update product type:', error);
            showToast(error.message || 'Unable to update product type.', 'error');
        } finally {
            setSavingProductType(false);
        }
    };

    const filteredProducts = products.filter(product =>
        (product.productName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.productSKU || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.productId || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleVisibility = async (product) => {
        setUpdatingProductId(product.id);
        try {
            const response = await manageProductCallable({
                action: 'edit',
                productDocId: product.id,
                fields: { productVisible: !product.productVisible },
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || response.data?.error || 'Unable to update product visibility.');
            }
            showToast(response.data.message || 'Product visibility updated.', 'success');
        } catch (error) {
            console.error('Failed to update product visibility:', error);
            showToast(error.message || 'Unable to update product visibility.', 'error');
        } finally {
            setUpdatingProductId(null);
        }
    };

    const handleDeleteProduct = async (id) => {
        if (!window.confirm("Are you sure you want to delete this product?")) return;
        setDeletingProductId(id);
        try {
            const response = await manageProductCallable({
                action: 'delete',
                productDocId: id,
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || response.data?.error || 'Unable to delete product.');
            }
            showToast(response.data.message || 'Product deleted successfully.', 'success');
        } catch (error) {
            console.error('Failed to delete product:', error);
            showToast(error.message || 'Unable to delete product.', 'error');
        } finally {
            setDeletingProductId(null);
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
                            onClick={() => navigate('/products/stock')}>
                            <Archive size={16} className="text-secondary" /> Stock Management
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-tertiary/60 text-gray-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            onClick={() => setProductTypeModal(true)}>
                            <Layers size={16} className="text-secondary" /> Product Type
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-tertiary/60 text-gray-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            onClick={() => navigate('/products/category')}>
                            <Layers size={16} className="text-secondary" /> Categories
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-tertiary/60 text-gray-900 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            onClick={() => navigate('/products/brand')}>
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
                            value={searchTerm}
                            onChange={event => setSearchTerm(event.target.value)}
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
                            onClick={() => navigate('/products/add')}>
                            <Plus size={18} />
                            Add Product
                        </button>
                    </div>
                </div>

                {/* Products Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {loading ? (
                        <p className="col-span-full py-8 text-center text-sm text-gray-500">Loading products...</p>
                    ) : filteredProducts.length === 0 ? (
                        <p className="col-span-full py-8 text-center text-sm text-gray-500">
                            {searchTerm ? 'No products match your search.' : 'No products found.'}
                        </p>
                    ) : filteredProducts.map((product) => (
                        <div key={product.id} className="bg-white rounded-xl border border-tertiary/40 overflow-hidden shadow-sm hover:shadow-md hover:border-tertiary/80 transition-all duration-300 group flex flex-col">

                            {/* Image Container */}
                            <div className="h-32 w-full relative overflow-hidden bg-slate-100">
                                <img
                                    src={product.thumbnail || product.images?.[0] || ''}
                                    alt={product.productName || 'Product'}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                                />
                            </div>

                            {/* Content */}
                            <div className="p-2.5 flex flex-col justify-between flex-1">
                                <div>
                                    <h3 className="text-xs sm:text-sm font-bold text-gray-900 line-clamp-1" title={product.productName}>
                                        {product.productName}
                                    </h3>

                                    <div className="mt-1 flex items-baseline justify-between">
                                        <span className="text-sm font-extrabold text-gray-900">₹{Number(product.offerPrice || product.mrp || 0).toFixed(2)}</span>
                                        <span className="text-[11px] font-medium text-gray-500">{product.unit}</span>
                                    </div>
                                </div>

                                {/* Bottom Row: Visibility Toggle & Actions */}
                                <div className="mt-2 pt-2 border-t border-tertiary/20 flex items-center justify-between gap-1.5">
                                    {/* Visibility Toggle */}
                                    <label className="inline-flex items-center gap-1.5 cursor-pointer select-none" title={product.productVisible ? 'Visible to customers' : 'Hidden from customers'}>
                                        <div className="relative inline-flex items-center">
                                            <input
                                                type="checkbox"
                                                className="sr-only peer"
                                                checked={Boolean(product.productVisible)}
                                                disabled={updatingProductId === product.id}
                                                onChange={() => toggleVisibility(product)}
                                            />
                                            <div className="w-8 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-3 peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                        </div>
                                        <span className="text-[11px] font-semibold text-gray-600 hidden xs:inline sm:inline">
                                            {product.productVisible ? 'Visible' : 'Hidden'}
                                        </span>
                                    </label>

                                    {/* Actions */}
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => navigate(`/products/add?edit=${encodeURIComponent(product.id)}`)}
                                            className="p-1.5 bg-slate-50 hover:bg-slate-100 text-secondary rounded-md border border-tertiary/40 transition-colors"
                                            title="Edit Product"
                                        >
                                            <Edit size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleDeleteProduct(product.id)}
                                            disabled={deletingProductId === product.id}
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
            {/*Add Product type Modal*/}
            {productTypeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">

                        {/* Modal Header */}
                        <div className="flex items-center justify-between border-b border-tertiary/30 px-6 py-4">
                            <h2 className="text-lg font-bold text-gray-900">Manage Product Types</h2>
                            <button
                                type="button"
                                onClick={() => setProductTypeModal(false)}
                                aria-label="Close product type management"
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-slate-100 hover:text-gray-900 transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-6 py-6 space-y-5">
                            {/* Input Row */}
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-900">
                                    Product Type Name <span className="text-rose-500">*</span>
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newTypeName}
                                        onChange={(e) => setNewTypeName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAddProductType()}
                                        disabled={savingProductType}
                                        placeholder="e.g. Coffee Beans"
                                        className="flex-1 rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleAddProductType}
                                        disabled={savingProductType || !newTypeName.trim()}
                                        className="flex items-center gap-1.5 rounded-lg bg-primary/80 px-4 py-2.5 text-sm font-bold text-white hover:bg-primary transition active:scale-95"
                                    >
                                        <Plus size={16} /> {savingProductType ? 'Saving...' : 'Add'}
                                    </button>
                                </div>
                            </div>

                            {/* Product Types List */}
                            {productTypesLoading ? (
                                <p className="py-3 text-center text-sm text-gray-500">Loading product types...</p>
                            ) : productTypes.length > 0 ? (
                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Added Types</p>
                                    <ul className="space-y-2 max-h-52 overflow-y-auto pr-1">
                                        {productTypes.map((type) => (
                                            <li key={type.id} className="flex items-center justify-between gap-2 rounded-lg border border-tertiary/40 bg-slate-50 px-3 py-2">
                                                {editingTypeId === type.id ? (
                                                    <input
                                                        autoFocus
                                                        type="text"
                                                        value={editingTypeName}
                                                        onChange={(e) => setEditingTypeName(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleSaveEdit(type.id)}
                                                        disabled={savingProductType}
                                                        className="flex-1 rounded border border-primary/40 bg-white px-2 py-1 text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary/10"
                                                    />
                                                ) : (
                                                    <span className="flex-1 text-sm font-semibold text-gray-800">{type.productTypeName}</span>
                                                )}
                                                <div className="flex items-center gap-1">
                                                    {editingTypeId === type.id ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleSaveEdit(type.id)}
                                                            disabled={savingProductType || !editingTypeName.trim()}
                                                            className="p-1.5 rounded-md bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 transition"
                                                            title="Save"
                                                        >
                                                            <Check size={13} />
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleStartEdit(type)}
                                                            disabled={savingProductType || deletingProductTypeId === type.id}
                                                            className="p-1.5 rounded-md bg-slate-100 text-gray-600 hover:bg-slate-200 border border-tertiary/40 transition"
                                                            title="Edit"
                                                        >
                                                            <Edit size={13} />
                                                        </button>
                                                    )}
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteProductType(type)}
                                                        disabled={deletingProductTypeId === type.id || savingProductType}
                                                        className="p-1.5 rounded-md bg-rose-50 text-rose-500 hover:bg-rose-100 border border-rose-200/60 transition"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ) : (
                                <p className="py-3 text-center text-sm text-gray-500">No product types found.</p>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="flex items-center justify-end gap-3 border-t border-tertiary/30 bg-slate-50 px-6 py-4">
                            <button
                                type="button"
                                onClick={() => setProductTypeModal(false)}
                                className="rounded-lg px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-slate-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

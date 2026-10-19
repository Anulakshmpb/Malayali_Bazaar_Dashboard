import React, { useEffect, useMemo, useState } from 'react';
import {
    Download,
    RefreshCw,
    AlertCircle,
    PackageX,
    PackageCheck,
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app, db } from '../../Config/Firebase';
import { useToast } from '../../Shared/hooks/ToastContext';
import CommonTable from '../../Shared/Pages/CommonTable';

const functions = getFunctions(app, 'europe-west1');
const manageProductCallable = httpsCallable(functions, 'manageProduct');
const getStockStatus = (stock) => {
    const quantity = Number(stock) || 0;
    if (quantity <= 0) return 'Out of Stock';
    if (quantity <= 5) return 'Low Stock';
    return 'In Stock';
};

export default function StockManagement() {
    const { showToast } = useToast();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeFilter, setActiveFilter] = useState('All');
    const [updatingProductId, setUpdatingProductId] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'products'),
            (snapshot) => {
                const productList = snapshot.docs.map(document => ({
                    id: document.id,
                    ...document.data(),
                }));
                productList.sort((first, second) =>
                    String(first.productSKU || '').localeCompare(
                        String(second.productSKU || ''),
                        undefined,
                        { numeric: true, sensitivity: 'base' }
                    )
                );
                setProducts(productList);
                setLoading(false);
            },
            (error) => {
                console.error('Failed to load stock products:', error);
                setLoading(false);
                showToast('Unable to load products for stock management.', 'error');
            }
        );

        return unsubscribe;
    }, [refreshKey, showToast]);

    const handleUpdateStock = async (product, newStock) => {
        if (!Number.isInteger(newStock) || newStock < 0) {
            showToast('Enter a valid stock quantity of 0 or more.', 'error');
            return;
        }

        setUpdatingProductId(product.id);
        try {
            const response = await manageProductCallable({
                action: 'edit',
                productDocId: product.id,
                fields: { stock: newStock },
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || response.data?.error || 'Unable to update product stock.');
            }
            showToast(response.data.message || 'Product stock updated successfully.', 'success');
        } catch (error) {
            console.error('Failed to update product stock:', error);
            showToast(error.message || 'Unable to update product stock.', 'error');
        } finally {
            setUpdatingProductId(null);
        }
    };

    const filteredProducts = useMemo(() => {
        const selectedStatus = {
            'Low Stock': 'Low Stock',
            'Out of Stock': 'Out of Stock',
            'In Stock': 'In Stock',
        }[activeFilter];

        if (!selectedStatus) return products;
        return products.filter(product => getStockStatus(product.stock) === selectedStatus);
    }, [activeFilter, products]);

    const stats = [
        { 
            title: 'Low Stock Products', 
            value: products.filter(p => getStockStatus(p.stock) === 'Low Stock').length,
            icon: AlertCircle, 
            color: 'text-amber-500', 
            bg: 'bg-amber-50', 
            border: 'border-amber-200' 
        },
        { 
            title: 'Out of Stock', 
            value: products.filter(p => getStockStatus(p.stock) === 'Out of Stock').length,
            icon: PackageX, 
            color: 'text-rose-500', 
            bg: 'bg-rose-50', 
            border: 'border-rose-200' 
        },
        { 
            title: 'In Stock', 
            value: products.filter(p => getStockStatus(p.stock) === 'In Stock').length,
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
                        <button
                            type="button"
                            onClick={() => {
                                setLoading(true);
                                setRefreshKey(previous => previous + 1);
                            }}
                            className="flex items-center gap-2 rounded-lg bg-white border border-tertiary/60 px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-slate-50 focus:outline-none"
                        >
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
                    <div className="flex flex-wrap items-center gap-2">
                        {['All', 'Low Stock', 'Out of Stock', 'In Stock'].map(tab => (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveFilter(tab)}
                                aria-pressed={activeFilter === tab}
                                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${
                                    activeFilter === tab
                                        ? 'border border-tertiary/40 bg-white text-gray-900 shadow-sm'
                                        : 'text-secondary/70 hover:text-gray-900'
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <CommonTable
                    title="Inventory"
                    subtitle="Products sorted by SKU. Update stock quantities and monitor availability."
                    columns={[
                        {
                            key: "productName",
                            header: "Product",
                            sortable: true,
                            render: (product) => (
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-tertiary/40 bg-slate-100 shadow-sm">
                                        {product.thumbnail || product.images?.[0] ? (
                                            <img src={product.thumbnail || product.images[0]} alt={product.productName || 'Product'} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-secondary/50">No image</div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{product.productName || 'Unnamed product'}</p>
                                        <p className="mt-0.5 text-xs font-semibold text-secondary/70">SKU: <span className="text-gray-900">{product.productSKU || '—'}</span></p>
                                    </div>
                                </div>
                            ),
                        },
                        { key: "category", header: "Category", sortable: true },
                        {
                            key: "mrp",
                            header: "Price",
                            sortable: true,
                            render: (product) => `₹${Number(product.offerPrice || product.mrp || 0).toFixed(2)}`,
                        },
                        {
                            key: "stock",
                            header: "Current Stock",
                            sortable: true,
                            render: (product) => {
                                const status = getStockStatus(product.stock);
                                const isOutOfStock = status === 'Out of Stock';
                                const isLowStock = status === 'Low Stock';

                                return (
                                    <div className="flex items-center gap-2.5">
                                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold ${
                                            isOutOfStock ? "border-rose-200 bg-rose-50 text-rose-600" :
                                            isLowStock ? "border-amber-200 bg-amber-50 text-amber-600" :
                                            "border-emerald-200 bg-emerald-50 text-emerald-600"
                                        }`}>
                                            {status}
                                        </span>
                                        <span className="font-black text-gray-900">{Number(product.stock) || 0}</span>
                                    </div>
                                );
                            },
                        },
                    ]}
                    data={filteredProducts}
                    total={filteredProducts.length}
                    loading={loading}
                    clientSide
                    showRowNumbers={false}
                    rowKey="id"
                    searchPlaceholder="Search product, SKU, or category..."
                    actions={(product) => (
                        <div className="inline-flex items-center justify-end gap-2">
                            <input
                                type="number"
                                min="0"
                                step="1"
                                id={`stock-input-${product.id}`}
                                defaultValue={product.stock}
                                key={`input-${product.id}-${product.stock}`}
                                aria-label={`Set stock for ${product.productName || 'product'}`}
                                disabled={updatingProductId === product.id}
                                className="w-20 rounded-md border border-tertiary/60 bg-white px-2 py-1 text-center text-xs font-bold text-gray-900 outline-none transition focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-inner"
                            />
                            <button
                                type="button"
                                disabled={updatingProductId === product.id}
                                onClick={() => {
                                    const input = document.getElementById(`stock-input-${product.id}`);
                                    if (input && input.value !== "") {
                                        handleUpdateStock(product, Number(input.value));
                                    }
                                }}
                                className="rounded-md bg-gray-900 px-3 py-1 text-xs font-bold text-white shadow-sm transition hover:bg-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-900/40 disabled:cursor-wait disabled:opacity-50"
                            >
                                {updatingProductId === product.id ? 'Saving' : 'Set'}
                            </button>
                        </div>
                    )}
                />

            </div>
        </div>
    );
}

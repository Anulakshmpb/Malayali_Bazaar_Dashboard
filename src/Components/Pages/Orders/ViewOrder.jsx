import React, { useEffect, useState } from 'react';
import {
    User,
    Phone,
    Calendar,
    Clock,
    MapPin,
    ShoppingBag,
    FileText,
    ArrowLeft,
    Mail,
    Truck,
    PackageCheck
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../Config/Firebase';

const getOrderDateObj = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value?.toDate === 'function') return value.toDate();
    if (value?.seconds != null) return new Date(value.seconds * 1000);
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
};

const formatOrderDateTime = (value) => {
    const date = getOrderDateObj(value);
    if (!date) return { date: '—', time: '—' };
    return {
        date: date.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }),
        time: date.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
        }),
    };
};

export default function ViewOrder() {
    const [activeTab, setActiveTab] = useState('Details');
    const location = useLocation();
    const navigate = useNavigate();

    const [order, setOrder] = useState(location.state?.order || null);
    const [loading, setLoading] = useState(!location.state?.order && !!location.state?.orderId);

    const orderId = location.state?.orderId || order?.id || order?.orderDocId;

    useEffect(() => {
        if (!order && orderId) {
            setLoading(true);
            getDoc(doc(db, 'orders', orderId))
                .then((docSnap) => {
                    if (docSnap.exists()) {
                        setOrder({ id: docSnap.id, orderDocId: docSnap.id, ...docSnap.data() });
                    }
                })
                .catch((err) => {
                    console.error('Failed to fetch order:', err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [order, orderId]);

    const formattedDateTime = formatOrderDateTime(order?.orderDate || order?.createdAt);

    const orderNo = order?.orderId || order?.orderDocId || order?.id || '—';
    const customerName = order?.customerName || order?.deliveryAddress?.fullName || '—';
    const customerPhone = order?.customerPhone || order?.deliveryAddress?.phone || '—';
    const customerEmail = order?.customerEmail || '—';
    const status = order?.status || 'Pending';
    const deliveryType = order?.deliveryType || 'Standard Delivery';
    const notes = order?.notes || '';

    const addressParts = order?.deliveryAddress ? [
        order.deliveryAddress.addressLine,
        order.deliveryAddress.postalCode,
        order.deliveryAddress.city,
        order.deliveryAddress.state,
        order.deliveryAddress.country,
    ].filter(Boolean) : [];
    const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : '—';

    const items = Array.isArray(order?.items) ? order.items : [];
    const subtotal = Number(order?.subtotal ?? order?.grossSubtotal ?? 0);
    const tax = Number(order?.tax ?? order?.taxCollected ?? 0);
    const deliveryCharge = Number(order?.deliveryCharge ?? order?.shipping ?? 0);
    const discount = Number(order?.discount ?? 0);
    const totalAmount = Number(order?.totalAmount ?? order?.total ?? (subtotal + deliveryCharge - discount));

    return (
        <div className="min-h-screen bg-white pb-12 page-container">
            <div className="max-w-5xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 bg-white border border-tertiary/60 rounded-xl text-secondary hover:bg-slate-50 hover:text-gray-900 transition-colors shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Order #{orderNo}
                        </h1>

                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500 bg-white rounded-2xl border border-tertiary/40">
                        <p className="animate-pulse">Loading order details...</p>
                    </div>
                ) : (
                    /* Main Content Area */
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 overflow-hidden">

                        {/* Tabs */}
                        <div className="flex border-b border-tertiary/40 bg-slate-50/50">
                            <button
                                onClick={() => setActiveTab('Details')}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative ${activeTab === 'Details'
                                    ? 'text-primary bg-white'
                                    : 'text-secondary/70 hover:text-gray-900 hover:bg-slate-50'
                                    }`}
                            >
                                <FileText size={18} />
                                Order Details
                                {activeTab === 'Details' && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                                )}
                            </button>
                            <button
                                onClick={() => setActiveTab('Products')}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative ${activeTab === 'Products'
                                    ? 'text-primary bg-white'
                                    : 'text-secondary/70 hover:text-gray-900 hover:bg-slate-50'
                                    }`}
                            >
                                <ShoppingBag size={18} />
                                Product List ({items.length})
                                {activeTab === 'Products' && (
                                    <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></span>
                                )}
                            </button>
                        </div>

                        {/* Tab Content */}
                        <div className="p-6 sm:p-8">

                            {/* Details Tab */}
                            {activeTab === 'Details' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-[fadeIn_0.3s_ease-out]">

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 border-b border-tertiary/30 pb-2">Customer Information</h3>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <User size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Customer Name</p>
                                                    <p className="text-base font-bold text-gray-900 mt-0.5">{customerName}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                    <Phone size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Customer Mobile</p>
                                                    <p className="text-base font-bold text-gray-900 mt-0.5">{customerPhone}</p>
                                                </div>
                                            </div>

                                            {customerEmail !== '—' && (
                                                <div className="flex items-start gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                        <Mail size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Customer Email</p>
                                                        <p className="text-base font-bold text-gray-900 mt-0.5">{customerEmail}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {notes && (
                                                <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-800">
                                                    <span className="font-bold">Customer Notes: </span>
                                                    {notes}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <h3 className="text-lg font-bold text-gray-900 border-b border-tertiary/30 pb-2">Order Information</h3>

                                        <div className="space-y-4">
                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Order Date</p>
                                                    <p className="text-base font-bold text-gray-900 mt-0.5">{formattedDateTime.date}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Time</p>
                                                    <p className="text-base font-bold text-gray-900 mt-0.5">{formattedDateTime.time}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                                    <MapPin size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Delivery Address</p>
                                                    <p className="text-base font-bold text-gray-900 mt-0.5 leading-relaxed">{formattedAddress}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-600 shrink-0">
                                                    <Truck size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Delivery Type</p>
                                                    <p className="text-base font-bold text-gray-900 mt-0.5 capitalize">{deliveryType}</p>
                                                </div>
                                            </div>

                                            <div className="flex items-start gap-4">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
                                                    <PackageCheck size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Status</p>
                                                    <p className="text-base font-bold text-gray-900 mt-0.5">{status}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Products Tab */}
                            {activeTab === 'Products' && (
                                <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col gap-8">

                                    {/* Table Container with scroll */}
                                    <div className="border border-tertiary/40 rounded-xl overflow-hidden shadow-sm">
                                        <div className="max-h-[350px] overflow-y-auto">
                                            <table className="min-w-full divide-y divide-tertiary/40">
                                                <thead className="bg-slate-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Product</th>
                                                        <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">SKU</th>
                                                        <th className="px-6 py-4 text-center text-xs font-bold text-secondary uppercase tracking-wider">Qty</th>
                                                        <th className="px-6 py-4 text-right text-xs font-bold text-secondary uppercase tracking-wider">Unit Price</th>
                                                        <th className="px-6 py-4 text-right text-xs font-bold text-secondary uppercase tracking-wider">Total</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-tertiary/20">
                                                    {items.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-sm">
                                                                No products found in this order.
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        items.map((product, idx) => (
                                                            <tr key={product.productId || product.sku || idx} className="hover:bg-slate-50/50 transition-colors">
                                                                <td className="px-6 py-4 text-sm font-semibold text-gray-900 flex items-center gap-3">
                                                                    {product.thumbnail ? (
                                                                        <img
                                                                            src={product.thumbnail}
                                                                            alt={product.productName || 'product'}
                                                                            className="w-10 h-10 object-cover rounded-lg border border-gray-200 shrink-0"
                                                                        />
                                                                    ) : (
                                                                        <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-secondary shrink-0">
                                                                            <ShoppingBag size={18} />
                                                                        </div>
                                                                    )}
                                                                    <div>
                                                                        <p className="font-semibold text-gray-900">{product.productName || 'Unnamed product'}</p>
                                                                        {product.unit && (
                                                                            <span className="text-xs text-gray-500 font-normal">{product.unit}</span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 text-xs font-mono text-gray-600">
                                                                    {product.sku || '—'}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-medium text-secondary/80 text-center">
                                                                    {product.quantity || 1}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-medium text-secondary/80 text-right">
                                                                    €{Number(product.price || 0).toFixed(2)}
                                                                </td>
                                                                <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">
                                                                    €{Number(product.total || (product.price * (product.quantity || 1)) || 0).toFixed(2)}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Amount Details */}
                                    <div className="bg-slate-50 rounded-xl p-6 border border-tertiary/30 ml-auto w-full md:w-[400px]">
                                        <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-tertiary/30 pb-3">Payment Summary</h3>

                                        <div className="space-y-3 mb-6">
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-secondary/80">Subtotal</span>
                                                <span className="font-bold text-gray-900">€{subtotal.toFixed(2)}</span>
                                            </div>
                                            {tax > 0 && (
                                                <div className="flex justify-between text-sm">
                                                    <span className="font-medium text-secondary/80">Tax</span>
                                                    <span className="font-bold text-gray-900">€{tax.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-sm">
                                                <span className="font-medium text-secondary/80">Delivery / Shipping</span>
                                                <span className="font-bold text-gray-900">€{deliveryCharge.toFixed(2)}</span>
                                            </div>
                                            {discount > 0 && (
                                                <div className="flex justify-between text-sm text-emerald-600">
                                                    <span className="font-medium">Discount</span>
                                                    <span className="font-bold">-€{discount.toFixed(2)}</span>
                                                </div>
                                            )}
                                            <div className="pt-3 mt-3 border-t border-tertiary/30 flex justify-between">
                                                <span className="font-bold text-base text-gray-900">Total Amount</span>
                                                <span className="font-bold text-xl text-primary">€{totalAmount.toFixed(2)}</span>
                                            </div>
                                        </div>

                                        <div className="p-3 bg-white rounded-xl border border-tertiary/30 space-y-1 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Payment Method:</span>
                                                <span className="font-bold text-gray-800">{order?.paymentMethod || 'Cash on Delivery'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Payment Status:</span>
                                                <span className="font-bold text-gray-800">{order?.paymentStatus || 'Pending'}</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

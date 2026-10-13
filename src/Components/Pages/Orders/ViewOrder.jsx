import React, { useState } from 'react';
import { 
    User, 
    Phone, 
    Calendar, 
    Clock, 
    MapPin, 
    CreditCard, 
    ShoppingBag, 
    FileText,
    ArrowLeft
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ViewOrder() {
    const [activeTab, setActiveTab] = useState('Details');
    const navigate = useNavigate();

    const orderDetails = {
        orderNo: 'ORD-7829',
        customerName: 'aravind',
        mobile: '8086886095',
        date: '08/10/2026',
        time: '11:55 PM',
        address: '123 Main Street, Apt 4B, Springfield, IL 62701, USA',
        status: 'Pending'
    };

    const products = [
        { id: 1, name: 'Premium Coffee Beans', quantity: 2, price: 24.00, total: 48.00 },
        { id: 2, name: 'Ceramic Mug Set', quantity: 1, price: 35.00, total: 35.00 },
        { id: 3, name: 'Barista Apron', quantity: 1, price: 45.00, total: 45.00 },
        { id: 4, name: 'Espresso Machine', quantity: 1, price: 299.00, total: 299.00 },
        { id: 5, name: 'Vanilla Syrup', quantity: 3, price: 12.00, total: 36.00 },
        { id: 6, name: 'Filter Papers', quantity: 5, price: 5.00, total: 25.00 },
        { id: 7, name: 'Matcha Powder', quantity: 1, price: 18.00, total: 18.00 },
        { id: 8, name: 'Paper Cups (12oz)', quantity: 2, price: 8.00, total: 16.00 },
    ];

    const amountDetails = {
        subtotal: 522.00,
        tax: 26.10,
        shipping: 15.00,
        total: 563.10
    };

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
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-primary to-secondary text-transparent bg-clip-text">
                            Order #{orderDetails.orderNo}
                        </h1>
                        <p className="text-secondary/80 mt-1 text-sm font-medium">
                            View detailed information about this order
                        </p>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 overflow-hidden">
                    
                    {/* Tabs */}
                    <div className="flex border-b border-tertiary/40 bg-slate-50/50">
                        <button 
                            onClick={() => setActiveTab('Details')}
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative ${
                                activeTab === 'Details' 
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
                            className={`flex items-center gap-2 px-6 py-4 text-sm font-semibold transition-all relative ${
                                activeTab === 'Products' 
                                ? 'text-primary bg-white' 
                                : 'text-secondary/70 hover:text-gray-900 hover:bg-slate-50'
                            }`}
                        >
                            <ShoppingBag size={18} />
                            Product List
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
                                                <p className="text-base font-bold text-gray-900 mt-0.5">{orderDetails.customerName}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                                <Phone size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Customer Mobile</p>
                                                <p className="text-base font-bold text-gray-900 mt-0.5">{orderDetails.mobile}</p>
                                            </div>
                                        </div>
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
                                                <p className="text-base font-bold text-gray-900 mt-0.5">{orderDetails.date}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
                                                <Clock size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Time</p>
                                                <p className="text-base font-bold text-gray-900 mt-0.5">{orderDetails.time}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
                                                <MapPin size={20} />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold text-secondary/70 uppercase tracking-wider">Delivery Address</p>
                                                <p className="text-base font-bold text-gray-900 mt-0.5 leading-relaxed">{orderDetails.address}</p>
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
                                                    <th className="px-6 py-4 text-left text-xs font-bold text-secondary uppercase tracking-wider">Product Name</th>
                                                    <th className="px-6 py-4 text-center text-xs font-bold text-secondary uppercase tracking-wider">Quantity</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-secondary uppercase tracking-wider">Unit Price</th>
                                                    <th className="px-6 py-4 text-right text-xs font-bold text-secondary uppercase tracking-wider">Total</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-tertiary/20">
                                                {products.map((product) => (
                                                    <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-sm font-semibold text-gray-900">{product.name}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-secondary/80 text-center">{product.quantity}</td>
                                                        <td className="px-6 py-4 text-sm font-medium text-secondary/80 text-right">${product.price.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-sm font-bold text-gray-900 text-right">${product.total.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Amount Details & Pay Now */}
                                <div className="bg-slate-50 rounded-xl p-6 border border-tertiary/30 ml-auto w-full md:w-[400px]">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b border-tertiary/30 pb-3">Payment Summary</h3>
                                    
                                    <div className="space-y-3 mb-6">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-secondary/80">Subtotal</span>
                                            <span className="font-bold text-gray-900">${amountDetails.subtotal.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-secondary/80">Tax (5%)</span>
                                            <span className="font-bold text-gray-900">${amountDetails.tax.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium text-secondary/80">Shipping</span>
                                            <span className="font-bold text-gray-900">${amountDetails.shipping.toFixed(2)}</span>
                                        </div>
                                        <div className="pt-3 mt-3 border-t border-tertiary/30 flex justify-between">
                                            <span className="font-bold text-base text-gray-900">Total Amount</span>
                                            <span className="font-bold text-xl text-primary">${amountDetails.total.toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <button className="w-full py-3.5 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-secondary transition-all hover:-translate-y-0.5 shadow-md hover:shadow-lg focus:ring-4 focus:ring-primary/20">
                                        <CreditCard size={20} />
                                        Pay Now
                                    </button>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

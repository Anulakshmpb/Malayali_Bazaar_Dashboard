import React, { useState } from 'react';
// import { db } from '../../shared/services/firebase';
// import { setDoc, doc, getDoc } from 'firebase/firestore';
// import { useToast } from '../../shared/hooks/ToastContext';
import { Truck, Plus, Trash2, Save, Mail, Globe, AlignLeft, Layers, Sparkles } from 'lucide-react';

const ShippingPolicy = () => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        introduction: '',
        dataPointsHeading: '',
        dataPoints: [{ title: '', descriptions: [''] }],
        sections: [
            {
                title: '',
                description: '',
            },
        ],
        footerDescription: '',
        email: '',
        website: '',
    });

    // const fetchPolicy = async () => { ... };
    // useEffect(() => { fetchPolicy(); }, []);

    // --- Data Point helpers ---
    const addDataPoint = () => {
        setFormData({ ...formData, dataPoints: [...formData.dataPoints, { title: '', descriptions: [''] }] });
    };

    const updateDataPoint = (index, field, value) => {
        const updated = [...formData.dataPoints];
        updated[index] = { ...updated[index], [field]: value };
        setFormData({ ...formData, dataPoints: updated });
    };

    const addDescription = (dpIndex) => {
        const updated = [...formData.dataPoints];
        updated[dpIndex] = { ...updated[dpIndex], descriptions: [...(updated[dpIndex].descriptions || ['']), ''] };
        setFormData({ ...formData, dataPoints: updated });
    };

    const updateDescription = (dpIndex, descIndex, value) => {
        const updated = [...formData.dataPoints];
        const descs = [...(updated[dpIndex].descriptions || [''])];
        descs[descIndex] = value;
        updated[dpIndex] = { ...updated[dpIndex], descriptions: descs };
        setFormData({ ...formData, dataPoints: updated });
    };

    const removeDescription = (dpIndex, descIndex) => {
        const updated = [...formData.dataPoints];
        const descs = (updated[dpIndex].descriptions || ['']).filter((_, i) => i !== descIndex);
        updated[dpIndex] = { ...updated[dpIndex], descriptions: descs.length > 0 ? descs : [''] };
        setFormData({ ...formData, dataPoints: updated });
    };

    const removeDataPoint = (index) => {
        setFormData({
            ...formData,
            dataPoints: formData.dataPoints.filter((_, i) => i !== index),
        });
    };

    // --- Section helpers ---
    const addSection = () => {
        setFormData({
            ...formData,
            sections: [...formData.sections, { title: '', description: '' }],
        });
    };

    const updateSection = (index, field, value) => {
        const updated = [...formData.sections];
        updated[index][field] = value;
        setFormData({ ...formData, sections: updated });
    };

    const removeSection = (index) => {
        setFormData({
            ...formData,
            sections: formData.sections.filter((_, i) => i !== index),
        });
    };

    // --- Save ---
    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        // Firebase save logic here
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-white">
                <div className="relative">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        <Truck className="w-6 h-6 text-primary" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-12 page-container">
            <div className="max-w-4xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Shipping Policy
                        </h1>
                        <p className="text-secondary/80 mt-1 text-sm font-medium">
                            Manage your shipping policy content
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-5">

                    {/* Introduction */}
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6">
                        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                                <AlignLeft className="w-4 h-4 text-primary" />
                            </span>
                            Introduction
                        </h2>
                        <textarea
                            rows="4"
                            value={formData.introduction}
                            onChange={(e) => setFormData({ ...formData, introduction: e.target.value })}
                            className="w-full border border-tertiary/60 rounded-xl p-3 text-sm bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900"
                            placeholder="Introduction paragraph..."
                        />
                    </div>

                    {/* Policy Sections */}
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                                    <Layers className="w-4 h-4 text-violet-600" />
                                </span>
                                Policy Sections
                            </h2>
                            <button
                                type="button"
                                onClick={addSection}
                                className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-sm font-bold text-primary hover:bg-primary/20 transition-colors focus:outline-none"
                            >
                                <Plus className="w-4 h-4" /> Add Section
                            </button>
                        </div>
                        <div className="space-y-4">
                            {formData.sections.map((section, index) => (
                                <div key={index} className="bg-slate-50/70 border border-tertiary/40 rounded-xl p-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <span className="text-xs font-bold text-secondary/70 uppercase tracking-wider">Section {index + 1}</span>
                                        {formData.sections.length > 1 && (
                                            <button
                                                type="button"
                                                onClick={() => removeSection(index)}
                                                className="flex items-center gap-1 text-rose-500 text-xs font-semibold hover:text-rose-700 transition-colors"
                                            >
                                                <Trash2 className="w-3 h-3" /> Remove
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        type="text"
                                        value={section.title}
                                        onChange={(e) => updateSection(index, 'title', e.target.value)}
                                        className="w-full border border-tertiary/60 rounded-lg p-3 text-sm mb-3 bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900"
                                        placeholder="Section Heading"
                                    />
                                    <textarea
                                        rows="3"
                                        value={section.description}
                                        onChange={(e) => updateSection(index, 'description', e.target.value)}
                                        className="w-full border border-tertiary/60 rounded-lg p-3 text-sm bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900"
                                        placeholder="Section description..."
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6">
                        <h2 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
                                <Sparkles className="w-4 h-4 text-amber-600" />
                            </span>
                            Company Info
                        </h2>
                        <div className="space-y-4">
                            <textarea
                                rows="2"
                                value={formData.footerDescription}
                                onChange={(e) => setFormData({ ...formData, footerDescription: e.target.value })}
                                className="w-full border border-tertiary/60 rounded-xl p-3 text-sm bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900"
                                placeholder="Footer Description"
                            />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50" />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        className="w-full pl-10 pr-3 py-3 border border-tertiary/60 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900"
                                        placeholder="shipping@company.com"
                                    />
                                </div>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50" />
                                    <input
                                        type="text"
                                        value={formData.website}
                                        onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full pl-10 pr-3 py-3 border border-tertiary/60 rounded-xl text-sm bg-slate-50 focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-white outline-none transition-colors placeholder:text-secondary/50 font-medium text-gray-900"
                                        placeholder="www.company.com"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-secondary transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {saving ? (
                                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                            ) : (
                                <><Save className="w-4 h-4" /> Save Changes</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ShippingPolicy;
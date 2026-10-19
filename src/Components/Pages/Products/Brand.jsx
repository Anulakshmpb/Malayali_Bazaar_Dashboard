import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Upload, Search, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { app, storage } from '../../Config/Firebase';
import { useToast } from '../../Shared/hooks/ToastContext';

export default function Brand() {
    const { showToast } = useToast();
    const functions = useMemo(() => getFunctions(app, 'europe-west1'), []);
    const manageBrand = useMemo(() => httpsCallable(functions, 'manageBrand'), [functions]);
    const [brands, setBrands] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState(null);
    const [brandName, setBrandName] = useState('');
    const [brandImage, setBrandImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadBrands = async () => {
        setLoading(true);
        try {
            const response = await manageBrand({ action: 'list' });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to load brands.');
            }
            setBrands(response.data.data || []);
        } catch (error) {
            console.error('Failed to load brands:', error);
            showToast(error.message || 'Unable to load brands.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBrands();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingBrand(null);
        setBrandName('');
        setBrandImage(null);
    };

    const openAddModal = () => {
        setEditingBrand(null);
        setBrandName('');
        setBrandImage(null);
        setIsModalOpen(true);
    };

    const openEditModal = (brand) => {
        setEditingBrand(brand);
        setBrandName(brand.brandName || '');
        setBrandImage(null);
        setIsModalOpen(true);
    };

    const handleSaveBrand = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            let image = editingBrand?.image || '';
            if (brandImage) {
                const imageRef = ref(storage, `brands/${crypto.randomUUID()}-${brandImage.name}`);
                await uploadBytes(imageRef, brandImage);
                image = await getDownloadURL(imageRef);
            }

            const response = await manageBrand({
                action: editingBrand ? 'update' : 'add',
                fields: {
                    ...(editingBrand ? { brandId: editingBrand.id } : {}),
                    brandName: brandName.trim(),
                    image,
                },
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to save brand.');
            }
            showToast(response.data.message || 'Brand saved successfully.', 'success');
            closeModal();
            await loadBrands();
        } catch (error) {
            console.error('Failed to save brand:', error);
            showToast(error.message || 'Unable to save brand.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteBrand = async (brand) => {
        if (!window.confirm(`Are you sure you want to delete ${brand.brandName}?`)) return;
        try {
            const response = await manageBrand({
                action: 'delete',
                fields: { brandId: brand.id },
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to delete brand.');
            }
            showToast(response.data.message || 'Brand deleted successfully.', 'success');
            await loadBrands();
        } catch (error) {
            console.error('Failed to delete brand:', error);
            showToast(error.message || 'Unable to delete brand.', 'error');
        }
    };

    const filteredBrands = brands.filter(brand =>
        (brand.brandName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white pb-10 page-container">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                        Brand Management
                    </h1>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" className="flex items-center gap-2 rounded-xl bg-white border border-tertiary/60 px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm transition hover:bg-slate-50">
                            <Upload size={16} /> Bulk Upload
                        </button>
                        <button type="button" onClick={openAddModal} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-secondary">
                            <Plus size={18} /> Add Brand
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-tertiary/40 bg-white p-4 shadow-sm">
                    <div className="relative w-full sm:max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" />
                        <input type="text" placeholder="Search brands..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="w-full rounded-lg border border-tertiary/60 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">Total: {filteredBrands.length} Brands</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {loading ? (
                        <p className="col-span-full py-8 text-center text-sm text-gray-500">Loading brands...</p>
                    ) : filteredBrands.length === 0 ? (
                        <p className="col-span-full py-8 text-center text-sm text-gray-500">No brands found.</p>
                    ) : filteredBrands.map(brand => (
                        <div key={brand.id} className="group relative overflow-hidden rounded-2xl border border-tertiary/40 bg-white shadow-sm transition-all hover:shadow-lg flex flex-col">
                            <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                                {brand.image ? (
                                    <img src={brand.image} alt={brand.brandName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-secondary/50"><ImageIcon size={32} /></div>
                                )}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button type="button" onClick={() => openEditModal(brand)} aria-label={`Edit ${brand.brandName}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-900 shadow-lg hover:text-primary">
                                        <Edit size={16} />
                                    </button>
                                    <button type="button" onClick={() => handleDeleteBrand(brand)} aria-label={`Delete ${brand.brandName}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rose-500 shadow-lg hover:bg-rose-50">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col p-5 flex-1">
                                <h3 className="text-lg font-bold text-gray-900">{brand.brandName}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <form onSubmit={handleSaveBrand} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-tertiary/30 px-6 py-4">
                            <h2 className="text-lg font-bold text-gray-900">{editingBrand ? 'Edit Brand' : 'Add New Brand'}</h2>
                            <button type="button" onClick={closeModal} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-slate-100"><X size={20} /></button>
                        </div>
                        <div className="px-6 py-6 space-y-5">
                            <div>
                                <label htmlFor="brandName" className="mb-1.5 block text-sm font-semibold text-gray-900">Brand Name <span className="text-rose-500">*</span></label>
                                <input id="brandName" type="text" placeholder="e.g. Nestlé" value={brandName} onChange={event => setBrandName(event.target.value)} required maxLength={150} className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-primary focus:bg-white" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-900">Brand Image</label>
                                {editingBrand?.image && !brandImage && <img src={editingBrand.image} alt="Current brand" className="mb-3 h-24 w-full rounded-lg object-cover" />}
                                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-tertiary/60 bg-slate-50/70 p-4 text-center hover:border-primary/60">
                                    <ImageIcon size={20} className="mb-2 text-secondary" />
                                    <p className="text-sm font-bold text-gray-900">{brandImage?.name || 'Click to upload image'}</p>
                                    <p className="mt-1 text-xs text-secondary/70">JPG, PNG or WEBP (Max 2MB)</p>
                                    <input type="file" className="sr-only" accept="image/*" onChange={event => setBrandImage(event.target.files?.[0] || null)} />
                                </label>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-tertiary/30 bg-slate-50 px-6 py-4">
                            <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-slate-200">Cancel</button>
                            <button type="submit" disabled={saving} className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary disabled:opacity-60">
                                {saving ? 'Saving...' : editingBrand ? 'Save Changes' : 'Save Brand'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

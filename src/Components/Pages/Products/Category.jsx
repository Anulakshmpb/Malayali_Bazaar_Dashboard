import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Upload, Search, Edit, Trash2, X, Image as ImageIcon } from 'lucide-react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { app, storage } from '../../Config/Firebase';
import { useToast } from '../../Shared/hooks/ToastContext';

export default function Category() {
    const { showToast } = useToast();
    const functions = useMemo(() => getFunctions(app, 'europe-west1'), []);
    const manageCategory = useMemo(() => httpsCallable(functions, 'manageCategory'), [functions]);
    const [categories, setCategories] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryImage, setCategoryImage] = useState(null);
    const [subCategoryInputs, setSubCategoryInputs] = useState([{ id: '', subCategoryName: '' }]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const response = await manageCategory({ action: 'list' });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to load categories.');
            }
            setCategories(response.data.data || []);
        } catch (error) {
            console.error('Failed to load categories:', error);
            showToast(error.message || 'Unable to load categories.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCategories();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const openAddModal = () => {
        setEditingCategory(null);
        setCategoryName('');
        setCategoryImage(null);
        setSubCategoryInputs([{ id: '', subCategoryName: '' }]);
        setIsModalOpen(true);
    };

    const openEditModal = (category) => {
        setEditingCategory(category);
        setCategoryName(category.categoryName || '');
        setCategoryImage(null);
        setSubCategoryInputs(category.subCategory?.length
            ? category.subCategory.map(item => ({ id: item.id || '', subCategoryName: item.subCategoryName || '' }))
            : [{ id: '', subCategoryName: '' }]);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingCategory(null);
        setCategoryName('');
        setCategoryImage(null);
        setSubCategoryInputs([{ id: '', subCategoryName: '' }]);
    };

    const addSubCategoryInput = () => {
        setSubCategoryInputs(previous => [...previous, { id: '', subCategoryName: '' }]);
    };

    const updateSubCategoryInput = (index, value) => {
        setSubCategoryInputs(previous => previous.map((item, itemIndex) => (
            itemIndex === index ? { ...item, subCategoryName: value } : item
        )));
    };

    const removeSubCategoryInput = (index) => {
        setSubCategoryInputs(previous => previous.filter((_, itemIndex) => itemIndex !== index));
    };

    const handleSaveCategory = async (event) => {
        event.preventDefault();
        const subCategory = subCategoryInputs
            .filter(item => item.subCategoryName.trim())
            .map(item => ({
                ...(item.id ? { id: item.id } : {}),
                subCategoryName: item.subCategoryName.trim(),
            }));

        if (subCategory.length === 0) {
            showToast('Add at least one subcategory.', 'error');
            return;
        }

        setSaving(true);
        try {
            let image = editingCategory?.image || '';
            if (categoryImage) {
                const imageRef = ref(storage, `categories/${crypto.randomUUID()}-${categoryImage.name}`);
                await uploadBytes(imageRef, categoryImage);
                image = await getDownloadURL(imageRef);
            }

            const response = await manageCategory({
                action: editingCategory ? 'update' : 'add',
                fields: {
                    ...(editingCategory ? { categoryId: editingCategory.id } : {}),
                    categoryName: categoryName.trim(),
                    image,
                    subCategory,
                },
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to save category.');
            }
            showToast(response.data.message || 'Category saved successfully.', 'success');
            closeModal();
            await loadCategories();
        } catch (error) {
            console.error('Failed to save category:', error);
            showToast(error.message || 'Unable to save category.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (category) => {
        if (!window.confirm(`Are you sure you want to delete ${category.categoryName}?`)) return;
        try {
            const response = await manageCategory({
                action: 'delete',
                fields: { categoryId: category.id },
            });
            if (!response.data?.success) {
                throw new Error(response.data?.message || 'Unable to delete category.');
            }
            showToast(response.data.message || 'Category deleted successfully.', 'success');
            await loadCategories();
        } catch (error) {
            console.error('Failed to delete category:', error);
            showToast(error.message || 'Unable to delete category.', 'error');
        }
    };

    const filteredCategories = categories.filter(category =>
        (category.categoryName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-white pb-10 page-container">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                        Category Management
                    </h1>
                    <div className="flex flex-wrap gap-3">
                        <button type="button" className="flex items-center gap-2 rounded-xl bg-white border border-tertiary/60 px-4 py-2.5 text-sm font-bold text-gray-900 shadow-sm hover:bg-slate-50">
                            <Upload size={16} /> Bulk Upload
                        </button>
                        <button type="button" onClick={openAddModal} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-secondary">
                            <Plus size={18} /> Add Category
                        </button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-tertiary/40 bg-white p-4 shadow-sm">
                    <div className="relative w-full sm:max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" />
                        <input type="text" placeholder="Search categories..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="w-full rounded-lg border border-tertiary/60 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" />
                    </div>
                    <div className="text-sm font-bold text-gray-900">Total: {filteredCategories.length} Categories</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                    {loading ? (
                        <p className="col-span-full py-8 text-center text-sm text-gray-500">Loading categories...</p>
                    ) : filteredCategories.length === 0 ? (
                        <p className="col-span-full py-8 text-center text-sm text-gray-500">No categories found.</p>
                    ) : filteredCategories.map(category => (
                        <div key={category.id} className="group relative overflow-hidden rounded-2xl border border-tertiary/40 bg-white shadow-sm hover:shadow-lg flex flex-col">
                            <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                                {category.image ? (
                                    <img src={category.image} alt={category.categoryName} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-secondary/50"><ImageIcon size={32} /></div>
                                )}
                                <div className="absolute inset-0 bg-black/15 opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                    <button type="button" onClick={() => openEditModal(category)} aria-label={`Edit ${category.categoryName}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-gray-900 shadow-lg hover:text-primary">
                                        <Edit size={16} />
                                    </button>
                                    <button type="button" onClick={() => handleDeleteCategory(category)} aria-label={`Delete ${category.categoryName}`} className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-rose-500 shadow-lg hover:bg-rose-50">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col p-5 flex-1">
                                <h3 className="text-lg font-bold text-gray-900">{category.categoryName}</h3>
                                {category.subCategory?.length > 0 && (
                                    <div className="mt-4 border-t border-tertiary/20 pt-4">
                                        <p className="text-xs font-bold text-secondary/70 mb-2">Sub Categories ({category.subCategory.length})</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {category.subCategory.slice(0, 3).map(item => (
                                                <span key={item.id || item.subCategoryName} className="inline-flex items-center rounded-md border border-tertiary/60 bg-slate-50 px-2 py-0.5 text-xs font-medium text-gray-900">
                                                    {item.subCategoryName}
                                                </span>
                                            ))}
                                            {category.subCategory.length > 3 && (
                                                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold" title={category.subCategory.slice(3).map(item => item.subCategoryName).join(', ')}>
                                                    +{category.subCategory.length - 3} more
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
                    <form onSubmit={handleSaveCategory} className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-tertiary/30 px-6 py-4">
                            <h2 className="text-lg font-bold text-gray-900">{editingCategory ? 'Edit Category' : 'Add New Category'}</h2>
                            <button type="button" onClick={closeModal} aria-label="Close" className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary hover:bg-slate-100"><X size={20} /></button>
                        </div>
                        <div className="px-6 py-6 space-y-5">
                            <div>
                                <label htmlFor="categoryName" className="mb-1.5 block text-sm font-semibold text-gray-900">Category Name <span className="text-rose-500">*</span></label>
                                <input id="categoryName" type="text" value={categoryName} onChange={event => setCategoryName(event.target.value)} required maxLength={150} placeholder="e.g. Coffee Beans" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-primary focus:bg-white" />
                            </div>
                            <div>
                                <label className="mb-1.5 block text-sm font-semibold text-gray-900">Category Image</label>
                                {editingCategory?.image && !categoryImage && <img src={editingCategory.image} alt="Current category" className="mb-3 h-24 w-full rounded-lg object-cover" />}
                                <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-tertiary/60 bg-slate-50/70 p-4 text-center hover:border-primary/60">
                                    <ImageIcon size={20} className="mb-2 text-secondary" />
                                    <p className="text-sm font-bold text-gray-900">{categoryImage?.name || 'Click to upload image'}</p>
                                    <p className="mt-1 text-xs text-secondary/70">JPG, PNG or WEBP (Max 2MB)</p>
                                    <input type="file" className="sr-only" accept="image/*" onChange={event => setCategoryImage(event.target.files?.[0] || null)} />
                                </label>
                            </div>
                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <label className="block text-sm font-semibold text-gray-900">Sub Categories <span className="text-rose-500">*</span></label>
                                    <button type="button" onClick={addSubCategoryInput} className="flex items-center gap-1 text-xs font-semibold text-gray-900 hover:underline"><Plus size={14} /> Add Sub Category</button>
                                </div>
                                <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                                    {subCategoryInputs.map((item, index) => (
                                        <div key={item.id || index} className="flex items-center gap-2">
                                            <input type="text" value={item.subCategoryName} onChange={event => updateSubCategoryInput(index, event.target.value)} placeholder="e.g. Coffee Beans" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none focus:border-primary focus:bg-white" />
                                            <button type="button" onClick={() => removeSubCategoryInput(index)} disabled={subCategoryInputs.length === 1} className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30" title="Remove sub category"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center justify-end gap-3 border-t border-tertiary/30 bg-slate-50 px-6 py-4">
                            <button type="button" onClick={closeModal} className="rounded-lg px-4 py-2.5 text-sm font-bold text-gray-900 hover:bg-slate-200">Cancel</button>
                            <button type="submit" disabled={saving} className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-primary disabled:opacity-60">
                                {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Save Category'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}

import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { app, db, storage } from '../../Config/Firebase';
import { useToast } from '../../Shared/hooks/ToastContext';
import {
    X,
    Info,
    ImagePlus,
    Boxes,
    DollarSign,
    ChevronDown,
    Plus,
    Upload,
    Trash2,
} from 'lucide-react';

const functions = getFunctions(app, 'europe-west1');
const manageProductCallable = httpsCallable(functions, 'manageProduct');
const manageProductTypeCallable = httpsCallable(functions, 'manageProductType');
const manageCategoryCallable = httpsCallable(functions, 'manageCategory');
const manageSubCategoryCallable = httpsCallable(functions, 'manageSubCategory');
const manageBrandCallable = httpsCallable(functions, 'manageBrand');

export default function AddProduct() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const editProductId = searchParams.get('edit');
    const { showToast } = useToast();

    const [stockInfo, setStockInfo] = useState({ quantity: '', unit: 'g', stock: '' });
    const [pricing, setPricing] = useState({ mrp: '', distributorPrice: '', offerPrice: '', specialPrice: '' });
    const [taxApplicable, setTaxApplicable] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [productOptions, setProductOptions] = useState([]);
    const [relatedProductsLoading, setRelatedProductsLoading] = useState(true);
    const [relatedProductSearch, setRelatedProductSearch] = useState('');
    const [relatedProductDropdownOpen, setRelatedProductDropdownOpen] = useState(false);
    const [productData, setProductData] = useState(null);
    const [productTypes, setProductTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSubCategory, setSelectedSubCategory] = useState('');
    const [selectedBrand, setSelectedBrand] = useState('');
    const [loadingProduct, setLoadingProduct] = useState(Boolean(editProductId));
    const [productLoadError, setProductLoadError] = useState(false);
    const [existingThumbnail, setExistingThumbnail] = useState('');
    const [existingGallery, setExistingGallery] = useState([]);

    useEffect(() => {
        let active = true;
        const loadCatalogOptions = async () => {
            try {
                const [productTypeResponse, categoryResponse, brandResponse] = await Promise.all([
                    manageProductTypeCallable({ action: 'list' }),
                    manageCategoryCallable({ action: 'list' }),
                    manageBrandCallable({ action: 'list' }),
                ]);
                const responses = [
                    [productTypeResponse, 'product types'],
                    [categoryResponse, 'categories'],
                    [brandResponse, 'brands'],
                ];
                const failedResponse = responses.find(([response]) => !response.data?.success);
                if (failedResponse) {
                    throw new Error(failedResponse[0].data?.message || `Unable to load ${failedResponse[1]}.`);
                }

                if (active) {
                    setProductTypes(productTypeResponse.data.data || []);
                    setCategories(categoryResponse.data.data || []);
                    setBrands(brandResponse.data.data || []);
                }
            } catch (error) {
                if (!active) return;
                console.error('Failed to load product catalog options:', error);
                showToast(error.message || 'Unable to load product catalog options.', 'error');
            }
        };

        loadCatalogOptions();
        return () => { active = false; };
    }, [showToast]);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, 'products'),
            (snapshot) => {
                setProductOptions(snapshot.docs.map(document => ({
                    id: document.id,
                    ...document.data(),
                })));
                setRelatedProductsLoading(false);
            },
            (error) => {
                console.error('Failed to load related product options:', error);
                showToast('Unable to load related product options.', 'error');
                setRelatedProductsLoading(false);
            }
        );

        return unsubscribe;
    }, [showToast]);

    useEffect(() => {
        const category = categories.find(item => (
            item.id === selectedCategory || item.categoryName === selectedCategory
        ));
        const categoryId = category?.id || selectedCategory;
        if (!categoryId || categoryId === 'general') {
            setSubCategories([]);
            return undefined;
        }

        let active = true;
        const loadSubCategories = async () => {
            try {
                const response = await manageSubCategoryCallable({
                    action: 'list',
                    fields: { categoryId },
                });
                if (!response.data?.success) {
                    throw new Error(response.data?.message || 'Unable to load subcategories.');
                }
                if (active) setSubCategories(response.data.data || []);
            } catch (error) {
                if (!active) return;
                console.error('Failed to load subcategories:', error);
                showToast(error.message || 'Unable to load subcategories.', 'error');
            }
        };

        loadSubCategories();
        return () => { active = false; };
    }, [categories, selectedCategory, showToast]);

    useEffect(() => {
        if (!editProductId) return undefined;

        let active = true;
        const loadProduct = async () => {
            setLoadingProduct(true);
            try {
                const productSnapshot = await getDoc(doc(db, 'products', editProductId));
                if (!productSnapshot.exists()) {
                    throw new Error('Product not found.');
                }
                if (!active) return;

                const data = productSnapshot.data();
                setProductData(data);
                setSelectedCategory(data.categoryId || (data.category === 'general' ? '' : data.category) || '');
                setSelectedSubCategory(data.subCategoryId || (data.subCategory === 'general' ? '' : data.subCategory) || '');
                setSelectedBrand(data.brandId || (data.brand === 'general' ? '' : data.brand) || '');
                setStockInfo({
                    quantity: data.quantity ?? '',
                    unit: data.unit || 'g',
                    stock: data.stock ?? '',
                });
                setPricing({
                    mrp: data.mrp ?? '',
                    distributorPrice: data.distributorPrice ?? '',
                    offerPrice: data.offerPrice ?? '',
                    specialPrice: data.specialPrice ?? '',
                });
                setTaxApplicable(Boolean(data.taxApplicable));
                setRelatedProducts(data.relatedProduct || []);
                setExistingThumbnail(data.thumbnail || '');
                setExistingGallery(data.images || []);
            } catch (error) {
                if (!active) return;
                console.error('Failed to load product for editing:', error);
                setProductLoadError(true);
                showToast(error.message || 'Unable to load product.', 'error');
            } finally {
                if (active) setLoadingProduct(false);
            }
        };

        loadProduct();
        return () => { active = false; };
    }, [editProductId, showToast]);

    const updateStockInfo = (field, value) => setStockInfo(prev => ({ ...prev, [field]: value }));
    const updatePricing = (field, value) => setPricing(prev => ({ ...prev, [field]: value }));
    const selectRelatedProduct = (product) => {
        setRelatedProducts(prev => (
            prev.some(relatedProduct => relatedProduct.productId === product.id)
                ? prev
                : [...prev, {
                    productId: product.id,
                    productName: product.productName || '',
                }]
        ));
        setRelatedProductSearch('');
        setRelatedProductDropdownOpen(false);
    };

    const [thumbnail, setThumbnail] = useState(null);
    const [gallery, setGallery] = useState([]);

    const thumbnailPreview = React.useMemo(
        () => (thumbnail ? URL.createObjectURL(thumbnail) : null),
        [thumbnail]
    );

    useEffect(() => {
        return () => { if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview); };
    }, [thumbnailPreview]);

    useEffect(() => {
        const previews = gallery.map((file) => ({ file, url: URL.createObjectURL(file) }));
        setGalleryPreviews(previews);
        return () => { previews.forEach(({ url }) => URL.revokeObjectURL(url)); };
    }, [gallery]);

    const [galleryPreviews, setGalleryPreviews] = useState([]);

    const handleThumbnailChange = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            setThumbnail(file);
            setExistingThumbnail('');
        }
        event.target.value = '';
    };

    const handleGalleryChange = (event) => {
        const files = Array.from(event.target.files || []);
        setGallery(prev => [...prev, ...files.filter(f => f.type.startsWith('image/'))]);
        event.target.value = '';
    };

    const removeThumbnail = () => {
        setThumbnail(null);
        setExistingThumbnail('');
    };
    const removeGalleryImage = (index) => {
        if (index < existingGallery.length) {
            setExistingGallery(prev => prev.filter((_, imageIndex) => imageIndex !== index));
            return;
        }
        const newImageIndex = index - existingGallery.length;
        setGallery(prev => prev.filter((_, imageIndex) => imageIndex !== newImageIndex));
    };

    const inputClass =
        'w-full rounded-lg border border-tertiary/60 bg-slate-50/70 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-secondary/50 hover:bg-white focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10';

    const labelClass =
        'mb-1.5 block text-sm font-semibold text-gray-900';

    const sectionClass =
        'rounded-xl border border-tertiary/40 bg-white p-4 shadow-sm sm:p-5';

    const heading = (Icon, title, subtitle) => (
        <div className="mb-4 flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon size={17} />
            </div>

            <div>
                <h3 className="text-sm font-bold text-gray-900 sm:text-base">
                    {title}
                </h3>

                <p className="mt-0.5 text-xs font-medium text-secondary/80">
                    {subtitle}
                </p>
            </div>
        </div>
    );

    const Toggle = ({ id, label, description }) => (
        <label
            htmlFor={id}
            className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-tertiary/40 bg-slate-50/60 p-3 transition hover:bg-slate-50"
        >
            <div>
                <p className="text-sm font-semibold text-gray-900">
                    {label}
                </p>

                <p className="mt-0.5 text-xs text-secondary/80">
                    {description}
                </p>
            </div>

            <span className="relative inline-flex shrink-0 items-center">
                <input
                    type="checkbox"
                    id={id}
                    name={id}
                    {...(id === 'taxApplicable'
                        ? { checked: taxApplicable, onChange: (event) => setTaxApplicable(event.target.checked) }
                        : {
                            defaultChecked: id === 'isActive'
                                ? (productData?.isActive ?? true)
                                : (productData?.productVisible ?? true)
                        })}
                    className="peer sr-only"
                />

                <span className="h-5 w-9 rounded-full bg-slate-300 transition-colors peer-checked:bg-emerald-500 peer-focus-visible:ring-4 peer-focus-visible:ring-primary/20" />

                <span className="absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4" />
            </span>
        </label>
    );

    const SelectField = ({
        id,
        label,
        options,
        required = false,
        defaultValue = '',
        value,
        onChange,
        disabled = false,
    }) => (
        <div className="min-w-0">
            <label htmlFor={id} className={labelClass}>
                {label}
                {required && (
                    <span className="ml-1 text-rose-500">*</span>
                )}
            </label>

            <div className="relative">
                <select
                    id={id}
                    name={id}
                    required={required}
                    disabled={disabled}
                    {...(value !== undefined ? { value, onChange } : { defaultValue })}
                    className={`${inputClass} appearance-none pr-9`}
                >
                    <option value="" disabled>
                        Select {label.toLowerCase()}
                    </option>

                    {options.map((option) => (
                        <option
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </option>
                    ))}
                </select>

                <ChevronDown
                    size={15}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60"
                />
            </div>
        </div>
    );

    const TextField = ({
        id,
        label,
        placeholder,
        type = 'text',
        required = false,
        min,
        step,
        defaultValue = '',
    }) => (
        <div className="min-w-0">
            <label htmlFor={id} className={labelClass}>
                {label}
                {required && (
                    <span className="ml-1 text-rose-500">*</span>
                )}
            </label>

            <input
                type={type}
                id={id}
                name={id}
                placeholder={
                    placeholder || `Enter ${label.toLowerCase()}`
                }
                required={required}
                min={min}
                step={step}
                defaultValue={defaultValue}
                className={inputClass}
            />
        </div>
    );

    const handleSubmit = async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const formValue = (name) => formData.get(name)?.toString().trim() || '';
        const numberValue = (name) => {
            const value = formValue(name);
            return value === '' ? null : Number(value);
        };

        setSubmitting(true);
        try {
            const uploadProductImage = async (file) => {
                if (!file) return '';
                const imageRef = ref(storage, `products/${crypto.randomUUID()}-${file.name}`);
                await uploadBytes(imageRef, file);
                return getDownloadURL(imageRef);
            };

            const [thumbnailUrl, images] = await Promise.all([
                uploadProductImage(thumbnail),
                Promise.all(gallery.map(uploadProductImage)),
            ]);
            const categoryId = formValue('category');
            const subCategoryId = formValue('subCategory');
            const brandId = formValue('brand');
            const category = categories.find(item => item.id === categoryId)?.categoryName
                || (categoryId === 'general' ? 'general' : categoryId);
            const subCategory = subCategories.find(item => item.id === subCategoryId)?.subCategoryName
                || (subCategoryId === 'general' ? 'general' : subCategoryId);
            const brand = brands.find(item => item.id === brandId)?.brandName
                || (brandId === 'general' ? 'general' : brandId);
            const fields = {
                productName: formValue('productName'),
                productSKU: formValue('productSKU'),
                productType: formValue('productType'),
                category,
                categoryId,
                subCategory,
                subCategoryId,
                brand,
                brandId,
                relatedProduct: relatedProducts
                    .filter(product => product.productId && product.productName)
                    .map(product => ({
                        productId: product.productId,
                        productName: product.productName,
                    })),
                description: formValue('description'),
                isActive: formData.has('isActive'),
                taxApplicable,
                taxPercentage: taxApplicable ? numberValue('taxPercentage') : null,
                productVisible: formData.has('productVisible'),
                codeLetters: formValue('codeLetters'),
                codeNumber: numberValue('codeNumber'),
                hsnCode: formValue('hsnCode'),
                quantity: numberValue('quantity'),
                unit: formValue('unit'),
                stock: numberValue('stock'),
                mrp: numberValue('mrp'),
                distributorPrice: numberValue('distributorPrice'),
                offerPrice: numberValue('offerPrice'),
                specialPrice: numberValue('specialPrice'),
                thumbnail: thumbnailUrl || existingThumbnail,
                images: [...existingGallery, ...images],
            };
            const response = await manageProductCallable(editProductId ? {
                action: 'edit',
                productDocId: editProductId,
                fields,
            } : {
                action: 'add',
                fields,
            });

            if (!response.data?.success) {
                throw new Error(response.data?.message || response.data?.error || `Unable to ${editProductId ? 'update' : 'add'} product.`);
            }
            showToast(response.data.message || `Product ${editProductId ? 'updated' : 'added'} successfully.`, 'success');
            navigate('/products');
        } catch (error) {
            console.error(`Failed to ${editProductId ? 'update' : 'add'} product:`, error);
            showToast(error.message || `Unable to ${editProductId ? 'update' : 'add'} product. Please try again.`, 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const selectedCategoryEntry = categories.find(item => (
        item.id === selectedCategory || item.categoryName === selectedCategory
    ));
    const selectedCategoryValue = selectedCategoryEntry?.id || (selectedCategory === 'general' ? '' : selectedCategory);
    const availableSubCategories = selectedCategoryEntry?.subCategory?.length
        ? selectedCategoryEntry.subCategory.map(item => ({
            id: item.id,
            subCategoryName: item.subCategoryName,
            categoryId: selectedCategoryEntry.id,
        }))
        : subCategories.filter(item => item.categoryId === selectedCategoryValue);
    const selectedSubCategoryEntry = availableSubCategories.find(item => (
        item.id === selectedSubCategory || item.subCategoryName === selectedSubCategory
    ));
    const selectedSubCategoryValue = selectedSubCategoryEntry?.id
        || (selectedSubCategory === 'general' ? '' : selectedSubCategory);
    const selectedBrandEntry = brands.find(item => (
        item.id === selectedBrand || item.brandName === selectedBrand
    ));
    const selectedBrandValue = selectedBrandEntry?.id || (selectedBrand === 'general' ? '' : selectedBrand);

    if (loadingProduct) {
        return <div className="p-8 text-center text-sm text-gray-600">Loading product...</div>;
    }

    if (productLoadError) {
        return (
            <div className="p-8 text-center">
                <p className="mb-4 text-sm text-gray-600">Could not load this product for editing.</p>
                <button type="button" onClick={() => navigate('/products')} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white">
                    Back to Products
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white pb-8 page-container">
            <div className="mx-auto max-w-6xl space-y-4">

                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-tertiary/30 py-4">
                    <div>
                        <h1 className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
                            {editProductId ? 'Edit Product' : 'Add New Product'}
                        </h1>
                    </div>

                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        aria-label="Close"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-tertiary/50 bg-white text-secondary shadow-sm transition hover:bg-slate-100 hover:text-gray-900"
                    >
                        <X size={18} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* General Information */}
                    <section className={sectionClass}>
                        {heading(
                            Info,
                            'General Information',
                        )}

                        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-4">
                            <TextField
                                id="productName"
                                label="Product Name"
                                placeholder="e.g. Premium Arabica Coffee"
                                required
                                defaultValue={productData?.productName || ''}
                            />

                            <TextField
                                id="productSKU"
                                label="Product SKU"
                                placeholder="20"
                                required
                                defaultValue={productData?.productSKU || ''}
                            />

                            <SelectField
                                id="productType"
                                label="Product Type"
                                required
                                defaultValue={productData?.productType === 'general' ? '' : (productData?.productType || '')}
                                options={[
                                    ...productTypes.map(type => ({
                                        value: type.productTypeName,
                                        label: type.productTypeName,
                                    })),
                                    ...(productData?.productType && productData.productType !== 'general'
                                        && !productTypes.some(type => type.productTypeName === productData.productType)
                                        ? [{ value: productData.productType, label: productData.productType }]
                                        : []),
                                ]}
                            />

                            <SelectField
                                id="category"
                                label="Category"
                                required
                                value={selectedCategoryValue}
                                onChange={event => {
                                    setSelectedCategory(event.target.value);
                                    setSelectedSubCategory('');
                                }}
                                options={[
                                    ...categories.map(category => ({
                                        value: category.id,
                                        label: category.categoryName,
                                    })),
                                    ...(selectedCategoryValue
                                        && !categories.some(category => category.id === selectedCategoryValue)
                                        ? [{ value: selectedCategoryValue, label: productData?.category || selectedCategoryValue }]
                                        : []),
                                ]}
                            />
                            <SelectField
                                id="subCategory"
                                label="Subcategory"
                                required
                                value={selectedSubCategoryValue}
                                disabled={!selectedCategoryValue}
                                onChange={event => setSelectedSubCategory(event.target.value)}
                                options={[
                                    ...availableSubCategories.map(subCategory => ({
                                        value: subCategory.id,
                                        label: subCategory.subCategoryName,
                                    })),
                                    ...(selectedSubCategoryValue
                                        && !availableSubCategories.some(subCategory => subCategory.id === selectedSubCategoryValue)
                                        ? [{ value: selectedSubCategoryValue, label: productData?.subCategory || selectedSubCategoryValue }]
                                        : []),
                                ]}
                            />

                            <SelectField
                                id="brand"
                                label="Brand"
                                required
                                value={selectedBrandValue}
                                onChange={event => setSelectedBrand(event.target.value)}
                                options={[
                                    ...brands.map(brand => ({
                                        value: brand.id,
                                        label: brand.brandName,
                                    })),
                                    ...(selectedBrandValue
                                        && !brands.some(brand => brand.id === selectedBrandValue)
                                        ? [{ value: selectedBrandValue, label: productData?.brand || selectedBrandValue }]
                                        : []),
                                ]}
                            />
                            <div className="sm:col-span-2 lg:col-span-2">
                                <label
                                    htmlFor="description"
                                    className={labelClass}
                                >
                                    Product Description
                                </label>

                                <textarea
                                    id="description"
                                    name="description"
                                    rows={1}
                                    defaultValue={productData?.description || ''}
                                    placeholder="Describe product features and details..."
                                    className={`${inputClass} resize-y`}
                                />
                            </div>
                        </div>

                        <div className="mt-3">
                            <label htmlFor="relatedProducts" className={labelClass}>Related Products</label>
                            <div className="relative">
                                <input
                                    id="relatedProducts"
                                    role="combobox"
                                    aria-autocomplete="list"
                                    aria-haspopup="listbox"
                                    aria-expanded={relatedProductDropdownOpen}
                                    aria-controls="relatedProductOptions"
                                    value={relatedProductSearch}
                                    onFocus={() => setRelatedProductDropdownOpen(true)}
                                    onBlur={event => {
                                        if (!event.currentTarget.parentElement?.contains(event.relatedTarget)) {
                                            setRelatedProductDropdownOpen(false);
                                        }
                                    }}
                                    onKeyDown={event => {
                                        if (event.key === 'Escape') {
                                            setRelatedProductDropdownOpen(false);
                                        } else if (event.key === 'Enter' && relatedProductDropdownOpen) {
                                            event.preventDefault();
                                        }
                                    }}
                                    onChange={event => {
                                        setRelatedProductSearch(event.target.value);
                                        setRelatedProductDropdownOpen(true);
                                    }}
                                    placeholder="Search products by name, type, category, or brand..."
                                    autoComplete="off"
                                    className={inputClass}
                                />
                                {relatedProductDropdownOpen && (
                                    <div
                                        id="relatedProductOptions"
                                        role="listbox"
                                        className="absolute left-0 right-0 top-full z-30 mt-1 max-h-64 overflow-y-auto rounded-xl border border-tertiary/50 bg-white p-1 shadow-xl"
                                    >
                                        {relatedProductsLoading ? (
                                            <p className="px-3 py-3 text-sm text-secondary/70">Loading products...</p>
                                        ) : productOptions.filter(option => {
                                            const search = relatedProductSearch.trim().toLowerCase();
                                            const optionText = [
                                                option.productId,
                                                option.productName,
                                                option.productType,
                                                option.category,
                                                option.subCategory,
                                                option.brand,
                                                option.productSKU,
                                            ].join(' ').toLowerCase();
                                            const alreadySelected = relatedProducts.some(selected => selected.productId === option.id);
                                            const isCurrentProduct = option.id === editProductId
                                                || (productData?.productId && option.productId === productData.productId);

                                            return !alreadySelected
                                                && !isCurrentProduct
                                                && (!search || optionText.includes(search));
                                        }).map(option => (
                                            <button
                                                key={option.id}
                                                type="button"
                                                role="option"
                                                aria-selected={false}
                                                onClick={() => selectRelatedProduct(option)}
                                                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition hover:bg-primary/5 focus:bg-primary/5 focus:outline-none"
                                            >
                                                <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-tertiary/40 bg-slate-100">
                                                    {option.thumbnail || option.images?.[0] ? (
                                                        <img
                                                            src={option.thumbnail || option.images[0]}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-secondary/40">
                                                            <ImagePlus size={16} />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-semibold text-gray-900">
                                                        {option.productName || 'Unnamed product'}
                                                    </span>
                                                    <span className="block truncate text-[11px] text-secondary/80">
                                                        {option.productType || 'No type'} · {option.category || 'No category'} · {option.subCategory || 'No subcategory'} · {option.brand || 'No brand'}
                                                    </span>
                                                </span>
                                            </button>
                                        ))}
                                        {!relatedProductsLoading && !productOptions.some(option => {
                                            const search = relatedProductSearch.trim().toLowerCase();
                                            const optionText = [
                                                option.productId,
                                                option.productName,
                                                option.productType,
                                                option.category,
                                                option.subCategory,
                                                option.brand,
                                                option.productSKU,
                                            ].join(' ').toLowerCase();
                                            const alreadySelected = relatedProducts.some(selected => selected.productId === option.id);
                                            return !alreadySelected
                                                && option.id !== editProductId
                                                && !(productData?.productId && option.productId === productData.productId)
                                                && (!search || optionText.includes(search));
                                        }) && (
                                            <p className="px-3 py-3 text-sm text-secondary/70">
                                                {productOptions.length ? 'No matching products found.' : 'No products available.'}
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                            {relatedProducts.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-2 rounded-lg border border-tertiary/40 bg-slate-50/50 p-2">
                                    {relatedProducts.map((product, index) => {
                                        const productOption = productOptions.find(option => option.id === product.productId);
                                        const image = productOption?.thumbnail || productOption?.images?.[0];

                                        return (
                                            <div
                                                key={`${product.productId}-${index}`}
                                                className="flex max-w-full items-center gap-2 rounded-lg border border-tertiary/40 bg-white py-1 pl-1 pr-2 shadow-sm"
                                            >
                                                <div className="h-8 w-8 shrink-0 overflow-hidden rounded-md bg-slate-100">
                                                    {image ? (
                                                        <img src={image} alt="" className="h-full w-full object-cover" />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-secondary/40">
                                                            <ImagePlus size={14} />
                                                        </div>
                                                    )}
                                                </div>
                                                <span className="max-w-40 truncate text-xs font-semibold text-gray-800">
                                                    {product.productName || productOption?.productName || 'Unnamed product'}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => setRelatedProducts(prev => prev.filter((_, productIndex) => productIndex !== index))}
                                                    aria-label={`Remove ${product.productName || 'related product'}`}
                                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-secondary transition hover:bg-rose-50 hover:text-rose-600"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-5">

                            <Toggle
                                id="isActive"
                                label="Active Product"
                                description="Enable this product in your catalog."
                            />

                            <Toggle
                                id="taxApplicable"
                                label="Tax Applicable"
                                description="Apply tax to product variants."
                            />
                            {taxApplicable && (
                                <div className="min-w-0">
                                    <label htmlFor="taxPercentage" className={labelClass}>
                                        Tax Percentage
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            id="taxPercentage"
                                            name="taxPercentage"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            placeholder="Enter tax percentage"
                                            required
                                            defaultValue={productData?.taxPercentage ?? ''}
                                            className={`${inputClass} pr-8`}
                                        />
                                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-secondary/70">%</span>
                                    </div>
                                </div>
                            )}
                            <Toggle
                                id="productVisible"
                                label="Product Visibility"
                                description="Show this Product on Home Page."
                            />
                        </div>
                    </section>

                    {/* Product Media */}
                    <section className={sectionClass}>
                        {heading(ImagePlus, 'Product Media')}

                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-stretch">

                            {/* Primary Thumbnail */}
                            <div className="flex flex-col min-w-0">
                                <label htmlFor="thumbnail" className={labelClass}>
                                    Primary Thumbnail
                                </label>
                                <input type="file" id="thumbnail" name="thumbnail" accept="image/*" onChange={handleThumbnailChange} className="sr-only" />

                                <div className="flex-1 rounded-xl border border-tertiary/40 bg-slate-50/50 overflow-hidden">
                                    {thumbnailPreview || existingThumbnail ? (
                                        <div className="relative flex h-full min-h-[160px] items-center justify-center p-2">
                                            <img src={thumbnailPreview || existingThumbnail} alt="Primary product preview" className="max-h-40 w-full rounded-lg object-contain" />
                                            <button type="button" onClick={removeThumbnail} aria-label="Remove thumbnail"
                                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-rose-500 shadow-sm transition hover:bg-rose-50 border border-rose-100">
                                                <Trash2 size={13} />
                                            </button>
                                            <label htmlFor="thumbnail" className="absolute bottom-2 left-2 cursor-pointer rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-sm hover:bg-white border border-tertiary/30 transition">
                                                Change
                                            </label>
                                        </div>
                                    ) : (
                                        <label htmlFor="thumbnail" className="group flex h-full min-h-[160px] cursor-pointer flex-col items-center justify-center p-4 text-center transition hover:bg-primary/[0.03]">
                                            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
                                                <Upload size={20} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-900">Click to upload</p>
                                            <p className="mt-0.5 text-[11px] text-secondary/60">PNG, JPG or WEBP</p>
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Product Gallery */}
                            <div className="flex flex-col min-w-0">
                                <label className={labelClass}>
                                    Product Gallery
                                    <span className="ml-1.5 text-xs font-normal text-secondary/70">({existingGallery.length + gallery.length})</span>
                                </label>
                                <input type="file" id="productGallery" name="productGallery" accept="image/*" multiple onChange={handleGalleryChange} className="sr-only" />

                                <div className="flex-1 rounded-xl border border-tertiary/40 bg-slate-50/50 overflow-hidden">
                                    <div className="h-full min-h-[160px] p-2 overflow-y-auto">
                                        {existingGallery.length + gallery.length === 0 ? (
                                            <label htmlFor="productGallery" className="group flex h-full min-h-[148px] cursor-pointer flex-col items-center justify-center p-4 text-center transition hover:bg-primary/[0.03]">
                                                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
                                                    <Plus size={20} />
                                                </div>
                                                <p className="text-xs font-bold text-gray-900">Add gallery images</p>
                                                <p className="mt-0.5 text-[11px] text-secondary/60">Select multiple files</p>
                                            </label>
                                        ) : (
                                            <div className="grid grid-cols-4 gap-2">
                                                {existingGallery.map((url, index) => (
                                                    <div key={`existing-${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-tertiary/40 bg-slate-100">
                                                        <img src={url} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover transition group-hover:scale-105 duration-300" />
                                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                                                        <button type="button" onClick={() => removeGalleryImage(index)} aria-label={`Remove gallery image ${index + 1}`}
                                                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-white/95 text-rose-500 shadow-sm transition hover:bg-rose-50 opacity-0 group-hover:opacity-100">
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {galleryPreviews.map(({ file, url }, index) => (
                                                    <div key={`${file.name}-${file.lastModified}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-tertiary/40 bg-slate-100">
                                                        <img src={url} alt={`Gallery ${existingGallery.length + index + 1}`} className="h-full w-full object-cover transition group-hover:scale-105 duration-300" />
                                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                                                        <button type="button" onClick={() => removeGalleryImage(existingGallery.length + index)} aria-label={`Remove gallery image ${existingGallery.length + index + 1}`}
                                                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-md bg-white/95 text-rose-500 shadow-sm transition hover:bg-rose-50 opacity-0 group-hover:opacity-100">
                                                            <Trash2 size={11} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <label htmlFor="productGallery" className="group flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-tertiary/50 bg-white/60 transition hover:border-primary/50 hover:bg-primary/[0.03]">
                                                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary transition group-hover:scale-105">
                                                        <Plus size={15} />
                                                    </div>
                                                    <span className="text-[10px] font-bold text-gray-700 mt-1">Add</span>
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Inventory & Identifiers */}
                    <section className={sectionClass}>
                        {heading(
                            Boxes,
                            'Inventory & Identifiers',
                        )}

                        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">
                            <TextField
                                id="codeLetters"
                                label="Code Letters"
                                placeholder="e.g. ABC"
                                required
                                defaultValue={productData?.codeLetters || ''}
                            />

                            <TextField
                                id="codeNumber"
                                label="Code Number"
                                placeholder="e.g. 000123"
                                type="number"
                                min="0"
                                step="1"
                                required
                                defaultValue={productData?.codeNumber ?? ''}
                            />

                            <TextField
                                id="hsnCode"
                                label="HSN Code"
                                placeholder="Enter HSN code"
                                defaultValue={productData?.hsnCode || ''}
                            />
                        </div>
                    </section>

                    {/* Pricing & Stock */}
                    <section className={sectionClass}>
                        {heading(DollarSign, 'Pricing & Stock')}

                        <div className="space-y-5">

                            {/* Stock Info */}
                            <div>
                                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-secondary/60">Stock Info</p>
                                <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">

                                    {/* Quantity */}
                                    <div className="min-w-0">
                                        <label htmlFor="quantity" className={labelClass}>
                                            Quantity <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number" id="quantity" name="quantity"
                                            value={stockInfo.quantity}
                                            onChange={(e) => updateStockInfo('quantity', e.target.value)}
                                            placeholder="e.g. 500" className={inputClass}
                                            required min="0" step="any"
                                        />
                                    </div>

                                    {/* Unit */}
                                    <div className="min-w-0">
                                        <label htmlFor="unit" className={labelClass}>
                                            Unit <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                id="unit" name="unit"
                                                value={stockInfo.unit}
                                                onChange={(e) => updateStockInfo('unit', e.target.value)}
                                                className={`${inputClass} appearance-none pr-9`} required
                                            >
                                                <option value="piece">Piece</option>
                                                <option value="kg">Kilogram (kg)</option>
                                                <option value="g">Gram (g)</option>
                                                <option value="litre">Litre</option>
                                                <option value="ml">Millilitre (ml)</option>
                                                <option value="box">Box</option>
                                                <option value="pack">Pack</option>
                                                <option value="set">Set</option>
                                            </select>
                                            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60" />
                                        </div>
                                    </div>

                                    {/* Stock */}
                                    <div className="min-w-0">
                                        <label htmlFor="stock" className={labelClass}>
                                            Stock <span className="text-rose-500">*</span>
                                        </label>
                                        <input
                                            type="number" id="stock" name="stock"
                                            value={stockInfo.stock}
                                            onChange={(e) => updateStockInfo('stock', e.target.value)}
                                            placeholder="e.g. 100" className={inputClass}
                                            required min="0" step="any"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="border-t border-tertiary/30" />

                            {/* Pricing */}
                            <div>
                                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-secondary/60">Pricing (₹)</p>
                                <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-4">

                                    {/* Distributor Price */}
                                    <div className="min-w-0">
                                        <label htmlFor="distributorPrice" className={labelClass}>
                                            Distributor Price <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary/70">₹</span>
                                            <input
                                                type="number" id="distributorPrice" name="distributorPrice"
                                                value={pricing.distributorPrice}
                                                onChange={(e) => updatePricing('distributorPrice', e.target.value)}
                                                placeholder="0.00" className={`${inputClass} pl-8`}
                                                required min="0" step="0.01"
                                            />
                                        </div>
                                    </div>
                                    {/* MRP */}
                                    <div className="min-w-0">
                                        <label htmlFor="mrp" className={labelClass}>
                                            MRP <span className="text-rose-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary/70">₹</span>
                                            <input
                                                type="number" id="mrp" name="mrp"
                                                value={pricing.mrp}
                                                onChange={(e) => updatePricing('mrp', e.target.value)}
                                                placeholder="0.00" className={`${inputClass} pl-8`}
                                                required min="0" step="0.01"
                                            />
                                        </div>
                                    </div>

                                    {/* Offer Price */}
                                    <div className="min-w-0">
                                        <label htmlFor="offerPrice" className={labelClass}>Offer Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary/70">₹</span>
                                            <input
                                                type="number" id="offerPrice" name="offerPrice"
                                                value={pricing.offerPrice}
                                                onChange={(e) => updatePricing('offerPrice', e.target.value)}
                                                placeholder="0.00" className={`${inputClass} pl-8`}
                                                min="0" step="0.01"
                                            />
                                        </div>
                                    </div>

                                    {/* Special Price */}
                                    <div className="min-w-0">
                                        <label htmlFor="specialPrice" className={labelClass}>Special Price</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary/70">₹</span>
                                            <input
                                                type="number" id="specialPrice" name="specialPrice"
                                                value={pricing.specialPrice}
                                                onChange={(e) => updatePricing('specialPrice', e.target.value)}
                                                placeholder="0.00" className={`${inputClass} pl-8`}
                                                min="0" step="0.01"
                                            />
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>
                    </section>

                    {/* Bottom Actions */}
                    <div className="sticky bottom-0 z-10 -mx-3 border-t border-tertiary/40 bg-white/95 px-3 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur-md sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
                        <div className="mx-auto flex max-w-6xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

                            <div className="flex gap-2 sm:ml-auto">
                                <button
                                    type="button"
                                    onClick={() => navigate('/products')}
                                    className="flex-1 rounded-lg border border-tertiary/60 bg-white px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-slate-50 sm:flex-none"
                                >
                                    Discard
                                </button>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-secondary sm:flex-none"
                                >
                                    <Plus size={16} />
                                    {submitting
                                        ? (editProductId ? 'Saving Changes...' : 'Adding Product...')
                                        : (editProductId ? 'Save Changes' : 'Add Product')}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
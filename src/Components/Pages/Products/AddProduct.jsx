import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export default function AddProduct() {
    const navigate = useNavigate();

    const [stockInfo, setStockInfo] = useState({ quantity: '', unit: 'g', stock: '' });
    const [pricing, setPricing] = useState({ mrp: '', offerPrice: '', specialPrice: '' });

    const updateStockInfo = (field, value) => setStockInfo(prev => ({ ...prev, [field]: value }));
    const updatePricing = (field, value) => setPricing(prev => ({ ...prev, [field]: value }));

    const [thumbnail, setThumbnail] = useState(null);
    const [gallery, setGallery] = useState([]);

    // Create and clean up thumbnail preview URL
    const thumbnailPreview = React.useMemo(
        () => (thumbnail ? URL.createObjectURL(thumbnail) : null),
        [thumbnail]
    );

    useEffect(() => {
        return () => { if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview); };
    }, [thumbnailPreview]);

    // Create gallery preview URLs and clean them up
    useEffect(() => {
        const previews = gallery.map((file) => ({ file, url: URL.createObjectURL(file) }));
        setGalleryPreviews(previews);
        return () => { previews.forEach(({ url }) => URL.revokeObjectURL(url)); };
    }, [gallery]);

    const [galleryPreviews, setGalleryPreviews] = useState([]);

    const handleThumbnailChange = (event) => {
        const file = event.target.files?.[0];
        if (file) setThumbnail(file);
        event.target.value = '';
    };

    const handleGalleryChange = (event) => {
        const files = Array.from(event.target.files || []);
        setGallery(prev => [...prev, ...files.filter(f => f.type.startsWith('image/'))]);
        event.target.value = '';
    };

    const removeThumbnail = () => setThumbnail(null);
    const removeGalleryImage = (index) => setGallery(prev => prev.filter((_, i) => i !== index));

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
                    defaultChecked={id === 'isActive'}
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
                    defaultValue=""
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
                className={inputClass}
            />
        </div>
    );

    const handleSubmit = (event) => {
        event.preventDefault();
    };

    return (
        <div className="min-h-screen bg-white pb-8 page-container">
            <div className="mx-auto max-w-6xl space-y-4">

                {/* Header */}
                <div className="flex items-center justify-between gap-3 border-b border-tertiary/30 py-4">
                    <div>
                        <h1 className="bg-gradient-to-br from-primary to-secondary bg-clip-text text-xl font-bold text-transparent sm:text-2xl">
                            Add New Product
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
                            />

                            <TextField
                                id="productSKU"
                                label="Product SKU"
                                placeholder="20"
                            />

                            <SelectField
                                id="productType"
                                label="Product Type"
                                options={[
                                    { value: 'general', label: 'General' },
                                ]}
                            />

                            <SelectField
                                id="productCategory"
                                label="Category"
                                options={[
                                    { value: 'general', label: 'General' },
                                ]}
                            />
                            <SelectField
                                id="productSubCategory"
                                label="Sub Category"
                                options={[
                                    { value: 'general', label: 'General' },
                                ]}
                            />

                            <SelectField
                                id="productBrand"
                                label="Brand"
                                options={[
                                    { value: 'general', label: 'General' },
                                ]}
                            />

                            <TextField
                                id="relatedProduct"
                                label="Related Products"
                                placeholder="Product names or IDs"
                            />


                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-5">
                            <div className="sm:col-span-2 lg:col-span-2">
                                <label
                                    htmlFor="productDescription"
                                    className={labelClass}
                                >
                                    Product Description
                                </label>

                                <textarea
                                    id="productDescription"
                                    name="productDescription"
                                    rows={2}
                                    placeholder="Describe product features and details..."
                                    className={`${inputClass} resize-y`}
                                />
                            </div>
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
                                <label htmlFor="productImage" className={labelClass}>
                                    Primary Thumbnail
                                </label>
                                <input type="file" id="productImage" name="productImage" accept="image/*" onChange={handleThumbnailChange} className="sr-only" />

                                <div className="flex-1 rounded-xl border border-tertiary/40 bg-slate-50/50 overflow-hidden">
                                    {thumbnailPreview ? (
                                        <div className="relative flex h-full min-h-[160px] items-center justify-center p-2">
                                            <img src={thumbnailPreview} alt="Primary product preview" className="max-h-40 w-full rounded-lg object-contain" />
                                            <button type="button" onClick={removeThumbnail} aria-label="Remove thumbnail"
                                                className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-rose-500 shadow-sm transition hover:bg-rose-50 border border-rose-100">
                                                <Trash2 size={13} />
                                            </button>
                                            <label htmlFor="productImage" className="absolute bottom-2 left-2 cursor-pointer rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-gray-800 shadow-sm hover:bg-white border border-tertiary/30 transition">
                                                Change
                                            </label>
                                        </div>
                                    ) : (
                                        <label htmlFor="productImage" className="group flex h-full min-h-[160px] cursor-pointer flex-col items-center justify-center p-4 text-center transition hover:bg-primary/[0.03]">
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
                                    <span className="ml-1.5 text-xs font-normal text-secondary/70">({gallery.length})</span>
                                </label>
                                <input type="file" id="productGallery" name="productGallery" accept="image/*" multiple onChange={handleGalleryChange} className="sr-only" />

                                <div className="flex-1 rounded-xl border border-tertiary/40 bg-slate-50/50 overflow-hidden">
                                    <div className="h-full min-h-[160px] p-2 overflow-y-auto">
                                        {gallery.length === 0 ? (
                                            <label htmlFor="productGallery" className="group flex h-full min-h-[148px] cursor-pointer flex-col items-center justify-center p-4 text-center transition hover:bg-primary/[0.03]">
                                                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
                                                    <Plus size={20} />
                                                </div>
                                                <p className="text-xs font-bold text-gray-900">Add gallery images</p>
                                                <p className="mt-0.5 text-[11px] text-secondary/60">Select multiple files</p>
                                            </label>
                                        ) : (
                                            <div className="grid grid-cols-4 gap-2">
                                                {galleryPreviews.map(({ file, url }, index) => (
                                                    <div key={`${file.name}-${file.lastModified}-${index}`} className="group relative aspect-square overflow-hidden rounded-lg border border-tertiary/40 bg-slate-100">
                                                        <img src={url} alt={`Gallery ${index + 1}`} className="h-full w-full object-cover transition group-hover:scale-105 duration-300" />
                                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg" />
                                                        <button type="button" onClick={() => removeGalleryImage(index)} aria-label={`Remove gallery image ${index + 1}`}
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
                            />

                            <TextField
                                id="codeNumber"
                                label="Code Number"
                                placeholder="e.g. 000123"
                            />

                            <TextField
                                id="hsnCode"
                                label="HSN Code"
                                placeholder="Enter HSN code"
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
                                <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-3">

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
                                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-secondary sm:flex-none"
                                >
                                    <Plus size={16} />
                                    Add Product
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}
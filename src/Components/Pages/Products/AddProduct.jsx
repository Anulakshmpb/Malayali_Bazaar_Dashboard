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

    const [variants, setVariants] = useState([
        { quantity: '', unit: 'g', price: '', stock: '' },
    ]);

    const [thumbnail, setThumbnail] = useState(null);
    const [gallery, setGallery] = useState([]);

    // Create and clean up thumbnail preview URL
    const thumbnailPreview = React.useMemo(
        () => (thumbnail ? URL.createObjectURL(thumbnail) : null),
        [thumbnail]
    );

    useEffect(() => {
        return () => {
            if (thumbnailPreview) {
                URL.revokeObjectURL(thumbnailPreview);
            }
        };
    }, [thumbnailPreview]);

    // Create gallery preview URLs and clean them up
    useEffect(() => {
        const previews = gallery.map((file) => ({
            file,
            url: URL.createObjectURL(file),
        }));

        setGalleryPreviews(previews);

        return () => {
            previews.forEach(({ url }) => URL.revokeObjectURL(url));
        };
    }, [gallery]);

    const [galleryPreviews, setGalleryPreviews] = useState([]);

    const handleThumbnailChange = (event) => {
        const file = event.target.files?.[0];

        if (file) {
            setThumbnail(file);
        }

        // Allows selecting the same file again
        event.target.value = '';
    };

    const handleGalleryChange = (event) => {
        const files = Array.from(event.target.files || []);
        const imageFiles = files.filter((file) =>
            file.type.startsWith('image/')
        );

        setGallery((previous) => [...previous, ...imageFiles]);
        event.target.value = '';
    };

    const removeThumbnail = () => {
        setThumbnail(null);
    };

    const removeGalleryImage = (index) => {
        setGallery((previous) =>
            previous.filter((_, i) => i !== index)
        );
    };

    const addVariant = () => {
        setVariants((previous) => [
            ...previous,
            { quantity: '', unit: 'g', price: '', stock: '' },
        ]);
    };

    const removeVariant = (index) => {
        setVariants((previous) =>
            previous.filter((_, i) => i !== index)
        );
    };

    const updateVariant = (index, field, value) => {
        setVariants((previous) =>
            previous.map((variant, i) =>
                i === index
                    ? { ...variant, [field]: value }
                    : variant
            )
        );
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

                        <div className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
                            <TextField
                                id="productName"
                                label="Product Name"
                                placeholder="e.g. Premium Arabica Coffee"
                                required
                            />

                            <TextField
                                id="productSKU"
                                label="Product SKU"
                                placeholder="e.g. PRD-001"
                            />

                            <TextField
                                id="productType"
                                label="Product Type"
                                placeholder="Enter product type"
                            />

                            <SelectField
                                id="productCategory"
                                label="Category"
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

                        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
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
                        </div>
                    </section>

                    {/* Product Media */}
                    <section className={sectionClass}>
                        {heading(
                            ImagePlus,
                            'Product Media',
                        )}

                        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

                            {/* Primary Thumbnail */}
                            <div className="min-w-0">
                                <label
                                    htmlFor="productImage"
                                    className={labelClass}
                                >
                                    Primary Thumbnail
                                </label>

                                <input
                                    type="file"
                                    id="productImage"
                                    name="productImage"
                                    accept="image/*"
                                    onChange={handleThumbnailChange}
                                    className="sr-only"
                                />

                                {thumbnailPreview ? (
                                    <div className="relative flex min-h-40 items-center justify-center overflow-hidden rounded-xl border border-tertiary/40 bg-slate-50 p-2">
                                        <img
                                            src={thumbnailPreview}
                                            alt="Primary product preview"
                                            className="max-h-52 w-full rounded-lg object-contain"
                                        />

                                        <button
                                            type="button"
                                            onClick={removeThumbnail}
                                            aria-label="Remove thumbnail"
                                            className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-rose-600 shadow-md transition hover:bg-rose-50"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <label
                                            htmlFor="productImage"
                                            className="absolute bottom-3 left-3 cursor-pointer rounded-lg bg-white/95 px-3 py-1.5 text-xs font-semibold text-gray-800 shadow hover:bg-white"
                                        >
                                            Change image
                                        </label>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="productImage"
                                        className="group flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-tertiary/60 bg-slate-50/70 p-4 text-center transition hover:border-primary/60 hover:bg-primary/[0.03]"
                                    >
                                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary transition group-hover:scale-105">
                                            <Upload size={20} />
                                        </div>

                                        <p className="text-sm font-bold text-gray-900">
                                            Upload thumbnail
                                        </p>

                                        <p className="mt-1 text-xs text-secondary/70">
                                            PNG, JPG or WEBP
                                        </p>
                                    </label>
                                )}
                            </div>

                            {/* Product Gallery */}
                            <div className="min-w-0">
                                <label className={labelClass}>
                                    Product Gallery
                                    <span className="ml-2 text-xs font-normal text-secondary/70">
                                        ({gallery.length} images)
                                    </span>
                                </label>

                                <input
                                    type="file"
                                    id="productGallery"
                                    name="productGallery"
                                    accept="image/*"
                                    multiple
                                    onChange={handleGalleryChange}
                                    className="sr-only"
                                />

                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {galleryPreviews.map(
                                        ({ file, url }, index) => (
                                            <div
                                                key={`${file.name}-${file.lastModified}-${index}`}
                                                className="group relative aspect-square overflow-hidden rounded-xl border border-tertiary/40 bg-slate-50"
                                            >
                                                <img
                                                    src={url}
                                                    alt={`Gallery image ${index + 1}`}
                                                    className="h-full w-full object-cover"
                                                />

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        removeGalleryImage(index)
                                                    }
                                                    aria-label={`Remove gallery image ${index + 1}`}
                                                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white/95 text-rose-600 shadow transition hover:bg-rose-50"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )
                                    )}

                                    <label
                                        htmlFor="productGallery"
                                        className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-tertiary/60 bg-slate-50/70 p-3 text-center transition hover:border-primary/60 hover:bg-primary/[0.03]"
                                    >
                                        <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                            <Plus size={20} />
                                        </div>

                                        <span className="text-xs font-bold text-gray-900">
                                            Add images
                                        </span>

                                        <span className="mt-1 text-[11px] text-secondary/70">
                                            Select multiple
                                        </span>
                                    </label>
                                </div>

                                {gallery.length === 0 && (
                                    <p className="mt-2 text-xs text-secondary/70">
                                        Your selected gallery images will appear here.
                                    </p>
                                )}
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

                    {/* Pricing & Variants */}
                    <section className={sectionClass}>
                        {heading(
                            DollarSign,
                            'Pricing & Variants',
                        )}

                        <div className="space-y-3">
                            {variants.map((variant, index) => (
                                <div
                                    key={index}
                                    className="grid grid-cols-1 items-end gap-3 rounded-xl border border-tertiary/40 bg-slate-50/50 p-3 sm:grid-cols-[1fr_1fr_1fr_auto]"
                                >
                                    {/* Quantity */}
                                    <div className="min-w-0">
                                        <label
                                            htmlFor={`quantity-${index}`}
                                            className={labelClass}
                                        >
                                            Quantity
                                            <span className="ml-1 text-rose-500">*</span>
                                        </label>

                                        <input
                                            type="number"
                                            id={`quantity-${index}`}
                                            value={variant.quantity}
                                            onChange={(e) =>
                                                updateVariant(
                                                    index,
                                                    'quantity',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="e.g. 500"
                                            className={inputClass}
                                            required
                                            min="0"
                                            step="any"
                                        />
                                    </div>

                                    {/* Unit */}
                                    <div className="min-w-0">
                                        <label
                                            htmlFor={`unit-${index}`}
                                            className={labelClass}
                                        >
                                            Unit
                                            <span className="ml-1 text-rose-500">*</span>
                                        </label>

                                        <div className="relative">
                                            <select
                                                id={`unit-${index}`}
                                                value={variant.unit}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'unit',
                                                        e.target.value
                                                    )
                                                }
                                                className={`${inputClass} appearance-none pr-9`}
                                                required
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

                                            <ChevronDown
                                                size={15}
                                                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-secondary/60"
                                            />
                                        </div>
                                    </div>

                                    {/* Price */}
                                    <div className="min-w-0">
                                        <label
                                            htmlFor={`price-${index}`}
                                            className={labelClass}
                                        >
                                            Price (₹)
                                            <span className="ml-1 text-rose-500">*</span>
                                        </label>

                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-secondary/70">
                                                ₹
                                            </span>

                                            <input
                                                type="number"
                                                id={`price-${index}`}
                                                min="0"
                                                step="0.01"
                                                value={variant.price}
                                                onChange={(e) =>
                                                    updateVariant(
                                                        index,
                                                        'price',
                                                        e.target.value
                                                    )
                                                }
                                                placeholder="0.00"
                                                className={`${inputClass} pl-8`}
                                                required
                                            />
                                        </div>
                                    </div>
                                     {/* Stock */}
                                    <div className="min-w-0">
                                        <label
                                            htmlFor={`stock-${index}`}
                                            className={labelClass}
                                        >
                                            Stock
                                            <span className="ml-1 text-rose-500">*</span>
                                        </label>

                                        <input
                                            type="number"
                                            id={`stock-${index}`}
                                            value={variant.stock}
                                            onChange={(e) =>
                                                updateVariant(
                                                    index,
                                                    'stock',
                                                    e.target.value
                                                )
                                            }
                                            placeholder="0"
                                            className={inputClass}
                                            required
                                            min="0"
                                            step="any"
                                        />
                                    </div>

                                    {/* Remove Variant */}
                                    {variants.length > 1 ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeVariant(index)
                                            }
                                            aria-label={`Remove variant ${index + 1}`}
                                            className="flex h-10 w-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-500 hover:text-white sm:w-10"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    ) : (
                                        <div className="hidden sm:block sm:w-10" />
                                    )}
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addVariant}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary/40 px-4 py-2.5 text-sm font-bold text-primary transition hover:bg-primary/5 sm:w-auto"
                            >
                                <Plus size={16} />
                                Add Another Variant
                            </button>
                        </div>
                    </section>

                    {/* Bottom Actions */}
                    <div className="sticky bottom-0 z-10 -mx-3 border-t border-tertiary/40 bg-white/95 px-3 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] backdrop-blur-md sm:-mx-5 sm:px-5 lg:-mx-6 lg:px-6">
                        <div className="mx-auto flex max-w-6xl flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <p className="hidden text-xs font-medium text-secondary/70 md:block">
                                Fields marked with{' '}
                                <span className="text-rose-500">*</span> are required.
                            </p>

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
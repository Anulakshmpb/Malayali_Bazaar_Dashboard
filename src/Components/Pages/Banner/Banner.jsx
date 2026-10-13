import React, { useState, useRef } from 'react';
import {
    Plus,
    Search,
    Edit,
    Trash2,
    X,
    ImagePlus
} from 'lucide-react';

const Cropper = () => (
    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 bg-slate-800">
        <ImagePlus size={32} />
        <span className="text-sm font-medium">Image Cropper Plugin Active</span>
    </div>
);

const ASPECT_RATIO_PRESETS = [
    { label: 'Desktop (4.5:1)', value: 4.5 / 1 },
    { label: 'Mobile (21:9)', value: 21 / 9 },
    { label: 'Square (1:1)', value: 1 }
];

export default function Banner() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBannerId, setEditingBannerId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    const [cropImageSrc, setCropImageSrc] = useState(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [aspect, setAspect] = useState(4.5 / 1);

    const desktopFileInputRef = useRef(null);
    const mobileFileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        desktop_img_url: '',
        mobile_img_url: '',
        tag: '',
        title: '',
        subtitle: '',
        date: '',
        linkText: '',
        link: '',
        type: 'blank',
        whatsapp_number: '',
        whatsappMessage: '',
        title_color: '#ffffff',
        subtitle_color: '#f8fafc',
        tag_color: '#ffffff',
        tag_bg_color: '#ffffff26',
        btn_color: '#1e293b',
        btn_bg_color: '#ffffff',
        status: true
    });

    // Mock Banner Data
    const [banners, setBanners] = useState([
        {
            id: 1,
            desktop_img_url: "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&w=1200&h=300",
            tag: "⚡ Online Exclusive",
            title: "Super Sale 50% Off",
            status: true
        },
        {
            id: 2,
            desktop_img_url: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?auto=format&fit=crop&w=1200&h=300",
            tag: "🔥 Hot Deal",
            title: "Buy 1 Get 1 Free",
            status: false
        }
    ]);

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBannerId(null);
        setCropImageSrc(null);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleDesktopImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, desktop_img_url: URL.createObjectURL(e.target.files[0]) }));
        }
    };

    const handleMobileImageChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData(prev => ({ ...prev, mobile_img_url: URL.createObjectURL(e.target.files[0]) }));
        }
    };

    const handleAdjustDesktopCrop = () => {
        setAspect(4.5 / 1);
        setCropImageSrc(formData.desktop_img_url);
    };

    const handleAdjustMobileCrop = () => {
        setAspect(21 / 9);
        setCropImageSrc(formData.mobile_img_url);
    };

    const onCropComplete = (croppedArea, croppedAreaPixels) => {
        // Handle crop completion
    };

    const handleApplyCrop = () => {
        setCropImageSrc(null);
    };

    const handleSubmit = () => {
        setIsSaving(true);
        setTimeout(() => {
            setIsSaving(false);
            handleCloseModal();
        }, 1000);
    };

    const toggleVisibility = (id) => {
        setBanners(banners.map(b =>
            b.id === id ? { ...b, status: !b.status } : b
        ));
    };

    return (
        <div className="min-h-screen bg-white pb-10 page-container">
            <div className="mx-auto max-w-6xl space-y-6 pt-4">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className='text-left'>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Banners</h1>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-secondary focus:outline-none focus:ring-4 focus:ring-primary/20"
                        >
                            <Plus size={18} />
                            Add Banner
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-tertiary/40 bg-white p-4 shadow-sm">
                    <div className="relative w-full sm:max-w-md">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50" />
                        <input
                            type="text"
                            placeholder="Search banners..."
                            className="w-full rounded-lg border border-tertiary/60 bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-gray-900 outline-none transition-colors placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                        />
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                        Total: {banners.length} Banners
                    </div>
                </div>

                {/* Banners Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {banners.map((banner) => (
                        <div key={banner.id} className="group relative overflow-hidden rounded-2xl border border-tertiary/40 bg-white shadow-sm transition-all hover:shadow-lg hover:border-tertiary/60 flex flex-col">
                            {/* Banner Image */}
                            <div className="relative h-40 w-full overflow-hidden bg-slate-100">
                                <img
                                    src={banner.desktop_img_url}
                                    alt={banner.title}
                                    className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${!banner.status ? 'grayscale opacity-70' : ''}`}
                                />
                                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                    <button
                                        onClick={() => {
                                            setFormData(prev => ({ ...prev, ...banner }));
                                            setEditingBannerId(banner.id);
                                            setIsModalOpen(true);
                                        }}
                                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-gray-900 shadow-lg backdrop-blur transition hover:bg-white hover:text-primary focus:outline-none"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/95 text-rose-500 shadow-lg backdrop-blur transition hover:bg-rose-50 hover:text-rose-600 focus:outline-none">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            {/* Card Body */}
                            <div className="flex flex-col p-5 flex-1 bg-white">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <span className="inline-flex items-center justify-center rounded-md border border-tertiary/60 bg-slate-50 px-2 py-0.5 text-xs font-bold text-gray-900 shadow-sm mb-2">
                                            {banner.tag}
                                        </span>
                                        <h3 className="text-lg font-bold text-gray-900">{banner.title}</h3>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer mt-1">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={banner.status}
                                            onChange={() => toggleVisibility(banner.id)}
                                        />
                                        <div className="h-6 w-11 rounded-full bg-slate-200 shadow-inner peer-focus:outline-none peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                    </label>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Banner Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200" onClick={handleCloseModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[1072px] overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-tertiary/30 flex items-center justify-between bg-slate-50">
                            <h3 className="text-lg font-bold text-gray-900">{editingBannerId ? 'Edit Banner' : 'Add New Banner'}</h3>
                            <button
                                className="text-secondary hover:text-gray-900 p-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                                onClick={handleCloseModal}
                                type="button"
                                disabled={isSaving}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto" style={{ opacity: isSaving ? 0.6 : 1, pointerEvents: isSaving ? 'none' : 'auto' }}>
                            {cropImageSrc ? (
                                <div className="space-y-6">
                                    <div className="relative w-full h-[228px] bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
                                        <Cropper
                                            image={cropImageSrc}
                                            crop={crop}
                                            zoom={zoom}
                                            aspect={aspect}
                                            onCropChange={setCrop}
                                            onZoomChange={setZoom}
                                            onCropComplete={onCropComplete}
                                        />
                                    </div>

                                    {/* Aspect Ratio Selector */}
                                    <div className="space-y-2">
                                        <label className="block text-xs font-semibold text-gray-900 uppercase tracking-wider">Aspect Ratio</label>
                                        <div className="flex flex-wrap gap-2">
                                            {ASPECT_RATIO_PRESETS.map((preset) => (
                                                <button
                                                    key={preset.label}
                                                    type="button"
                                                    onClick={() => setAspect(preset.value)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${aspect === preset.value
                                                        ? 'bg-primary border-primary text-white shadow-sm'
                                                        : 'bg-white border-tertiary/60 text-gray-900 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    {preset.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Zoom Slider */}
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-semibold text-gray-900 uppercase tracking-wider">
                                            <span>Zoom</span>
                                            <span>{Math.round(zoom * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min={1}
                                            max={3}
                                            step={0.1}
                                            value={zoom}
                                            onChange={(e) => setZoom(parseFloat(e.target.value))}
                                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-primary"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Desktop Image Slot */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-900">
                                                Desktop Banner Image <span className="text-rose-500">*</span>
                                            </label>
                                            {formData.desktop_img_url ? (
                                                <div className="space-y-3">
                                                    <div className="relative w-full aspect-[4.5/1] rounded-xl overflow-hidden border border-tertiary/60 shadow-sm">
                                                        <img
                                                            src={formData.desktop_img_url}
                                                            alt="desktop preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => desktopFileInputRef.current?.click()}
                                                            className="flex-1 py-2 rounded-lg text-xs font-bold border border-tertiary/60 bg-white text-gray-900 shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <ImagePlus size={14} />
                                                            Change
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleAdjustDesktopCrop}
                                                            className="flex-1 py-2 rounded-lg text-xs font-bold border border-tertiary/60 bg-white text-gray-900 shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Edit size={14} />
                                                            Crop
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="border-2 border-dashed border-tertiary/60 rounded-xl p-6 text-center cursor-pointer hover:bg-primary/5 hover:border-primary/60 transition-colors w-full aspect-[4.5/1] flex flex-col items-center justify-center gap-1 text-secondary"
                                                    onClick={() => desktopFileInputRef.current?.click()}
                                                >
                                                    <ImagePlus size={28} className="text-secondary/70 mb-1" />
                                                    <span className="text-xs font-bold text-gray-900">Upload Desktop Banner</span>
                                                    <span className="text-[10px] font-semibold">(4.5:1 ratio)</span>
                                                </div>
                                            )}
                                            <input
                                                ref={desktopFileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleDesktopImageChange}
                                            />
                                        </div>

                                        {/* Mobile Image Slot */}
                                        <div className="space-y-2">
                                            <label className="block text-sm font-semibold text-gray-900">
                                                Mobile Banner Image
                                            </label>
                                            {formData.mobile_img_url ? (
                                                <div className="space-y-3">
                                                    <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden border border-tertiary/60 shadow-sm">
                                                        <img
                                                            src={formData.mobile_img_url}
                                                            alt="mobile preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => mobileFileInputRef.current?.click()}
                                                            className="flex-1 py-2 rounded-lg text-xs font-bold border border-tertiary/60 bg-white text-gray-900 shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <ImagePlus size={14} />
                                                            Change
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={handleAdjustMobileCrop}
                                                            className="flex-1 py-2 rounded-lg text-xs font-bold border border-tertiary/60 bg-white text-gray-900 shadow-sm hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                                                        >
                                                            <Edit size={14} />
                                                            Crop
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div
                                                    className="border-2 border-dashed border-tertiary/60 rounded-xl p-6 text-center cursor-pointer hover:bg-primary/5 hover:border-primary/60 transition-colors w-full aspect-[21/9] flex flex-col items-center justify-center gap-1 text-secondary"
                                                    onClick={() => mobileFileInputRef.current?.click()}
                                                >
                                                    <ImagePlus size={28} className="text-secondary/70 mb-1" />
                                                    <span className="text-xs font-bold text-gray-900">Upload Mobile Banner</span>
                                                    <span className="text-[10px] font-semibold">(21:9 or custom)</span>
                                                </div>
                                            )}
                                            <input
                                                ref={mobileFileInputRef}
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleMobileImageChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">Tag</label>
                                            <input type="text" name="tag" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" placeholder="e.g. ⚡ Online Exclusive" value={formData.tag} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">Title</label>
                                            <input type="text" name="title" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" placeholder="e.g. Buy 5 Save 5%" value={formData.title} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">Subtitle</label>
                                            <input type="text" name="subtitle" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" placeholder="e.g. Discounts" value={formData.subtitle} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">Date / Info</label>
                                            <input type="text" name="date" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" placeholder="e.g. Valid till 30th June" value={formData.date} onChange={handleChange} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">Link Text</label>
                                            <input type="text" name="linkText" className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10" placeholder="e.g. Shop Now" value={formData.linkText} onChange={handleChange} />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-semibold text-gray-900 mb-2">Link</label>
                                        <input
                                            type="url"
                                            name="link"
                                            className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                            placeholder="https://example.com"
                                            value={formData.link}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">Type</label>
                                            <select
                                                name="type"
                                                value={formData.type}
                                                onChange={handleChange}
                                                className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-bold text-gray-900 outline-none transition focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                            >
                                                <option value="blank">Blank</option>
                                                <option value="link">Link</option>
                                                <option value="whatsapp">WhatsApp</option>
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">WhatsApp Number</label>
                                            <input
                                                type="tel"
                                                name="whatsapp_number"
                                                className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10 disabled:opacity-50"
                                                placeholder="+91"
                                                value={formData.whatsapp_number}
                                                maxLength={13}
                                                disabled={formData.type !== 'whatsapp'}
                                                onChange={(e) => {
                                                    let val = e.target.value;
                                                    if (!val.startsWith('+91')) val = '+91';
                                                    let numberPart = val.substring(3).replace(/\D/g, '');
                                                    if (numberPart.length > 10) numberPart = numberPart.substring(0, 10);
                                                    handleChange({ target: { name: 'whatsapp_number', value: '+91' + numberPart, type: 'tel' } });
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {formData.type === 'whatsapp' && (
                                        <div>
                                            <label className="block text-sm font-semibold text-gray-900 mb-2">WhatsApp Message</label>
                                            <input
                                                type="text"
                                                name="whatsappMessage"
                                                className="w-full rounded-lg border border-tertiary/60 bg-slate-50 px-4 py-2.5 text-sm font-medium text-gray-900 outline-none transition placeholder:text-secondary/50 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/10"
                                                placeholder="e.g. Hi, I'm interested!"
                                                value={formData.whatsappMessage}
                                                onChange={handleChange}
                                            />
                                        </div>
                                    )}

                                    <div className="bg-slate-50 p-5 rounded-xl border border-tertiary/40 space-y-4">
                                        <h4 className="text-sm font-bold text-gray-900">Banner Colors Styling</h4>
                                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                            {[
                                                { label: 'Title Color', name: 'title_color' },
                                                { label: 'Subtitle Color', name: 'subtitle_color' },
                                                { label: 'Tag Color', name: 'tag_color' },
                                                { label: 'Tag BG', name: 'tag_bg_color' },
                                                { label: 'Button Color', name: 'btn_color' },
                                                { label: 'Button BG', name: 'btn_bg_color' }
                                            ].map(colorField => (
                                                <div key={colorField.name}>
                                                    <label className="block text-[11px] font-bold text-secondary uppercase tracking-wider mb-2">
                                                        {colorField.label}
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="color"
                                                            name={colorField.name}
                                                            className="w-10 h-10 p-0.5 rounded-lg border border-tertiary/60 cursor-pointer bg-white"
                                                            value={formData[colorField.name]}
                                                            onChange={handleChange}
                                                        />
                                                        <span className="text-[10px] font-bold uppercase text-gray-900">{formData[colorField.name]}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {cropImageSrc ? (
                            <div className="px-6 py-4 bg-slate-50 border-t border-tertiary/30 flex items-center justify-end gap-3">
                                <button
                                    className="rounded-lg px-4 py-2.5 text-sm font-bold text-gray-900 bg-white border border-tertiary/60 transition hover:bg-slate-100 shadow-sm"
                                    onClick={() => setCropImageSrc(null)}
                                    type="button"
                                >
                                    Cancel Crop
                                </button>
                                <button
                                    className="rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary"
                                    onClick={handleApplyCrop}
                                    type="button"
                                >
                                    Apply Crop
                                </button>
                            </div>
                        ) : (
                            <div className="px-6 py-4 bg-slate-50 border-t border-tertiary/30 flex items-center justify-end gap-3">
                                <button
                                    className="rounded-lg px-4 py-2.5 text-sm font-bold text-gray-900 transition hover:bg-slate-200"
                                    onClick={handleCloseModal}
                                    disabled={isSaving}
                                    type="button"
                                >
                                    Cancel
                                </button>
                                <button
                                    className="flex items-center gap-2 rounded-lg bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-primary active:scale-95 disabled:bg-slate-300 disabled:text-slate-500"
                                    onClick={handleSubmit}
                                    disabled={(!formData.desktop_img_url && !formData.mobile_img_url) || isSaving}
                                >
                                    {isSaving ? 'Saving...' : (editingBannerId ? 'Update Banner' : 'Save Banner')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

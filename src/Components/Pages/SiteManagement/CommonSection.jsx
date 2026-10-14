import React, { useState } from 'react';
import {
    Truck,
    HelpCircle,
    Headphones,
    RotateCcw,
    Store,
    Plus,
    Trash2,
    Save,
    Eye,
    EyeOff,
    ChevronUp,
    ChevronDown,
    Mail,
    Phone,
    MessageCircle,
    MapPin,
    Clock,
} from 'lucide-react';

/* -------------------------------------------------------------------------- */
/*  Page registry – add a page here and it shows up in the list                */
/*  type: 'sections' = heading + text blocks | 'faq' = Q&A | 'contact'         */
/* -------------------------------------------------------------------------- */
const PAGES = [
    { slug: 'delivery-info', label: 'Delivery Information', group: 'Pages', icon: Truck, type: 'sections' },
    { slug: 'faqs', label: 'FAQs', group: 'Pages', icon: HelpCircle, type: 'faq' },
    { slug: 'contact', label: 'Contact Support', group: 'Pages', icon: Headphones, type: 'contact' },
    { slug: 'returns', label: 'Returns', group: 'Pages', icon: RotateCcw, type: 'sections' },
    { slug: 'about', label: 'About Malayali Bazar', group: 'Company', icon: Store, type: 'sections' },
];

/* Sample content only so the screen looks filled – replace with real data later */
const INITIAL = {
    'delivery-info': {
        title: 'Delivery Information',
        subtitle: 'Everything about how we deliver your groceries.',
        published: true,
        sections: [
            { heading: 'Delivery areas', body: 'We deliver across the town and nearby areas.' },
            { heading: 'Delivery charges', body: 'Free delivery on orders above the minimum amount.\nA small fee applies on smaller orders.' },
        ],
    },
    faqs: {
        title: 'Frequently Asked Questions',
        subtitle: 'Quick answers to common questions.',
        published: true,
        faqs: [
            { q: 'How do I place an order?', a: 'Add items to your cart and check out.' },
            { q: 'Which payment methods do you accept?', a: 'Cash on delivery and online payments.' },
        ],
    },
    contact: {
        title: 'Contact Support',
        subtitle: 'We are happy to help.',
        published: true,
        email: '',
        phone: '',
        whatsapp: '',
        hours: '',
        address: '',
        mapLink: '',
    },
    returns: {
        title: 'Returns',
        subtitle: 'Our return and refund policy.',
        published: true,
        sections: [{ heading: 'Return window', body: '' }],
    },
    about: {
        title: 'About Malayali Bazar',
        subtitle: 'Fresh groceries, delivered with care.',
        published: true,
        sections: [{ heading: 'Our story', body: '' }],
    },
};

/* -------------------------------------------------------------------------- */
/*  Shared UI pieces                                                           */
/* -------------------------------------------------------------------------- */
const inputCls =
    'w-full px-3 py-2.5 bg-white border border-tertiary/60 rounded-xl text-sm text-gray-900 placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors';

function Field({ label, hint, children }) {
    return (
        <label className="block">
            <span className="text-xs font-bold text-secondary/70 uppercase tracking-wide">{label}</span>
            <div className="mt-1.5">{children}</div>
            {hint && <span className="text-[11px] text-secondary/50 mt-1 block">{hint}</span>}
        </label>
    );
}

function Card({ title, icon: Icon, action, children }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {Icon && <Icon size={20} className="text-secondary" />}
                    {title}
                </h2>
                {action}
            </div>
            {children}
        </div>
    );
}

function IconBtn({ onClick, disabled, danger, title, children }) {
    return (
        <button
            type="button"
            title={title}
            onClick={onClick}
            disabled={disabled}
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${danger ? 'text-rose-500 hover:bg-rose-50' : 'text-secondary hover:bg-slate-100'
                }`}
        >
            {children}
        </button>
    );
}

function ItemHeader({ label, index, total, onUp, onDown, onDelete }) {
    return (
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-secondary/70">{label} {index + 1}</span>
            <div className="flex items-center">
                <IconBtn title="Move up" onClick={onUp} disabled={index === 0}><ChevronUp size={16} /></IconBtn>
                <IconBtn title="Move down" onClick={onDown} disabled={index === total - 1}><ChevronDown size={16} /></IconBtn>
                <IconBtn title="Delete" danger onClick={onDelete}><Trash2 size={16} /></IconBtn>
            </div>
        </div>
    );
}

/* Helpers for editing an array inside the page content (local state only) */
function listOps(content, onChange, key) {
    const list = content[key] || [];
    const set = (next) => onChange({ ...content, [key]: next });
    return {
        list,
        update: (i, patch) => set(list.map((it, idx) => (idx === i ? { ...it, ...patch } : it))),
        add: (blank) => set([...list, blank]),
        remove: (i) => set(list.filter((_, idx) => idx !== i)),
        move: (i, dir) => {
            const j = i + dir;
            if (j < 0 || j >= list.length) return;
            const copy = [...list];
            [copy[i], copy[j]] = [copy[j], copy[i]];
            set(copy);
        },
    };
}

/* -------------------------------------------------------------------------- */
/*  Editors                                                                    */
/* -------------------------------------------------------------------------- */
function SectionsEditor({ content, onChange }) {
    const ops = listOps(content, onChange, 'sections');
    return (
        <Card
            title="Content Sections"
            action={
                <button type="button" onClick={() => ops.add({ heading: '', body: '' })} className="text-xs text-gray-900 font-semibold hover:underline flex items-center gap-1">
                    <Plus size={14} /> Add Section
                </button>
            }
        >
            <div className="flex flex-col gap-3">
                {ops.list.map((s, i) => (
                    <div key={i} className="p-4 rounded-xl border border-tertiary/30 hover:border-tertiary/60 transition-colors">
                        <ItemHeader label="Section" index={i} total={ops.list.length} onUp={() => ops.move(i, -1)} onDown={() => ops.move(i, 1)} onDelete={() => ops.remove(i)} />
                        <div className="space-y-3">
                            <input className={inputCls} placeholder="Heading" value={s.heading} onChange={(e) => ops.update(i, { heading: e.target.value })} />
                            <textarea rows={4} className={`${inputCls} resize-y`} placeholder="Write the content. Press Enter for a new paragraph." value={s.body} onChange={(e) => ops.update(i, { body: e.target.value })} />
                        </div>
                    </div>
                ))}
                {ops.list.length === 0 && <p className="text-sm text-secondary/60">No sections yet. Add the first one.</p>}
            </div>
        </Card>
    );
}

function FaqEditor({ content, onChange }) {
    const ops = listOps(content, onChange, 'faqs');
    return (
        <Card
            title="Questions & Answers"
            action={
                <button type="button" onClick={() => ops.add({ q: '', a: '' })} className="text-xs text-gray-900 font-semibold hover:underline flex items-center gap-1">
                    <Plus size={14} /> Add Question
                </button>
            }
        >
            <div className="flex flex-col gap-3">
                {ops.list.map((f, i) => (
                    <div key={i} className="p-4 rounded-xl border border-tertiary/30 hover:border-tertiary/60 transition-colors">
                        <ItemHeader label="Question" index={i} total={ops.list.length} onUp={() => ops.move(i, -1)} onDown={() => ops.move(i, 1)} onDelete={() => ops.remove(i)} />
                        <div className="space-y-3">
                            <input className={inputCls} placeholder="Question" value={f.q} onChange={(e) => ops.update(i, { q: e.target.value })} />
                            <textarea rows={3} className={`${inputCls} resize-y`} placeholder="Answer" value={f.a} onChange={(e) => ops.update(i, { a: e.target.value })} />
                        </div>
                    </div>
                ))}
                {ops.list.length === 0 && <p className="text-sm text-secondary/60">No questions yet. Add the first one.</p>}
            </div>
        </Card>
    );
}

function ContactEditor({ content, onChange }) {
    const set = (k) => (e) => onChange({ ...content, [k]: e.target.value });
    const iconCls = 'absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50';
    return (
        <Card title="Contact Details" icon={Headphones}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Support email">
                    <div className="relative"><Mail size={16} className={iconCls} />
                        <input className={`${inputCls} pl-9`} placeholder="support@example.com" value={content.email} onChange={set('email')} /></div>
                </Field>
                <Field label="Phone">
                    <div className="relative"><Phone size={16} className={iconCls} />
                        <input className={`${inputCls} pl-9`} placeholder="+91 98765 43210" value={content.phone} onChange={set('phone')} /></div>
                </Field>
                <Field label="WhatsApp number" hint="Digits with country code">
                    <div className="relative"><MessageCircle size={16} className={iconCls} />
                        <input className={`${inputCls} pl-9`} placeholder="919876543210" value={content.whatsapp} onChange={set('whatsapp')} /></div>
                </Field>
                <Field label="Working hours">
                    <div className="relative"><Clock size={16} className={iconCls} />
                        <input className={`${inputCls} pl-9`} placeholder="Mon – Sat, 9 AM – 8 PM" value={content.hours} onChange={set('hours')} /></div>
                </Field>
                <div className="md:col-span-2">
                    <Field label="Store address">
                        <textarea rows={2} className={`${inputCls} resize-y`} placeholder="Shop address" value={content.address} onChange={set('address')} />
                    </Field>
                </div>
                <div className="md:col-span-2">
                    <Field label="Google Maps link (optional)">
                        <div className="relative"><MapPin size={16} className={iconCls} />
                            <input className={`${inputCls} pl-9`} placeholder="https://maps.google.com/..." value={content.mapLink} onChange={set('mapLink')} /></div>
                    </Field>
                </div>
            </div>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/*  Preview                                                                    */
/* -------------------------------------------------------------------------- */
function Preview({ page, content }) {
    return (
        <Card title="Preview" icon={Eye}>
            <div className="rounded-xl border border-tertiary/30 p-5 bg-slate-50/50 max-h-[560px] overflow-auto">
                <h3 className="text-xl font-bold text-gray-900">{content.title || 'Untitled'}</h3>
                {content.subtitle && <p className="text-sm text-secondary/70 mt-1">{content.subtitle}</p>}

                {page.type === 'sections' &&
                    content.sections.map((s, i) => (
                        <div key={i} className="mt-5">
                            <h4 className="text-sm font-bold text-gray-900">{s.heading}</h4>
                            <p className="text-sm text-secondary/80 mt-1 whitespace-pre-line">{s.body}</p>
                        </div>
                    ))}

                {page.type === 'faq' &&
                    content.faqs.map((f, i) => (
                        <div key={i} className="mt-4 p-3 rounded-xl bg-white border border-tertiary/30">
                            <p className="text-sm font-semibold text-gray-900">{f.q}</p>
                            <p className="text-sm text-secondary/80 mt-1 whitespace-pre-line">{f.a}</p>
                        </div>
                    ))}

                {page.type === 'contact' && (
                    <ul className="mt-5 space-y-2 text-sm text-gray-900">
                        {content.email && <li className="flex items-center gap-2"><Mail size={14} /> {content.email}</li>}
                        {content.phone && <li className="flex items-center gap-2"><Phone size={14} /> {content.phone}</li>}
                        {content.whatsapp && <li className="flex items-center gap-2"><MessageCircle size={14} /> {content.whatsapp}</li>}
                        {content.hours && <li className="flex items-center gap-2"><Clock size={14} /> {content.hours}</li>}
                        {content.address && <li className="flex items-center gap-2"><MapPin size={14} /> {content.address}</li>}
                    </ul>
                )}
            </div>
        </Card>
    );
}

/* -------------------------------------------------------------------------- */
/*  The common page (UI only – edits live in component state, nothing is saved) */
/* -------------------------------------------------------------------------- */
export default function CommonSection() {
    const [activeSlug, setActiveSlug] = useState(PAGES[0].slug);
    const [contents, setContents] = useState(INITIAL);

    const page = PAGES.find((p) => p.slug === activeSlug);
    const content = contents[activeSlug];
    const onChange = (next) => setContents({ ...contents, [activeSlug]: next });

    const Editor = { sections: SectionsEditor, faq: FaqEditor, contact: ContactEditor }[page.type];
    const groups = [...new Set(PAGES.map((p) => p.group))];

    return (
        <div className="min-h-screen bg-white pb-12 page-container">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">                            Website Pages
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center gap-2"
                        >
                            <Save size={16} />
                            Save changes
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Page list */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-3 lg:sticky lg:top-6">
                            {groups.map((g) => (
                                <div key={g} className="mb-2 last:mb-0">
                                    <p className="px-3 pt-2 pb-1 text-xs font-bold text-secondary/70">{g}</p>
                                    {PAGES.filter((p) => p.group === g).map((p) => {
                                        const active = p.slug === activeSlug;
                                        return (
                                            <button
                                                key={p.slug}
                                                type="button"
                                                onClick={() => setActiveSlug(p.slug)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors border ${active
                                                        ? 'bg-primary/10 border-tertiary/40 text-gray-900 font-semibold'
                                                        : 'border-transparent text-secondary hover:bg-slate-50 hover:border-tertiary/30'
                                                    }`}
                                            >
                                                <p.icon size={18} className={active ? 'text-gray-900' : 'text-secondary/70'} />
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Editor + preview */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card
                            title={page.label}
                            icon={page.icon}
                            action={
                                <button
                                    type="button"
                                    onClick={() => onChange({ ...content, published: !content.published })}
                                    className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${content.published ? 'text-emerald-600 bg-emerald-50' : 'text-secondary bg-slate-100'
                                        }`}
                                >
                                    {content.published ? <Eye size={14} /> : <EyeOff size={14} />}
                                    {content.published ? 'Published' : 'Hidden'}
                                </button>
                            }
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Field label="Page title">
                                    <input className={inputCls} value={content.title} onChange={(e) => onChange({ ...content, title: e.target.value })} />
                                </Field>
                                <Field label="Short description">
                                    <input className={inputCls} value={content.subtitle} onChange={(e) => onChange({ ...content, subtitle: e.target.value })} />
                                </Field>
                            </div>
                        </Card>

                        <Editor content={content} onChange={onChange} />
                        <Preview page={page} content={content} />
                    </div>
                </div>
            </div>
        </div>
    );
}
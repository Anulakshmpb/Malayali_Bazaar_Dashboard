import React, { useCallback, useEffect, useState } from 'react';
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
    RefreshCw,
} from 'lucide-react';

import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../Config/Firebase';

const PAGES = [
    {
        slug: 'delivery-info',
        label: 'Delivery Information',
        group: 'Pages',
        icon: Truck,
        type: 'sections',
    },
    {
        slug: 'faqs',
        label: 'FAQs',
        group: 'Pages',
        icon: HelpCircle,
        type: 'faq',
    },
    {
        slug: 'contact',
        label: 'Contact Support',
        group: 'Pages',
        icon: Headphones,
        type: 'contact',
    },
    {
        slug: 'returns',
        label: 'Returns',
        group: 'Pages',
        icon: RotateCcw,
        type: 'sections',
    },
    {
        slug: 'about',
        label: 'About Malayali Bazar',
        group: 'Company',
        icon: Store,
        type: 'sections',
    },
];
const INITIAL = {
    'delivery-info': {
        title: 'Delivery Information',
        subtitle: 'Everything about how we deliver your groceries.',
        published: true,
        sections: [
            {
                heading: 'Delivery areas',
                body: 'We deliver across the town and nearby areas.',
            },
            {
                heading: 'Delivery charges',
                body: 'Free delivery on orders above the minimum amount.\nA small fee applies on smaller orders.',
            },
        ],
    },

    faqs: {
        title: 'Frequently Asked Questions',
        subtitle: 'Quick answers to common questions.',
        published: true,
        faqs: [
            {
                q: 'How do I place an order?',
                a: 'Add items to your cart and check out.',
            },
            {
                q: 'Which payment methods do you accept?',
                a: 'Cash on delivery and online payments.',
            },
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
        sections: [
            {
                heading: 'Return window',
                body: '',
            },
        ],
    },

    about: {
        title: 'About Malayali Bazar',
        subtitle: 'Fresh groceries, delivered with care.',
        published: true,
        sections: [
            {
                heading: 'Our story',
                body: '',
            },
        ],
    },
};

const functions = getFunctions(app, 'europe-west1');

const websiteManagementFunction = httpsCallable(
    functions,
    'manageWebsiteManagement'
);

const callWebsiteManagement = async (type, action, fields = {}) => {
    const response = await websiteManagementFunction({
        type,
        action,
        fields,
    });

    const result = response.data;
    if (!result?.success) {
        throw new Error(
            result?.message || 'Website page operation failed.'
        );
    }

    return result;
};
const inputCls =
    'w-full px-3 py-2.5 bg-white border border-tertiary/60 rounded-xl text-sm text-gray-900 placeholder:text-secondary/40 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors';

function Field({ label, hint, children }) {
    return (
        <label className="block">
            <span className="text-xs font-bold text-secondary/70 uppercase tracking-wide">
                {label}
            </span>

            <div className="mt-1.5">
                {children}
            </div>

            {hint && (
                <span className="text-[11px] text-secondary/50 mt-1 block">
                    {hint}
                </span>
            )}
        </label>
    );
}

function Card({ title, icon: Icon, action, children }) {
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-5 gap-3">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    {Icon && (
                        <Icon size={20} className="text-secondary" />
                    )}
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
            className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${danger
                    ? 'text-rose-500 hover:bg-rose-50'
                    : 'text-secondary hover:bg-slate-100'
                }`}
        >
            {children}
        </button>
    );
}

function ItemHeader({
    label,
    index,
    total,
    onUp,
    onDown,
    onDelete,
}) {
    return (
        <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-secondary/70">
                {label} {index + 1}
            </span>

            <div className="flex items-center">
                <IconBtn
                    title="Move up"
                    onClick={onUp}
                    disabled={index === 0}
                >
                    <ChevronUp size={16} />
                </IconBtn>

                <IconBtn
                    title="Move down"
                    onClick={onDown}
                    disabled={index === total - 1}
                >
                    <ChevronDown size={16} />
                </IconBtn>

                <IconBtn
                    title="Delete"
                    danger
                    onClick={onDelete}
                >
                    <Trash2 size={16} />
                </IconBtn>
            </div>
        </div>
    );
}

function listOps(content, onChange, key) {
    const list = content[key] || [];

    const set = (next) => {
        onChange({
            ...content,
            [key]: next,
        });
    };

    return {
        list,

        update: (index, patch) => {
            set(
                list.map((item, currentIndex) =>
                    currentIndex === index
                        ? { ...item, ...patch }
                        : item
                )
            );
        },

        add: (blank) => {
            set([...list, blank]);
        },

        remove: (index) => {
            set(list.filter((_, currentIndex) => currentIndex !== index));
        },

        move: (index, direction) => {
            const nextIndex = index + direction;

            if (nextIndex < 0 || nextIndex >= list.length) {
                return;
            }

            const copy = [...list];

            [copy[index], copy[nextIndex]] = [
                copy[nextIndex],
                copy[index],
            ];

            set(copy);
        },
    };
}

function SectionsEditor({ content, onChange }) {
    const ops = listOps(content, onChange, 'sections');

    return (
        <Card
            title="Content Sections"
            action={
                <button
                    type="button"
                    onClick={() => ops.add({ heading: '', body: '' })}
                    className="text-xs text-gray-900 font-semibold hover:underline flex items-center gap-1"
                >
                    <Plus size={14} />
                    Add Section
                </button>
            }
        >
            <div className="flex flex-col gap-3">
                {ops.list.map((section, index) => (
                    <div
                        key={index}
                        className="p-4 rounded-xl border border-tertiary/30 hover:border-tertiary/60 transition-colors"
                    >
                        <ItemHeader
                            label="Section"
                            index={index}
                            total={ops.list.length}
                            onUp={() => ops.move(index, -1)}
                            onDown={() => ops.move(index, 1)}
                            onDelete={() => ops.remove(index)}
                        />

                        <div className="space-y-3">
                            <input
                                className={inputCls}
                                placeholder="Heading"
                                value={section.heading ?? ''}
                                onChange={(event) =>
                                    ops.update(index, {
                                        heading: event.target.value,
                                    })
                                }
                            />

                            <textarea
                                rows={4}
                                className={`${inputCls} resize-y`}
                                placeholder="Write the content. Press Enter for a new paragraph."
                                value={section.body ?? ''}
                                onChange={(event) =>
                                    ops.update(index, {
                                        body: event.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                ))}

                {ops.list.length === 0 && (
                    <p className="text-sm text-secondary/60">
                        No sections yet. Add the first one.
                    </p>
                )}
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
                <button
                    type="button"
                    onClick={() => ops.add({ q: '', a: '' })}
                    className="text-xs text-gray-900 font-semibold hover:underline flex items-center gap-1"
                >
                    <Plus size={14} />
                    Add Question
                </button>
            }
        >
            <div className="flex flex-col gap-3">
                {ops.list.map((faq, index) => (
                    <div
                        key={index}
                        className="p-4 rounded-xl border border-tertiary/30 hover:border-tertiary/60 transition-colors"
                    >
                        <ItemHeader
                            label="Question"
                            index={index}
                            total={ops.list.length}
                            onUp={() => ops.move(index, -1)}
                            onDown={() => ops.move(index, 1)}
                            onDelete={() => ops.remove(index)}
                        />

                        <div className="space-y-3">
                            <input
                                className={inputCls}
                                placeholder="Question"
                                value={faq.q ?? ''}
                                onChange={(event) =>
                                    ops.update(index, {
                                        q: event.target.value,
                                    })
                                }
                            />

                            <textarea
                                rows={3}
                                className={`${inputCls} resize-y`}
                                placeholder="Answer"
                                value={faq.a ?? ''}
                                onChange={(event) =>
                                    ops.update(index, {
                                        a: event.target.value,
                                    })
                                }
                            />
                        </div>
                    </div>
                ))}

                {ops.list.length === 0 && (
                    <p className="text-sm text-secondary/60">
                        No questions yet. Add the first one.
                    </p>
                )}
            </div>
        </Card>
    );
}

function ContactEditor({ content, onChange }) {
    const set = (key) => (event) => {
        onChange({
            ...content,
            [key]: event.target.value,
        });
    };

    const iconCls =
        'absolute left-3 top-1/2 -translate-y-1/2 text-secondary/50';

    return (
        <Card title="Contact Details" icon={Headphones}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Support email">
                    <div className="relative">
                        <Mail size={16} className={iconCls} />

                        <input
                            className={`${inputCls} pl-9`}
                            placeholder="support@example.com"
                            value={content.email ?? ''}
                            onChange={set('email')}
                        />
                    </div>
                </Field>

                <Field label="Phone">
                    <div className="relative">
                        <Phone size={16} className={iconCls} />

                        <input
                            className={`${inputCls} pl-9`}
                            placeholder="+91 98765 43210"
                            value={content.phone ?? ''}
                            onChange={set('phone')}
                        />
                    </div>
                </Field>

                <Field
                    label="WhatsApp number"
                    hint="Digits with country code"
                >
                    <div className="relative">
                        <MessageCircle size={16} className={iconCls} />

                        <input
                            className={`${inputCls} pl-9`}
                            placeholder="919876543210"
                            value={content.whatsapp ?? ''}
                            onChange={set('whatsapp')}
                        />
                    </div>
                </Field>

                <Field label="Working hours">
                    <div className="relative">
                        <Clock size={16} className={iconCls} />

                        <input
                            className={`${inputCls} pl-9`}
                            placeholder="Mon – Sat, 9 AM – 8 PM"
                            value={content.hours ?? ''}
                            onChange={set('hours')}
                        />
                    </div>
                </Field>

                <div className="md:col-span-2">
                    <Field label="Store address">
                        <textarea
                            rows={2}
                            className={`${inputCls} resize-y`}
                            placeholder="Shop address"
                            value={content.address ?? ''}
                            onChange={set('address')}
                        />
                    </Field>
                </div>

                <div className="md:col-span-2">
                    <Field label="Google Maps link (optional)">
                        <div className="relative">
                            <MapPin size={16} className={iconCls} />

                            <input
                                className={`${inputCls} pl-9`}
                                placeholder="https://maps.google.com/..."
                                value={content.mapLink ?? ''}
                                onChange={set('mapLink')}
                            />
                        </div>
                    </Field>
                </div>
            </div>
        </Card>
    );
}

function Preview({ page, content }) {
    const sections = content.sections || [];
    const faqs = content.faqs || [];

    return (
        <Card title="Preview" icon={Eye}>
            <div className="rounded-xl border border-tertiary/30 p-5 bg-slate-50/50 max-h-[560px] overflow-auto">
                <h3 className="text-xl font-bold text-gray-900">
                    {content.title || 'Untitled'}
                </h3>

                {content.subtitle && (
                    <p className="text-sm text-secondary/70 mt-1">
                        {content.subtitle}
                    </p>
                )}

                {page.type === 'sections' &&
                    sections.map((section, index) => (
                        <div key={index} className="mt-5">
                            <h4 className="text-sm font-bold text-gray-900">
                                {section.heading}
                            </h4>

                            <p className="text-sm text-secondary/80 mt-1 whitespace-pre-line">
                                {section.body}
                            </p>
                        </div>
                    ))}

                {page.type === 'faq' &&
                    faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="mt-4 p-3 rounded-xl bg-white border border-tertiary/30"
                        >
                            <p className="text-sm font-semibold text-gray-900">
                                {faq.q}
                            </p>

                            <p className="text-sm text-secondary/80 mt-1 whitespace-pre-line">
                                {faq.a}
                            </p>
                        </div>
                    ))}

                {page.type === 'contact' && (
                    <ul className="mt-5 space-y-2 text-sm text-gray-900">
                        {content.email && (
                            <li className="flex items-center gap-2">
                                <Mail size={14} />
                                {content.email}
                            </li>
                        )}

                        {content.phone && (
                            <li className="flex items-center gap-2">
                                <Phone size={14} />
                                {content.phone}
                            </li>
                        )}

                        {content.whatsapp && (
                            <li className="flex items-center gap-2">
                                <MessageCircle size={14} />
                                {content.whatsapp}
                            </li>
                        )}

                        {content.hours && (
                            <li className="flex items-center gap-2">
                                <Clock size={14} />
                                {content.hours}
                            </li>
                        )}

                        {content.address && (
                            <li className="flex items-center gap-2">
                                <MapPin size={14} />
                                {content.address}
                            </li>
                        )}
                    </ul>
                )}

                {!content.published && (
                    <p className="mt-5 text-xs font-semibold text-amber-700">
                        This page is hidden and marked as unpublished.
                    </p>
                )}
            </div>
        </Card>
    );
}

export default function CommonSection() {
    const [activeSlug, setActiveSlug] = useState(PAGES[0].slug);
    const [contents, setContents] = useState(INITIAL);
    const [existingPages, setExistingPages] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('success');

    const page = PAGES.find((item) => item.slug === activeSlug);
    const content = contents[activeSlug] || INITIAL[activeSlug];

    const groups = [...new Set(PAGES.map((item) => item.group))];

    const Editor = {
        sections: SectionsEditor,
        faq: FaqEditor,
        contact: ContactEditor,
    }[page.type];

    const loadPages = useCallback(async () => {
        setLoading(true);
        setMessage('');

        try {
            const result = await callWebsiteManagement(
                'delivery-info',
                'list'
            );

            const savedPages = Array.isArray(result.data)
                ? result.data
                : [];

            const nextContents = { ...INITIAL };
            const nextExistingPages = [];

            savedPages.forEach((savedPage) => {
                const slug = savedPage.slug || savedPage.id;

                if (!INITIAL[slug]) {
                    return;
                }

                nextContents[slug] = {
                    ...INITIAL[slug],
                    ...savedPage,
                };

                nextExistingPages.push(slug);
            });

            setContents(nextContents);
            setExistingPages(nextExistingPages);
        } catch (error) {
            console.error('Failed to load website pages:', error);

            setMessage(
                error.message || 'Failed to load website pages.'
            );
            setMessageType('error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadPages();
    }, [loadPages]);

    const onChange = (nextContent) => {
        setContents((previous) => ({
            ...previous,
            [activeSlug]: nextContent,
        }));
        setMessage('');
    };

    const handleSave = async () => {
        if (saving || loading) {
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const pageExists = existingPages.includes(activeSlug);
            const {
                id,
                slug,
                pageLabel,
                createdAt,
                updatedAt,
                ...formFields
            } = content;

            const action = pageExists ? 'update' : 'add';

            const result = await callWebsiteManagement(
                activeSlug,
                action,
                formFields
            );

            setExistingPages((previous) =>
                previous.includes(activeSlug)
                    ? previous
                    : [...previous, activeSlug]
            );
            if (result.data) {
                setContents((previous) => ({
                    ...previous,
                    [activeSlug]: {
                        ...previous[activeSlug],
                        ...result.data,
                    },
                }));
            }

            setMessage(
                result.message || `${page.label} saved successfully.`
            );
            setMessageType('success');
        } catch (error) {
            console.error('Failed to save website page:', error);

            setMessage(
                error.message || `Failed to save ${page.label}.`
            );
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };
    const handleDelete = async () => {
        if (saving || loading) {
            return;
        }

        if (!existingPages.includes(activeSlug)) {
            setMessage('This page has not been saved yet.');
            setMessageType('error');
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to delete "${page.label}" from Firestore?`
        );

        if (!confirmed) {
            return;
        }

        setSaving(true);
        setMessage('');

        try {
            const result = await callWebsiteManagement(
                activeSlug,
                'delete'
            );

            setExistingPages((previous) =>
                previous.filter((slug) => slug !== activeSlug)
            );
            setContents((previous) => ({
                ...previous,
                [activeSlug]: INITIAL[activeSlug],
            }));

            setMessage(
                result.message || `${page.label} deleted successfully.`
            );
            setMessageType('success');
        } catch (error) {
            console.error('Failed to delete website page:', error);

            setMessage(
                error.message || `Failed to delete ${page.label}.`
            );
            setMessageType('error');
        } finally {
            setSaving(false);
        }
    };
    return (
        <div className="min-h-screen bg-white pb-12 page-container">
            <div className="max-w-7xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Website Pages
                        </h1>

                        <p className="text-sm text-secondary/60 mt-2">
                            Manage your website content, FAQs and contact details.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={loadPages}
                            disabled={loading || saving}
                            className="px-4 py-2 border border-tertiary/50 text-gray-900 rounded-xl text-sm font-medium hover:bg-slate-50 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                            <RefreshCw
                                size={16}
                                className={loading ? 'animate-spin' : ''}
                            />
                            Refresh
                        </button>

                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={loading || saving}
                            className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save changes'}
                        </button>
                    </div>
                </div>

                {/* Success / error feedback */}
                {message && (
                    <div
                        role="status"
                        className={`rounded-xl px-4 py-3 text-sm border ${messageType === 'error'
                                ? 'bg-rose-50 border-rose-200 text-rose-700'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                    >
                        {message}
                    </div>
                )}

                {loading ? (
                    <div className="flex items-center justify-center min-h-[300px]">
                        <div className="text-center">
                            <RefreshCw
                                size={28}
                                className="animate-spin mx-auto text-secondary"
                            />
                            <p className="text-sm text-secondary/70 mt-3">
                                Loading website pages...
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                        {/* Page navigation */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-tertiary/40 p-3 lg:sticky lg:top-6">
                                {groups.map((group) => (
                                    <div
                                        key={group}
                                        className="mb-2 last:mb-0"
                                    >
                                        <p className="px-3 pt-2 pb-1 text-xs font-bold text-secondary/70">
                                            {group}
                                        </p>

                                        {PAGES.filter(
                                            (item) => item.group === group
                                        ).map((item) => {
                                            const active =
                                                item.slug === activeSlug;

                                            const PageIcon = item.icon;
                                            const exists =
                                                existingPages.includes(item.slug);

                                            return (
                                                <button
                                                    key={item.slug}
                                                    type="button"
                                                    onClick={() => {
                                                        setActiveSlug(item.slug);
                                                        setMessage('');
                                                    }}
                                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors border ${active
                                                            ? 'bg-primary/10 border-tertiary/40 text-gray-900 font-semibold'
                                                            : 'border-transparent text-secondary hover:bg-slate-50 hover:border-tertiary/30'
                                                        }`}
                                                >
                                                    <PageIcon
                                                        size={18}
                                                        className={
                                                            active
                                                                ? 'text-gray-900'
                                                                : 'text-secondary/70'
                                                        }
                                                    />

                                                    <span className="flex-1">
                                                        {item.label}
                                                    </span>

                                                    <span
                                                        title={
                                                            exists
                                                                ? 'Saved in Firestore'
                                                                : 'Not saved yet'
                                                        }
                                                        className={`w-2 h-2 rounded-full shrink-0 ${exists
                                                                ? 'bg-emerald-500'
                                                                : 'bg-slate-300'
                                                            }`}
                                                    />
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}

                                <div className="mt-4 px-3 pb-2 flex items-center gap-2 text-[11px] text-secondary/60">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                                    Saved
                                    <span className="w-2 h-2 rounded-full bg-slate-300 ml-2" />
                                    Not saved
                                </div>
                            </div>
                        </div>

                        {/* Editor and preview */}
                        <div className="lg:col-span-3 space-y-6">
                            <Card
                                title={page.label}
                                icon={page.icon}
                                action={
                                    <button
                                        type="button"
                                        onClick={() =>
                                            onChange({
                                                ...content,
                                                published: !content.published,
                                            })
                                        }
                                        className={`text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 transition-colors ${content.published
                                                ? 'text-emerald-600 bg-emerald-50'
                                                : 'text-secondary bg-slate-100'
                                            }`}
                                    >
                                        {content.published ? (
                                            <Eye size={14} />
                                        ) : (
                                            <EyeOff size={14} />
                                        )}

                                        {content.published
                                            ? 'Published'
                                            : 'Hidden'}
                                    </button>
                                }
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="Page title">
                                        <input
                                            className={inputCls}
                                            value={content.title ?? ''}
                                            onChange={(event) =>
                                                onChange({
                                                    ...content,
                                                    title: event.target.value,
                                                })
                                            }
                                        />
                                    </Field>

                                    <Field label="Short description">
                                        <input
                                            className={inputCls}
                                            value={content.subtitle ?? ''}
                                            onChange={(event) =>
                                                onChange({
                                                    ...content,
                                                    subtitle: event.target.value,
                                                })
                                            }
                                        />
                                    </Field>
                                </div>

                                <p className="text-xs text-secondary/50 mt-4">
                                    Page slug:{' '}
                                    <span className="font-semibold">
                                        {activeSlug}
                                    </span>
                                </p>
                            </Card>

                            <Editor
                                content={content}
                                onChange={onChange}
                            />

                            <Preview
                                page={page}
                                content={content}
                            />

                            {/* Page actions */}
                            <div className="flex flex-col sm:flex-row justify-between gap-3">
                                <p className="text-xs text-secondary/60 self-center">
                                    {existingPages.includes(activeSlug)
                                        ? 'This page is saved in Firestore.'
                                        : 'This page has not been saved yet.'}
                                </p>

                                <div className="flex gap-3">
                                    {existingPages.includes(activeSlug) && (
                                        <button
                                            type="button"
                                            onClick={handleDelete}
                                            disabled={saving}
                                            className="px-4 py-2 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-50 disabled:opacity-50 transition-colors flex items-center gap-2"
                                        >
                                            <Trash2 size={16} />
                                            Delete page
                                        </button>
                                    )}

                                    <button
                                        type="button"
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors flex items-center gap-2"
                                    >
                                        <Save size={16} />
                                        {saving
                                            ? 'Saving...'
                                            : 'Save this page'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

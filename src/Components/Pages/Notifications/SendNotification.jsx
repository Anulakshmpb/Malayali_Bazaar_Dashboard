import React, { useEffect, useMemo, useState } from "react";
import {
    Send,
    Bell,
    UserRound,
    Users,
    Search,
    FileText,
    MapPin,
    Smartphone,
    Globe,
    X,
    CheckCircle2
} from "lucide-react";
import {
    collection,
    getDocs,
    query,
    where
} from "firebase/firestore";
import {
    getFunctions,
    httpsCallable
} from "firebase/functions";
import { toast } from "sonner";
import { app, db } from "../../Config/Firebase";

const functions = getFunctions(app, "europe-west1");

const sendPushNotificationCallable = httpsCallable(
    functions,
    "sendPushNotification"
);

const AUDIENCES = [
    {
        value: "all_users",
        label: "All users",
        description: "All registered customers",
        icon: Users
    },
    {
        value: "all_android_users",
        label: "All Android users",
        description: "Customers with Android devices",
        icon: Smartphone
    },
    {
        value: "all_ios_users",
        label: "All iOS users",
        description: "Customers with iOS devices",
        icon: Smartphone
    },
    {
        value: "all_web_users",
        label: "All web users",
        description: "Customers with web browsers",
        icon: Globe
    },
    {
        value: "under_5_km",
        label: "Under 5 km",
        description: "Customers within 5 km of your shop",
        icon: MapPin
    }
];

const DEFAULT_FORM = {
    targetType: "token",
    audience: "",
    templateId: "",
    // orderId: "",
    // url: "/"
};

// Extract {{variable_name}} placeholders.
const extractVariables = (content) => {
    const matches = content.match(
        /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g
    ) || [];

    return [
        ...new Set(
            matches.map((item) =>
                item.replace(/[{}]/g, "").trim()
            )
        )
    ];
};

// Replace template variables.
const replaceVariables = (content, variables) => {
    return content.replace(
        /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
        (match, key) => {
            const value = variables[key];

            return value !== undefined && value !== null
                ? String(value)
                : match;
        }
    );
};

export default function SendNotification() {

    const [formData, setFormData] = useState(DEFAULT_FORM);

    const [templates, setTemplates] = useState([]);
    const [customers, setCustomers] = useState([]);

    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState("");

    const [variables, setVariables] = useState({});

    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const updateField = (name, value) => {
        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    const selectedTemplate = useMemo(
        () => templates.find(
            (item) => item.id === formData.templateId
        ),
        [templates, formData.templateId]
    );

    // --------------------------------------------------
    // FETCH CUSTOMERS AND TEMPLATES
    // --------------------------------------------------

    useEffect(() => {

        const fetchData = async () => {

            setLoading(true);

            try {

                const [templateSnapshot, customerSnapshot] =
                    await Promise.all([

                        getDocs(
                            query(
                                collection(db, "notification_templates"),
                                where("status", "==", "Active")
                            )
                        ),

                        getDocs(collection(db, "users"))

                    ]);

                const templateList = templateSnapshot.docs.map(
                    (item) => ({
                        id: item.id,
                        ...item.data()
                    })
                );

                const customerList = customerSnapshot.docs.map(
                    (item) => ({
                        uid: item.id,
                        name: item.data().name || "Unknown customer",
                        email: item.data().email || ""
                    })
                );

                setTemplates(templateList);

                setCustomers(
                    customerList.sort((a, b) =>
                        a.name.localeCompare(b.name)
                    )
                );

            } catch (error) {

                console.error("Notification data error:", error);

                toast.error(
                    "Unable to load customers or notification templates."
                );

            } finally {

                setLoading(false);

            }
        };

        fetchData();

    }, []);

    // --------------------------------------------------
    // CUSTOMER AUTOCOMPLETE
    // --------------------------------------------------

    const filteredCustomers = useMemo(() => {

        const search = customerSearch.trim().toLowerCase();

        if (!search || selectedCustomer) return [];

        return customers
            .filter((customer) =>
                customer.name.toLowerCase().includes(search) ||
                customer.email.toLowerCase().includes(search)
            )
            .slice(0, 8);

    }, [customers, customerSearch, selectedCustomer]);

    const handleCustomerSelect = (customer) => {

        setSelectedCustomer(customer);

        setCustomerSearch(customer.name);

        setVariables((previous) => ({
            ...previous,
            customer_name: customer.name,
            customer_email: customer.email
        }));
    };

    const clearCustomer = () => {

        setSelectedCustomer(null);
        setCustomerSearch("");

        setVariables((previous) => ({
            ...previous,
            customer_name: "",
            customer_email: ""
        }));
    };

    // --------------------------------------------------
    // TARGET TYPE
    // --------------------------------------------------

    const handleTargetChange = (targetType) => {

        setFormData((previous) => ({
            ...previous,
            targetType,
            audience: ""
        }));

        setSelectedCustomer(null);
        setCustomerSearch("");
    };

    // --------------------------------------------------
    // TEMPLATE SELECTION
    // --------------------------------------------------

    const handleTemplateChange = (templateId) => {

        const template = templates.find(
            (item) => item.id === templateId
        );

        updateField("templateId", templateId);

        if (!template) {
            setVariables({});
            return;
        }

        const keys = extractVariables(
            `${template.title || ""} ${template.message || ""}`
        );

        const initialVariables = {};

        keys.forEach((key) => {

            if (key === "customer_name") {
                initialVariables[key] =
                    selectedCustomer?.name || "";
            } else if (key === "customer_email") {
                initialVariables[key] =
                    selectedCustomer?.email || "";
            } else {
                initialVariables[key] = "";
            }

        });

        setVariables(initialVariables);
    };

    const handleVariableChange = (key, value) => {

        setVariables((previous) => ({
            ...previous,
            [key]: value
        }));
    };

    // --------------------------------------------------
    // TEMPLATE PREVIEW
    // --------------------------------------------------

    const previewTitle = selectedTemplate
        ? replaceVariables(
            selectedTemplate.title || "",
            variables
        )
        : "";

    const previewMessage = selectedTemplate
        ? replaceVariables(
            selectedTemplate.message || "",
            variables
        )
        : "";

    const requiredVariables = selectedTemplate
        ? extractVariables(
            `${selectedTemplate.title || ""} ${selectedTemplate.message || ""}`
        )
        : [];

    const missingVariables = requiredVariables.filter(
        (key) =>
            variables[key] === undefined ||
            variables[key] === null ||
            String(variables[key]).trim() === ""
    );

    // --------------------------------------------------
    // SEND NOTIFICATION
    // --------------------------------------------------

    const handleSubmit = async (event) => {

        event.preventDefault();

        if (formData.targetType === "token" && !selectedCustomer) {
            toast.error("Please select a customer.");
            return;
        }

        if (
            formData.targetType === "topic" &&
            !formData.audience
        ) {
            toast.error("Please select a notification audience.");
            return;
        }

        if (!selectedTemplate) {
            toast.error("Please select a notification template.");
            return;
        }

        if (missingVariables.length > 0) {
            toast.error(
                `Fill in these template variables: ${missingVariables.join(", ")}`
            );
            return;
        }

        if (
            !formData.url.startsWith("/") ||
            formData.url.startsWith("//")
        ) {
            toast.error("Enter a valid internal navigation URL.");
            return;
        }

        setSending(true);

        try {

            const payload = {
                targetType: formData.targetType,

                ...(formData.targetType === "token"
                    ? {
                        userId: selectedCustomer.uid
                    }
                    : {
                        audience: formData.audience
                    }),

                title: previewTitle,
                body: previewMessage,

                type: selectedTemplate.id || "GENERAL",

                // orderId: formData.orderId.trim() || null,

                // url: formData.url.trim()
            };

            const response =
                await sendPushNotificationCallable(payload);

            const result = response.data;

            if (!result?.success) {
                throw new Error(
                    result?.error || "Unable to send notification."
                );
            }

            const delivery = result.delivery || {};

            if (formData.targetType === "token") {

                if (delivery.totalTokens === 0) {

                    toast.warning(
                        "Notification saved, but this customer has no registered FCM tokens."
                    );

                } else {

                    toast.success(
                        `Notification processed. ${delivery.successCount} device(s) received the FCM request.`
                    );

                }

            } else if (formData.audience === "under_5_km") {

                toast.success(
                    `Nearby notification processed for ${delivery.recipientCount || 0} customer(s).`
                );

            } else {

                toast.success(
                    "Notification broadcast accepted by Firebase Cloud Messaging."
                );

            }

            setFormData(DEFAULT_FORM);
            setSelectedCustomer(null);
            setCustomerSearch("");
            setVariables({});

        } catch (error) {

            console.error("Send notification error:", error);

            toast.error(
                error?.message || "Unable to send notification."
            );

        } finally {

            setSending(false);

        }
    };

    // --------------------------------------------------
    // CLEAR FORM
    // --------------------------------------------------

    const handleClear = () => {

        setFormData(DEFAULT_FORM);
        setSelectedCustomer(null);
        setCustomerSearch("");
        setVariables({});
    };

    // --------------------------------------------------
    // UI
    // --------------------------------------------------

    const inputClass = `
        w-full rounded-xl border border-tertiary/60
        bg-white px-4 py-3 text-sm text-gray-800
        outline-none transition
        focus:border-primary
        focus:ring-4 focus:ring-primary/10
    `;

    const labelClass = `
        mb-2 block text-xs font-semibold
        uppercase tracking-wide text-secondary
    `;

    return (

        <div className="min-h-screen bg-white pb-10">

            <div className="mx-auto max-w-6xl space-y-6 pt-4">

                {/* HEADER */}

                <div>
                    <h1 className="bg-gradient-to-br from-gray-900 to-secondary bg-clip-text text-3xl font-bold text-transparent">
                        Send Notification
                    </h1>

                </div>

                <div className="overflow-hidden rounded-2xl border border-tertiary/60 bg-white shadow-sm">

                    {/* CARD HEADER */}

                    <div className="flex items-center gap-3 border-b border-tertiary/30 bg-slate-50 px-6 py-5">

                        <div className="rounded-xl bg-primary/10 p-2.5">
                            <Bell size={20} className="text-primary" />
                        </div>

                        <div>
                            <h2 className="font-semibold text-gray-900">
                                Notification Composer
                            </h2>

                        </div>

                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-7 p-6 md:p-8"
                    >

                        {/* -------------------------------- */}
                        {/* 1. DELIVERY TYPE */}
                        {/* -------------------------------- */}

                        <section className="space-y-3">

                            <label className={labelClass}>
                                01. Select Delivery Type
                            </label>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                                <button
                                    type="button"
                                    onClick={() => handleTargetChange("token")}
                                    className={`
                                        flex items-center gap-4 rounded-xl border p-4 text-left transition
                                        ${formData.targetType === "token"
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                                            : "border-tertiary/60 hover:border-primary/40"
                                        }
                                    `}
                                >

                                    <div className={`rounded-xl p-3 ${
                                        formData.targetType === "token"
                                            ? "bg-primary text-white"
                                            : "bg-slate-100 text-secondary"
                                    }`}>
                                        <UserRound size={21} />
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            Token
                                        </p>

                                        <p className="mt-1 text-xs text-secondary">
                                            Send to a specific customer
                                        </p>
                                    </div>

                                    {formData.targetType === "token" && (
                                        <CheckCircle2
                                            size={19}
                                            className="ml-auto text-primary"
                                        />
                                    )}

                                </button>

                                <button
                                    type="button"
                                    onClick={() => handleTargetChange("topic")}
                                    className={`
                                        flex items-center gap-4 rounded-xl border p-4 text-left transition
                                        ${formData.targetType === "topic"
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                                            : "border-tertiary/60 hover:border-primary/40"
                                        }
                                    `}
                                >

                                    <div className={`rounded-xl p-3 ${
                                        formData.targetType === "topic"
                                            ? "bg-primary text-white"
                                            : "bg-slate-100 text-secondary"
                                    }`}>
                                        <Users size={21} />
                                    </div>

                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            Topic
                                        </p>

                                        <p className="mt-1 text-xs text-secondary">
                                            Send to a customer audience
                                        </p>
                                    </div>

                                    {formData.targetType === "topic" && (
                                        <CheckCircle2
                                            size={19}
                                            className="ml-auto text-primary"
                                        />
                                    )}

                                </button>

                            </div>

                        </section>

                        {/* -------------------------------- */}
                        {/* 2. CUSTOMER OR TOPIC */}
                        {/* -------------------------------- */}

                        <section className="space-y-3">

                            <label className={labelClass}>
                                02. Select Recipient
                            </label>

                            {formData.targetType === "token" ? (

                                <div className="space-y-2">

                                    <label className="block text-sm font-medium text-gray-800">
                                        Customer Name / Email
                                    </label>

                                    <div className="relative">

                                        <Search
                                            size={17}
                                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
                                        />

                                        <input
                                            type="text"
                                            value={customerSearch}
                                            onChange={(event) => {
                                                setCustomerSearch(event.target.value);
                                                setSelectedCustomer(null);
                                            }}
                                            placeholder="Search customer by name or email..."
                                            autoComplete="off"
                                            className={`${inputClass} pl-11 pr-11`}
                                        />

                                        {selectedCustomer && (
                                            <button
                                                type="button"
                                                onClick={clearCustomer}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary hover:text-red-500"
                                            >
                                                <X size={17} />
                                            </button>
                                        )}

                                        {filteredCustomers.length > 0 && (

                                            <div className="absolute z-30 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-tertiary/60 bg-white shadow-xl">

                                                {filteredCustomers.map((customer) => (

                                                    <button
                                                        key={customer.uid}
                                                        type="button"
                                                        onMouseDown={(event) => event.preventDefault()}
                                                        onClick={() => handleCustomerSelect(customer)}
                                                        className="flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition last:border-0 hover:bg-primary/5"
                                                    >

                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                                            <UserRound size={17} />
                                                        </div>

                                                        <div className="min-w-0 flex-1">

                                                            <p className="truncate text-sm font-semibold text-gray-900">
                                                                {customer.name}
                                                            </p>

                                                            <p className="truncate text-xs text-secondary">
                                                                {customer.email || "No email available"}
                                                            </p>

                                                        </div>

                                                    </button>

                                                ))}

                                            </div>

                                        )}

                                    </div>

                                    {selectedCustomer && (

                                        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3">

                                            <CheckCircle2
                                                size={18}
                                                className="text-emerald-600"
                                            />

                                            <div className="min-w-0 flex-1">

                                                <p className="text-sm font-semibold text-emerald-800">
                                                    {selectedCustomer.name}
                                                </p>

                                                <p className="truncate text-xs text-emerald-700">
                                                    {selectedCustomer.email}
                                                </p>

                                            </div>

                                            <span className="rounded-md bg-white px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
                                                Selected
                                            </span>

                                        </div>

                                    )}

                                </div>

                            ) : (

                                <div className="space-y-2">

                                    <label className="block text-sm font-medium text-gray-800">
                                        Select Topic / Audience
                                    </label>

                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">

                                        {AUDIENCES.map((audience) => {

                                            const Icon = audience.icon;

                                            const active =
                                                formData.audience === audience.value;

                                            return (

                                                <button
                                                    key={audience.value}
                                                    type="button"
                                                    onClick={() =>
                                                        updateField("audience", audience.value)
                                                    }
                                                    className={`
                                                        flex items-center gap-3 rounded-xl border p-3 text-left transition
                                                        ${active
                                                            ? "border-primary bg-primary/5 ring-2 ring-primary/10"
                                                            : "border-tertiary/60 hover:border-primary/40"
                                                        }
                                                    `}
                                                >

                                                    <div className={`rounded-lg p-2 ${
                                                        active
                                                            ? "bg-primary text-white"
                                                            : "bg-slate-100 text-secondary"
                                                    }`}>
                                                        <Icon size={19} />
                                                    </div>

                                                    <div className="min-w-0 flex-1">

                                                        <p className="text-sm font-semibold text-gray-900">
                                                            {audience.label}
                                                        </p>

                                                        <p className="mt-0.5 text-[11px] text-secondary">
                                                            {audience.description}
                                                        </p>

                                                    </div>

                                                    {active && (
                                                        <CheckCircle2
                                                            size={17}
                                                            className="text-primary"
                                                        />
                                                    )}

                                                </button>

                                            );

                                        })}

                                    </div>

                                    {formData.audience === "under_5_km" && (

                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
                                            Nearby targeting uses the customer's saved latitude and longitude and the shop's configured location. Customers without valid location data cannot be included.
                                        </div>

                                    )}

                                </div>

                            )}

                        </section>

                        {/* -------------------------------- */}
                        {/* 3. TEMPLATE */}
                        {/* -------------------------------- */}

                        <section className="space-y-3">

                            <label className={labelClass}>
                                03. Select Notification Template
                            </label>

                            <div className="relative">

                                <FileText
                                    size={17}
                                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
                                />

                                <select
                                    required
                                    value={formData.templateId}
                                    onChange={(event) =>
                                        handleTemplateChange(event.target.value)
                                    }
                                    disabled={loading || templates.length === 0}
                                    className={`${inputClass} appearance-none pl-11`}
                                >

                                    <option value="">
                                        {loading
                                            ? "Loading templates..."
                                            : "Choose notification template"
                                        }
                                    </option>

                                    {templates.map((template) => (

                                        <option
                                            key={template.id}
                                            value={template.id}
                                        >
                                            {template.title} ({template.id})
                                        </option>

                                    ))}

                                </select>

                            </div>

                            {!loading && templates.length === 0 && (
                                <p className="text-xs text-amber-600">
                                    No active templates found. Create an active template first.
                                </p>
                            )}

                        </section>

                        {/* -------------------------------- */}
                        {/* 4. TEMPLATE VARIABLES */}
                        {/* -------------------------------- */}

                        {selectedTemplate && (

                            <section className="space-y-4 rounded-2xl border border-tertiary/50 bg-slate-50/70 p-5">

                                <div>

                                    <h3 className="text-sm font-bold text-gray-900">
                                        Template Variables
                                    </h3>

                                    <p className="mt-1 text-xs text-secondary">
                                        Enter values for the selected template placeholders.
                                    </p>

                                </div>

                                {requiredVariables.length > 0 ? (

                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

                                        {requiredVariables.map((key) => (

                                            <div key={key}>

                                                <label className={labelClass}>
                                                    {key.replace(/_/g, " ")}
                                                </label>

                                                <input
                                                    value={variables[key] || ""}
                                                    onChange={(event) =>
                                                        handleVariableChange(
                                                            key,
                                                            event.target.value
                                                        )
                                                    }
                                                    placeholder={`Enter ${key.replace(/_/g, " ")}`}
                                                    className={inputClass}
                                                    required
                                                />

                                                {key === "customer_name" &&
                                                    formData.targetType === "token" && (
                                                        <p className="mt-1 text-[10px] text-secondary">
                                                            Automatically populated from the selected customer.
                                                        </p>
                                                    )}

                                            </div>

                                        ))}

                                    </div>

                                ) : (

                                    <p className="text-xs text-secondary">
                                        This template does not require any variables.
                                    </p>

                                )}

                                {/* MESSAGE PREVIEW */}

                                <div className="space-y-3 border-t border-tertiary/40 pt-4">

                                    <div className="flex items-center justify-between">
                                        <h3 className="text-sm font-bold text-gray-900">
                                            Notification Preview
                                        </h3>

                                        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary">
                                            LIVE PREVIEW
                                        </span>
                                    </div>

                                    <div className="rounded-xl border border-tertiary/50 bg-white p-4">

                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                                            Title
                                        </p>

                                        <p className="text-sm font-semibold text-gray-900">
                                            {previewTitle || "Notification title"}
                                        </p>

                                        <div className="my-3 border-t border-slate-100" />

                                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-secondary">
                                            Message
                                        </p>

                                        <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                            {previewMessage || "Notification message"}
                                        </p>

                                    </div>

                                    {missingVariables.length > 0 && (

                                        <p className="text-xs font-medium text-amber-700">
                                            Missing variables: {missingVariables.join(", ")}
                                        </p>

                                    )}

                                </div>

                            </section>

                        )}

                        {/* -------------------------------- */}
                        {/* 5. ADDITIONAL DETAILS */}
                        {/* -------------------------------- */}

                        {/* <section className="grid grid-cols-1 gap-5 border-t border-tertiary/30 pt-5 sm:grid-cols-2">

                            <div>

                                <label className={labelClass}>
                                    Related Order ID
                                </label>

                                <input
                                    value={formData.orderId}
                                    onChange={(event) =>
                                        updateField("orderId", event.target.value)
                                    }
                                    placeholder="Optional order ID"
                                    className={inputClass}
                                />

                            </div>

                            <div>

                                <label className={labelClass}>
                                    Navigation URL
                                </label>

                                <div className="relative">

                                    <Link2
                                        size={16}
                                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/60"
                                    />

                                    <input
                                        value={formData.url}
                                        onChange={(event) =>
                                            updateField("url", event.target.value)
                                        }
                                        placeholder="/orders"
                                        className={`${inputClass} pl-10`}
                                    />

                                </div>

                            </div>

                        </section> */}

                        {/* -------------------------------- */}
                        {/* ACTIONS */}
                        {/* -------------------------------- */}

                        <div className="flex flex-col-reverse gap-3 border-t border-tertiary/30 pt-6 sm:flex-row sm:justify-end">

                            <button
                                type="button"
                                onClick={handleClear}
                                disabled={sending}
                                className="rounded-xl px-6 py-3 text-sm font-semibold text-secondary transition hover:bg-slate-100 disabled:opacity-50"
                            >
                                Clear
                            </button>

                            <button
                                type="submit"
                                disabled={
                                    sending ||
                                    loading ||
                                    !selectedTemplate ||
                                    (formData.targetType === "token" && !selectedCustomer) ||
                                    (formData.targetType === "topic" && !formData.audience) ||
                                    missingVariables.length > 0
                                }
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                            >

                                {sending ? (

                                    <>
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                        Sending...
                                    </>

                                ) : (

                                    <>
                                        <Send size={16} />
                                        Send Notification
                                    </>

                                )}

                            </button>

                        </div>

                    </form>

                </div>

            </div>

        </div>

    );
}

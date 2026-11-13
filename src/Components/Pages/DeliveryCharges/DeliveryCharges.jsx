import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
    FaTruck,
    FaPlus,
    FaSearch,
    FaEdit,
    FaTimes,
    FaCheckCircle,
    FaShippingFast,
    FaEuroSign,
    FaBox,
    FaSave,
    FaToggleOn,
    FaToggleOff,
    FaGift,
    FaPercentage,
    FaMapMarkerAlt,
    FaTrash,
    FaCity,
    FaDownload,
} from "react-icons/fa";
import CommonTable from "../../Shared/Pages/CommonTable";
import { useToast } from "../../Shared/hooks/ToastContext";
import { db, app } from "../../Config/Firebase";
import {
    doc,
    getDoc,
    getDocs,
    setDoc,
    collection,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    serverTimestamp,
} from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";

// =====================================================
// CONSTANTS & GERMAN GEOGRAPHY DATA
// =====================================================

export const GERMAN_STATES = [
    { name: "Baden-Württemberg", code: "BW", nameEn: "Baden-Württemberg" },
    { name: "Bayern", code: "BY", nameEn: "Bavaria" },
    { name: "Berlin", code: "BE", nameEn: "Berlin" },
    { name: "Brandenburg", code: "BB", nameEn: "Brandenburg" },
    { name: "Bremen", code: "HB", nameEn: "Bremen" },
    { name: "Hamburg", code: "HH", nameEn: "Hamburg" },
    { name: "Hessen", code: "HE", nameEn: "Hesse" },
    { name: "Mecklenburg-Vorpommern", code: "MV", nameEn: "Mecklenburg-Western Pomerania" },
    { name: "Niedersachsen", code: "NI", nameEn: "Lower Saxony" },
    { name: "Nordrhein-Westfalen", code: "NW", nameEn: "North Rhine-Westphalia" },
    { name: "Rheinland-Pfalz", code: "RP", nameEn: "Rhineland-Palatinate" },
    { name: "Saarland", code: "SL", nameEn: "Saarland" },
    { name: "Sachsen", code: "SN", nameEn: "Saxony" },
    { name: "Sachsen-Anhalt", code: "ST", nameEn: "Saxony-Anhalt" },
    { name: "Schleswig-Holstein", code: "SH", nameEn: "Schleswig-Holstein" },
    { name: "Thüringen", code: "TH", nameEn: "Thuringia" },
];

const DEFAULTS = {
    normal: {
        id: "normal",
        name: "Normal Delivery",
        subtitle: "Within 5 km radius",
        delivery_type: "normal",
        price_increase_percentage: 0,
        delivery_charge: 1.99,
        minimum_order_amount: 20,
        status: true,
    },
    monthly_van: {
        id: "monthly_van",
        name: "Monthly Van Delivery",
        subtitle: "Monthly route across Germany",
        delivery_type: "monthly_van",
        price_increase_percentage: 10,
        delivery_charge: 3.99,
        minimum_order_amount: 50,
        status: true,
    },
    courier: {
        id: "courier",
        name: "Courier Delivery",
        subtitle: "Courier dispatch",
        delivery_type: "courier",
        price_increase_percentage: 20,
        delivery_charge: 4.99,
        minimum_order_amount: 35,
        status: true,
    },
};

const emptyForm = {
    delivery_type: "normal",
    price_increase_percentage: "0",
    delivery_charge: "1.99",
    minimum_order_amount: "20",
    status: true,
};

const emptyPlaceForm = {
    deliveryType: "normal",
    city: "",
    state: "Hessen",
    stateCode: "HE",
    postalCode: "",
    status: true,
    notes: "",
};

const normalizePlace = (data, fallbackId = "") => {
    const raw = data || {};
    const id = fallbackId || raw.id || raw.placeId || raw.place_id || "";
    const city = (raw.city || raw.cityName || raw.name || "").trim();
    const state = (raw.state || raw.stateName || raw.bundesland || "").trim();
    const stateCode = (raw.stateCode || raw.state_code || raw.code || "").trim().toUpperCase();
    const postalCode = String(raw.postalCode || raw.postal_code || raw.pincode || raw.pinCode || raw.plz || raw.zipCode || "").trim();
    const rawType = String(raw.deliveryType || raw.delivery_type || "normal").toLowerCase();
    const deliveryType = rawType.includes("van") ? "monthly_van" : "normal";
    const status = raw.status !== undefined ? Boolean(raw.status) : (raw.is_active !== undefined ? Boolean(raw.is_active) : true);
    const notes = (raw.notes || raw.note || raw.description || "").trim();

    return {
        id,
        placeId: id,
        ...raw,
        city,
        state,
        stateCode,
        postalCode,
        deliveryType,
        delivery_type: deliveryType,
        status,
        is_active: status,
        notes,
    };
};

// =====================================================
// MAIN COMPONENT
// =====================================================

const DeliveryCharges = () => {
    const { showToast } = useToast();
    const functions = useMemo(() => getFunctions(app, "europe-west1"), []);
    const manageDeliveryPlaceCallable = useMemo(
        () => httpsCallable(functions, "manageDeliveryPlace"),
        [functions]
    );

    // Main navigation tabs: "charges" (pricing) | "places" (locations in Germany)
    const [activeMainTab, setActiveMainTab] = useState("charges");

    // -------------------------------------------------
    // 1. DELIVERY CHARGES STATE
    // -------------------------------------------------
    const [charges, setCharges] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // -------------------------------------------------
    // 2. GERMANY DELIVERY PLACES STATE
    // -------------------------------------------------
    const [places, setPlaces] = useState([]);
    const [placesLoading, setPlacesLoading] = useState(true);
    const [placesSearchTerm, setPlacesSearchTerm] = useState("");
    const [placesDeliveryFilter, setPlacesDeliveryFilter] = useState("all"); // "all" | "normal" | "monthly_van"
    const [placesStateFilter, setPlacesStateFilter] = useState("all");
    const [placesStatusFilter, setPlacesStatusFilter] = useState("all");

    // Place modal states
    const [isPlaceModalOpen, setIsPlaceModalOpen] = useState(false);
    const [editingPlaceId, setEditingPlaceId] = useState(null);
    const [placeFormData, setPlaceFormData] = useState(emptyPlaceForm);
    const [placeErrors, setPlaceErrors] = useState({});
    const [placeSaving, setPlaceSaving] = useState(false);

    // Delete confirmation state
    const [deleteConfirmPlace, setDeleteConfirmPlace] = useState(null);
    const [deletingPlace, setDeletingPlace] = useState(false);

    // -------------------------------------------------
    // LOAD DELIVERY CHARGES
    // -------------------------------------------------
    const fetchCharges = useCallback(async () => {
        setLoading(true);
        try {
            const [normalSnap, postalSnap] = await Promise.all([
                getDoc(doc(db, "delivery_settings", "normal")),
                getDoc(doc(db, "delivery_settings", "postal")),
            ]);

            const normalData = normalSnap.exists() ? normalSnap.data() : {};
            const postalData = postalSnap.exists() ? postalSnap.data() : {};
            const vanData = postalData.monthly_van || {};
            const courierData = postalData.courier || {};

            setCharges([
                {
                    ...DEFAULTS.normal,
                    price_increase_percentage: Number(normalData.price_increase_percentage ?? DEFAULTS.normal.price_increase_percentage),
                    delivery_charge: Number(normalData.delivery_charge ?? DEFAULTS.normal.delivery_charge),
                    minimum_order_amount: Number(normalData.minimum_order_amount ?? normalData.free_delivery_minimum ?? DEFAULTS.normal.minimum_order_amount),
                    status: normalData.status !== undefined ? Boolean(normalData.status) : DEFAULTS.normal.status,
                },
                {
                    ...DEFAULTS.monthly_van,
                    price_increase_percentage: Number(vanData.price_increase_percentage ?? DEFAULTS.monthly_van.price_increase_percentage),
                    delivery_charge: Number(vanData.delivery_charge ?? DEFAULTS.monthly_van.delivery_charge),
                    minimum_order_amount: Number(vanData.minimum_order_amount ?? vanData.free_delivery_minimum ?? DEFAULTS.monthly_van.minimum_order_amount),
                    status: vanData.status !== undefined ? Boolean(vanData.status) : DEFAULTS.monthly_van.status,
                },
                {
                    ...DEFAULTS.courier,
                    price_increase_percentage: Number(courierData.price_increase_percentage ?? DEFAULTS.courier.price_increase_percentage),
                    delivery_charge: Number(courierData.delivery_charge ?? DEFAULTS.courier.delivery_charge),
                    minimum_order_amount: Number(courierData.minimum_order_amount ?? courierData.free_delivery_minimum ?? DEFAULTS.courier.minimum_order_amount),
                    status: courierData.status !== undefined ? Boolean(courierData.status) : DEFAULTS.courier.status,
                },
            ]);
        } catch (err) {
            console.error("Failed to load delivery settings:", err);
            showToast("Failed to load delivery charges.", "error");
        } finally {
            setLoading(false);
        }
    }, [showToast]);

    useEffect(() => {
        fetchCharges();
    }, [fetchCharges]);

    // -------------------------------------------------
    // LOAD GERMANY DELIVERY PLACES (CALLABLE + FIRESTORE FALLBACK)
    // -------------------------------------------------
    const fetchPlaces = useCallback(async () => {
        setPlacesLoading(true);
        try {
            // Priority 1: Cloud Function callable (runs with Admin SDK, bypassing client rules)
            try {
                const response = await manageDeliveryPlaceCallable({ action: "list" });
                if (response?.data?.success && Array.isArray(response.data.data)) {
                    const normalized = response.data.data.map((item) =>
                        normalizePlace(item, item.id || item.placeId)
                    );
                    normalized.sort((a, b) => {
                        const cityCompare = (a.city || "").localeCompare(b.city || "");
                        if (cityCompare !== 0) return cityCompare;
                        return (a.postalCode || "").localeCompare(b.postalCode || "");
                    });
                    setPlaces(normalized);
                    setPlacesLoading(false);
                    return;
                }
            } catch (fnErr) {
                console.warn("manageDeliveryPlace callable list failed, trying direct Firestore:", fnErr.message);
            }

            // Priority 2: Direct Firestore query across candidate collection names
            const candidateCollections = ["delivery_places", "places", "deliveryPlaces"];
            let loadedList = [];

            for (const colName of candidateCollections) {
                try {
                    const snap = await getDocs(collection(db, colName));
                    if (!snap.empty) {
                        loadedList = snap.docs.map((docSnap) =>
                            normalizePlace(docSnap.data(), docSnap.id)
                        );
                        break;
                    }
                } catch (colErr) {
                    console.warn(`Direct fetch from ${colName} warning:`, colErr.message);
                }
            }

            loadedList.sort((a, b) => {
                const cityCompare = (a.city || "").localeCompare(b.city || "");
                if (cityCompare !== 0) return cityCompare;
                return (a.postalCode || "").localeCompare(b.postalCode || "");
            });

            setPlaces(loadedList);
        } catch (error) {
            console.error("Failed to load delivery places:", error);
            showToast(error.message || "Failed to load delivery places.", "error");
        } finally {
            setPlacesLoading(false);
        }
    }, [manageDeliveryPlaceCallable, showToast]);

    useEffect(() => {
        fetchPlaces();

        // Real-time synchronization
        const unsubscribe = onSnapshot(
            collection(db, "delivery_places"),
            (snapshot) => {
                if (!snapshot.empty) {
                    const list = snapshot.docs
                        .map((docSnap) => normalizePlace(docSnap.data(), docSnap.id))
                        .sort((a, b) => {
                            const cityCompare = (a.city || "").localeCompare(b.city || "");
                            if (cityCompare !== 0) return cityCompare;
                            return (a.postalCode || "").localeCompare(b.postalCode || "");
                        });
                    setPlaces(list);
                    setPlacesLoading(false);
                }
            },
            (err) => {
                console.warn("Delivery places onSnapshot subscription warning:", err.message);
            }
        );

        return () => unsubscribe();
    }, [fetchPlaces]);

    // -------------------------------------------------
    // FILTERED DELIVERY CHARGES
    // -------------------------------------------------
    const filteredCharges = useMemo(() => {
        return charges.filter((item) => {
            const matchesSearch =
                item.name.toLowerCase().includes(searchTerm.trim().toLowerCase()) ||
                item.delivery_type.toLowerCase().includes(searchTerm.trim().toLowerCase());

            const matchesStatus =
                statusFilter === "all" ||
                (statusFilter === "active" && item.status) ||
                (statusFilter === "inactive" && !item.status);

            return matchesSearch && matchesStatus;
        });
    }, [charges, searchTerm, statusFilter]);

    // -------------------------------------------------
    // FILTERED GERMANY PLACES
    // -------------------------------------------------
    const filteredPlaces = useMemo(() => {
        const query = placesSearchTerm.trim().toLowerCase();

        return places.filter((place) => {
            const matchesSearch =
                !query ||
                (place.city || "").toLowerCase().includes(query) ||
                (place.postalCode || "").toLowerCase().includes(query) ||
                (place.state || "").toLowerCase().includes(query) ||
                (place.stateCode || "").toLowerCase().includes(query) ||
                (place.notes || "").toLowerCase().includes(query);

            const matchesDelivery =
                placesDeliveryFilter === "all" ||
                place.deliveryType === placesDeliveryFilter;

            const matchesState =
                placesStateFilter === "all" ||
                place.stateCode === placesStateFilter ||
                place.state === placesStateFilter;

            const matchesStatus =
                placesStatusFilter === "all" ||
                (placesStatusFilter === "active" && place.status) ||
                (placesStatusFilter === "inactive" && !place.status);

            return matchesSearch && matchesDelivery && matchesState && matchesStatus;
        });
    }, [places, placesSearchTerm, placesDeliveryFilter, placesStateFilter, placesStatusFilter]);

    // Places KPIs
    const normalPlacesCount = useMemo(
        () => places.filter((p) => p.deliveryType === "normal").length,
        [places]
    );
    const vanPlacesCount = useMemo(
        () => places.filter((p) => p.deliveryType === "monthly_van").length,
        [places]
    );
    const uniqueStatesCount = useMemo(
        () => new Set(places.map((p) => p.stateCode).filter(Boolean)).size,
        [places]
    );

    // -------------------------------------------------
    // CHARGES HANDLERS
    // -------------------------------------------------
    const openAddModal = () => {
        setEditingType(null);
        setFormData({ ...emptyForm });
        setErrors({});
        setIsModalOpen(true);
    };

    const openEditModal = (item) => {
        setEditingType(item.delivery_type);
        setFormData({
            delivery_type: item.delivery_type,
            price_increase_percentage: String(item.price_increase_percentage),
            delivery_charge: String(item.delivery_charge),
            minimum_order_amount: String(item.minimum_order_amount),
            status: item.status,
        });
        setErrors({});
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingType(null);
        setFormData({ ...emptyForm });
        setErrors({});
    };

    const handleTypeSelect = (type) => {
        const preset = DEFAULTS[type];
        if (preset && !editingType) {
            setFormData({
                delivery_type: type,
                price_increase_percentage: String(preset.price_increase_percentage),
                delivery_charge: String(preset.delivery_charge),
                minimum_order_amount: String(preset.minimum_order_amount),
                status: true,
            });
        } else {
            setFormData((prev) => ({ ...prev, delivery_type: type }));
        }
        setErrors((prev) => ({ ...prev, delivery_type: "" }));
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        setErrors((prev) => ({ ...prev, [name]: "" }));
    };

    const validate = () => {
        const errs = {};
        if (!["normal", "monthly_van", "courier"].includes(formData.delivery_type)) {
            errs.delivery_type = "Select a valid delivery type.";
        }
        if (formData.price_increase_percentage === "" || Number(formData.price_increase_percentage) < 0) {
            errs.price_increase_percentage = "Enter a valid percentage (0 or more).";
        }
        if (formData.delivery_charge === "" || Number(formData.delivery_charge) < 0) {
            errs.delivery_charge = "Enter a valid delivery charge (0 or more).";
        }
        if (formData.minimum_order_amount === "" || Number(formData.minimum_order_amount) < 0) {
            errs.minimum_order_amount = "Enter a valid minimum order amount (0 or more).";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        setSaving(true);
        try {
            const payload = {
                delivery_type: formData.delivery_type,
                price_increase_percentage: Number(formData.price_increase_percentage),
                delivery_charge: Number(formData.delivery_charge),
                minimum_order_amount: Number(formData.minimum_order_amount),
                status: Boolean(formData.status),
            };

            if (formData.delivery_type === "normal") {
                await setDoc(doc(db, "delivery_settings", "normal"), payload, { merge: true });
            } else {
                await setDoc(
                    doc(db, "delivery_settings", "postal"),
                    { [formData.delivery_type]: payload },
                    { merge: true }
                );
            }

            showToast("Delivery settings saved successfully.", "success");
            closeModal();
            fetchCharges();
        } catch (err) {
            console.error("Save failed:", err);
            showToast("Failed to save delivery settings.", "error");
        } finally {
            setSaving(false);
        }
    };

    const toggleStatus = async (item) => {
        const nextStatus = !item.status;
        setCharges((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, status: nextStatus } : c))
        );

        try {
            if (item.id === "normal") {
                await setDoc(doc(db, "delivery_settings", "normal"), { status: nextStatus }, { merge: true });
            } else {
                await setDoc(
                    doc(db, "delivery_settings", "postal"),
                    { [item.id]: { status: nextStatus } },
                    { merge: true }
                );
            }
            showToast(`${item.name} status updated.`, "success");
        } catch (err) {
            console.error("Status update error:", err);
            showToast("Failed to update status.", "error");
            fetchCharges();
        }
    };

    // -------------------------------------------------
    // PLACES HANDLERS
    // -------------------------------------------------
    const handleStateSelect = (selectedStateName) => {
        const matched = GERMAN_STATES.find((s) => s.name === selectedStateName);
        const code = matched ? matched.code : "";
        setPlaceFormData((prev) => ({
            ...prev,
            state: selectedStateName,
            stateCode: code,
        }));
        setPlaceErrors((prev) => ({ ...prev, state: "", stateCode: "" }));
    };

    const openAddPlaceModal = () => {
        setEditingPlaceId(null);
        const isNormal = placesDeliveryFilter !== "monthly_van";
        setPlaceFormData({
            deliveryType: isNormal ? "normal" : "monthly_van",
            city: "",
            state: "Hessen",
            stateCode: "HE",
            postalCode: "",
            status: true,
            notes: "",
        });
        setPlaceErrors({});
        setIsPlaceModalOpen(true);
    };

    const handlePlaceDeliveryTypeSelect = (type) => {
        setPlaceFormData((prev) => ({
            ...prev,
            deliveryType: type,
        }));
    };

    const openEditPlaceModal = (place) => {
        setEditingPlaceId(place.id || place.placeId);
        setPlaceFormData({
            deliveryType: place.deliveryType || "normal",
            city: place.city || "",
            state: place.state || "Hessen",
            stateCode: place.stateCode || "HE",
            postalCode: place.postalCode || "",
            status: place.status !== undefined ? Boolean(place.status) : true,
            notes: place.notes || "",
        });
        setPlaceErrors({});
        setIsPlaceModalOpen(true);
    };

    const closePlaceModal = () => {
        setIsPlaceModalOpen(false);
        setEditingPlaceId(null);
        setPlaceFormData(emptyPlaceForm);
        setPlaceErrors({});
    };

    const validatePlaceForm = () => {
        const errs = {};
        if (!placeFormData.city.trim()) {
            errs.city = "City is required.";
        }
        if (!placeFormData.state.trim()) {
            errs.state = "State is required.";
        }
        if (!placeFormData.stateCode.trim()) {
            errs.stateCode = "State code is required.";
        }
        if (!placeFormData.postalCode.trim()) {
            errs.postalCode = "Postal code is required.";
        }
        setPlaceErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handlePlaceSubmit = async (e) => {
        e.preventDefault();
        if (!validatePlaceForm()) return;

        setPlaceSaving(true);
        try {
            const isUpdate = Boolean(editingPlaceId);
            const payload = {
                city: placeFormData.city.trim(),
                state: placeFormData.state.trim(),
                stateCode: placeFormData.stateCode.trim().toUpperCase(),
                postalCode: placeFormData.postalCode.trim(),
                deliveryType: placeFormData.deliveryType,
                status: Boolean(placeFormData.status),
                notes: placeFormData.notes.trim(),
                searchKey: `${placeFormData.city} ${placeFormData.postalCode} ${placeFormData.state} ${placeFormData.stateCode}`.toLowerCase(),
                updatedAt: serverTimestamp(),
            };

            // Call Cloud Function or direct Firestore
            try {
                await manageDeliveryPlaceCallable({
                    action: isUpdate ? "update" : "add",
                    fields: {
                        ...(isUpdate && { placeId: editingPlaceId }),
                        ...payload,
                    },
                });
            } catch (fnErr) {
                console.warn("Callable fallback to direct firestore:", fnErr.message);
                if (isUpdate) {
                    await updateDoc(doc(db, "delivery_places", editingPlaceId), payload);
                } else {
                    await addDoc(collection(db, "delivery_places"), {
                        ...payload,
                        createdAt: serverTimestamp(),
                    });
                }
            }

            await fetchPlaces();

            showToast(
                isUpdate ? "Delivery place updated successfully." : "Delivery place added successfully.",
                "success"
            );
            closePlaceModal();
        } catch (err) {
            console.error("Failed to save delivery place:", err);
            showToast(err.message || "Failed to save delivery place.", "error");
        } finally {
            setPlaceSaving(false);
        }
    };

    const togglePlaceStatus = async (place) => {
        const nextStatus = !place.status;
        const placeId = place.id || place.placeId;
        try {
            try {
                await manageDeliveryPlaceCallable({
                    action: "toggleStatus",
                    fields: { placeId, status: nextStatus },
                });
            } catch (fnErr) {
                console.warn("Callable toggle fallback:", fnErr.message);
                const placeRef = doc(db, "delivery_places", placeId);
                await updateDoc(placeRef, {
                    status: nextStatus,
                    updatedAt: serverTimestamp(),
                });
            }
            await fetchPlaces();
            showToast(`${place.city} (${place.postalCode}) set to ${nextStatus ? "Active" : "Inactive"}.`, "success");
        } catch (err) {
            console.error("Status toggle failed:", err);
            showToast("Failed to update status.", "error");
        }
    };

    const openDeleteConfirmModal = (place) => {
        setDeleteConfirmPlace(place);
    };

    const handleDeletePlace = async () => {
        if (!deleteConfirmPlace) return;

        setDeletingPlace(true);
        try {
            const placeId = deleteConfirmPlace.id || deleteConfirmPlace.placeId;
            try {
                await manageDeliveryPlaceCallable({
                    action: "delete",
                    fields: { placeId },
                });
            } catch (fnErr) {
                console.warn("Callable fallback delete:", fnErr.message);
                await deleteDoc(doc(db, "delivery_places", placeId));
            }

            await fetchPlaces();

            showToast(`${deleteConfirmPlace.city} (${deleteConfirmPlace.postalCode}) deleted.`, "success");
            setDeleteConfirmPlace(null);
        } catch (err) {
            console.error("Delete failed:", err);
            showToast("Failed to delete place.", "error");
        } finally {
            setDeletingPlace(false);
        }
    };

    // -------------------------------------------------
    // CSV EXPORT
    // -------------------------------------------------
    const exportPlacesCsv = () => {
        if (filteredPlaces.length === 0) {
            showToast("No places to export.", "info");
            return;
        }
        const headers = ["City", "State", "State Code", "Postal Code", "Delivery Type", "Status", "Notes"];
        const rows = filteredPlaces.map((p) => [
            `"${p.city || ""}"`,
            `"${p.state || ""}"`,
            `"${p.stateCode || ""}"`,
            `"${p.postalCode || ""}"`,
            `"${p.deliveryType === "normal" ? "Normal (5 km)" : "Monthly Van"}"`,
            `"${p.status ? "Active" : "Inactive"}"`,
            `"${p.notes || ""}"`,
        ]);
        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute(
            "download",
            `germany_delivery_places_${new Date().toISOString().slice(0, 10)}.csv`
        );
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast("Places exported successfully.", "success");
    };

    const formatAmount = (amount) => `€${Number(amount || 0).toFixed(2)}`;

    // =====================================================
    // RENDER
    // =====================================================
    return (
        <div className="min-h-screen bg-white p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                            Delivery Management
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Configure delivery charges, pricing thresholds, and serviceable Germany delivery locations (5 km & Monthly Van).
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {activeMainTab === "charges" ? (
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <FaPlus />
                                Add Delivery Charge
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={openAddPlaceModal}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-primary/30"
                            >
                                <FaPlus />
                                Add Place
                            </button>
                        )}
                    </div>
                </div>

                {/* Main Navigation Tabs */}
                <div className="flex border-b border-gray-200">
                    <button
                        type="button"
                        onClick={() => setActiveMainTab("charges")}
                        className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
                            activeMainTab === "charges"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}
                    >
                        <FaEuroSign />
                        Delivery Pricing & Rules
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                activeMainTab === "charges"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                        >
                            {charges.length}
                        </span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            setActiveMainTab("places");
                            fetchPlaces();
                        }}
                        className={`flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-bold transition ${
                            activeMainTab === "places"
                                ? "border-primary text-primary"
                                : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
                        }`}
                    >
                        <FaMapMarkerAlt />
                        Places of Germany (5 km & Monthly Van)
                        <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                activeMainTab === "places"
                                    ? "bg-primary/10 text-primary"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                        >
                            {places.length}
                        </span>
                    </button>
                </div>

                {/* ================================================= */}
                {/* TAB 1: CHARGES & PRICING */}
                {/* ================================================= */}
                {activeMainTab === "charges" && (
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <SummaryCard
                                title="Total Delivery Types"
                                value={charges.length}
                                description="Configured options"
                                icon={<FaTruck />}
                            />
                            <SummaryCard
                                title="Active Types"
                                value={charges.filter((c) => c.status).length}
                                description="Currently enabled"
                                icon={<FaCheckCircle />}
                            />
                            <SummaryCard
                                title="Germany Places Mapped"
                                value={places.length}
                                description={`${normalPlacesCount} Local | ${vanPlacesCount} Van`}
                                icon={<FaMapMarkerAlt />}
                            />
                            <SummaryCard
                                title="Currency"
                                value="EUR (€)"
                                description="7% VAT inclusive"
                                icon={<FaEuroSign />}
                            />
                        </div>

                        {/* Main Content Table */}
                        <div className="overflow-hidden rounded-2xl border border-tertiary/30 bg-white shadow-sm">
                            <div className="flex flex-col gap-4 border-b border-gray-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Delivery Configuration
                                    </h2>
                                    <p className="mt-0.5 text-xs text-gray-500">
                                        Pricing rules applied to normal delivery, monthly van routes, and courier shipments.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-3 sm:flex-row">
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                                        <input
                                            type="text"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            placeholder="Search delivery type..."
                                            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 sm:w-64"
                                        />
                                    </div>

                                    <select
                                        value={statusFilter}
                                        onChange={(e) => setStatusFilter(e.target.value)}
                                        className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        aria-label="Filter by status"
                                    >
                                        <option value="all">All Statuses</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>
                            </div>

                            <CommonTable
                                title="Delivery Charges"
                                subtitle={`Showing ${filteredCharges.length} of ${charges.length} delivery types`}
                                loading={loading}
                                columns={[
                                    {
                                        key: "name",
                                        header: "Delivery Type",
                                        sortable: true,
                                        render: (item) => (
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                                    {item.delivery_type === "normal" ? (
                                                        <FaTruck />
                                                    ) : item.delivery_type === "monthly_van" ? (
                                                        <FaShippingFast />
                                                    ) : (
                                                        <FaBox />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{item.name}</p>
                                                    <p className="mt-0.5 text-xs text-gray-400">{item.subtitle}</p>
                                                </div>
                                            </div>
                                        ),
                                    },
                                    {
                                        key: "price_increase_percentage",
                                        header: "Price Adjustment",
                                        sortable: true,
                                        render: (item) => (
                                            <span className="font-semibold text-gray-800">
                                                {item.price_increase_percentage > 0
                                                    ? `+${item.price_increase_percentage}%`
                                                    : "0%"}
                                            </span>
                                        ),
                                    },
                                    {
                                        key: "delivery_charge",
                                        header: "Delivery Charge",
                                        sortable: true,
                                        render: (item) => formatAmount(item.delivery_charge),
                                    },
                                    {
                                        key: "minimum_order_amount",
                                        header: "Free Delivery Minimum",
                                        sortable: true,
                                        render: (item) => (
                                            <span className="font-semibold text-gray-900">
                                                {formatAmount(item.minimum_order_amount)}
                                            </span>
                                        ),
                                    },
                                    {
                                        key: "pricing_rule",
                                        header: "Pricing Rule",
                                        render: (item) => (
                                            <span className="text-xs text-gray-500">
                                                &lt; {formatAmount(item.minimum_order_amount)}: {formatAmount(item.delivery_charge)} | &ge; {formatAmount(item.minimum_order_amount)}: Free
                                            </span>
                                        ),
                                    },
                                    {
                                        key: "status",
                                        header: "Status",
                                        sortable: true,
                                        render: (item) => (
                                            <button
                                                type="button"
                                                onClick={() => toggleStatus(item)}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                                    item.status
                                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        item.status ? "bg-emerald-500" : "bg-gray-400"
                                                    }`}
                                                />
                                                {item.status ? "Active" : "Inactive"}
                                            </button>
                                        ),
                                    },
                                ]}
                                data={filteredCharges}
                                total={filteredCharges.length}
                                clientSide
                                showSearch={false}
                                showRowNumbers={false}
                                rowKey="id"
                                emptyMessage="No delivery charges found"
                                emptyDescription="Try another search or configure delivery settings."
                                actions={(item) => (
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(item)}
                                        title="Edit delivery charge"
                                        className="rounded-lg p-2 text-gray-500 transition hover:bg-primary/5 hover:text-primary"
                                    >
                                        <FaEdit />
                                    </button>
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* ================================================= */}
                {/* TAB 2: GERMANY PLACES (5 KM & MONTHLY VAN) */}
                {/* ================================================= */}
                {activeMainTab === "places" && (
                    <div className="space-y-6">
                        {/* Places KPI Cards */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            <SummaryCard
                                title="Total Delivery Places"
                                value={places.length}
                                description="Mapped German locations"
                                icon={<FaMapMarkerAlt />}
                            />
                            <SummaryCard
                                title="Normal Delivery (5 km)"
                                value={normalPlacesCount}
                                description="Local 5 km radius"
                                icon={<FaTruck />}
                            />
                            <SummaryCard
                                title="Monthly Van Delivery"
                                value={vanPlacesCount}
                                description="Intercity monthly routes"
                                icon={<FaShippingFast />}
                            />
                            <SummaryCard
                                title="States Covered"
                                value={`${uniqueStatesCount} / 16`}
                                description="German Bundesländer"
                                icon={<FaCity />}
                            />
                        </div>

                        {/* Places Filter and Table Container */}
                        <div className="overflow-hidden rounded-2xl border border-tertiary/30 bg-white shadow-sm">
                            {/* Toolbar Header */}
                            <div className="border-b border-gray-100 p-5 sm:p-6 space-y-4">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            Places of Germany
                                        </h2>
                                        <p className="mt-0.5 text-xs text-gray-500">
                                            Authorized cities, states, state codes, and postal codes for normal delivery (5 km) and monthly van routes across Germany.
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={exportPlacesCsv}
                                            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
                                        >
                                            <FaDownload />
                                            Export CSV
                                        </button>
                                    </div>
                                </div>

                                {/* Filters Row */}
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    {/* Delivery Type Switcher Tabs */}
                                    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50/80 p-1">
                                        <button
                                            type="button"
                                            onClick={() => setPlacesDeliveryFilter("all")}
                                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                                placesDeliveryFilter === "all"
                                                    ? "bg-white text-gray-900 shadow-sm"
                                                    : "text-gray-500 hover:text-gray-800"
                                            }`}
                                        >
                                            All Places ({places.length})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPlacesDeliveryFilter("normal")}
                                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                                placesDeliveryFilter === "normal"
                                                    ? "bg-emerald-600 text-white shadow-sm"
                                                    : "text-emerald-700 hover:bg-emerald-50"
                                            }`}
                                        >
                                            <FaTruck size={12} />
                                            Normal Delivery (5 km) ({normalPlacesCount})
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPlacesDeliveryFilter("monthly_van")}
                                            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                                                placesDeliveryFilter === "monthly_van"
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "text-blue-700 hover:bg-blue-50"
                                            }`}
                                        >
                                            <FaShippingFast size={12} />
                                            Monthly Van ({vanPlacesCount})
                                        </button>
                                    </div>

                                    {/* Search and Dropdowns */}
                                    <div className="flex flex-wrap items-center gap-2">
                                        {/* Search Input */}
                                        <div className="relative min-w-[200px] flex-1 sm:w-60">
                                            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                                            <input
                                                type="text"
                                                value={placesSearchTerm}
                                                onChange={(e) => setPlacesSearchTerm(e.target.value)}
                                                placeholder="Search city, state, PLZ..."
                                                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-8 pr-3 text-xs text-gray-700 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
                                            />
                                        </div>

                                        {/* State Dropdown Filter */}
                                        <div className="relative">
                                            <select
                                                value={placesStateFilter}
                                                onChange={(e) => setPlacesStateFilter(e.target.value)}
                                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                aria-label="Filter by state"
                                            >
                                                <option value="all">All German States</option>
                                                {GERMAN_STATES.map((st) => (
                                                    <option key={st.code} value={st.code}>
                                                        {st.name} ({st.code})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Status Filter */}
                                        <div className="relative">
                                            <select
                                                value={placesStatusFilter}
                                                onChange={(e) => setPlacesStatusFilter(e.target.value)}
                                                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-medium text-gray-700 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                                aria-label="Filter by status"
                                            >
                                                <option value="all">All Statuses</option>
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Table */}
                            <CommonTable
                                title={
                                    placesDeliveryFilter === "normal"
                                        ? "Normal Delivery Places (Within 5 km)"
                                        : placesDeliveryFilter === "monthly_van"
                                        ? "Monthly Van Delivery Places"
                                        : "Places of Germany"
                                }
                                subtitle={`Showing ${filteredPlaces.length} of ${places.length} places`}
                                loading={placesLoading}
                                columns={[
                                    {
                                        key: "city",
                                        header: "City",
                                        sortable: true,
                                        render: (place) => (
                                            <div className="flex items-center gap-3">
                                                <div
                                                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                                                        place.deliveryType === "normal"
                                                            ? "bg-emerald-50 text-emerald-600"
                                                            : "bg-blue-50 text-blue-600"
                                                    }`}
                                                >
                                                    <FaCity size={15} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{place.city}</p>
                                                    {place.notes && (
                                                        <p className="mt-0.5 text-xs text-gray-400">{place.notes}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ),
                                    },
                                    {
                                        key: "state",
                                        header: "State",
                                        sortable: true,
                                        render: (place) => (
                                            <span className="font-medium text-gray-700">{place.state}</span>
                                        ),
                                    },
                                    {
                                        key: "stateCode",
                                        header: "State Code",
                                        sortable: true,
                                        align: "center",
                                        render: (place) => (
                                            <span className="inline-flex items-center rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-xs font-bold text-gray-700">
                                                {place.stateCode}
                                            </span>
                                        ),
                                    },
                                    {
                                        key: "postalCode",
                                        header: "Postal Code",
                                        sortable: true,
                                        render: (place) => (
                                            <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/15 bg-primary/5 px-2.5 py-1 font-mono text-xs font-bold text-primary">
                                                <FaMapMarkerAlt size={11} className="text-primary/70" />
                                                {place.postalCode}
                                            </span>
                                        ),
                                    },
                                    {
                                        key: "deliveryType",
                                        header: "Delivery Type",
                                        sortable: true,
                                        render: (place) =>
                                            place.deliveryType === "normal" ? (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-600/20">
                                                    <FaTruck size={12} />
                                                    Normal (Within 5 km)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-600/20">
                                                    <FaShippingFast size={12} />
                                                    Monthly Van
                                                </span>
                                            ),
                                    },
                                    {
                                        key: "status",
                                        header: "Status",
                                        sortable: true,
                                        align: "center",
                                        render: (place) => (
                                            <button
                                                type="button"
                                                onClick={() => togglePlaceStatus(place)}
                                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                                    place.status
                                                        ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                }`}
                                            >
                                                <span
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        place.status ? "bg-emerald-500" : "bg-gray-400"
                                                    }`}
                                                />
                                                {place.status ? "Active" : "Inactive"}
                                            </button>
                                        ),
                                    },
                                ]}
                                data={filteredPlaces}
                                total={filteredPlaces.length}
                                clientSide
                                showSearch={false}
                                showRowNumbers={false}
                                rowKey="id"
                                emptyMessage="No delivery places found"
                                emptyDescription="Add German places using the 'Add Place' button."
                                actions={(place) => (
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            onClick={() => openEditPlaceModal(place)}
                                            title="Edit place"
                                            aria-label={`Edit ${place.city} (${place.postalCode})`}
                                            className="rounded-lg p-2 text-gray-500 transition hover:bg-primary/5 hover:text-primary"
                                        >
                                            <FaEdit size={14} />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => openDeleteConfirmModal(place)}
                                            title="Delete place"
                                            aria-label={`Delete ${place.city} (${place.postalCode})`}
                                            className="rounded-lg p-2 text-gray-400 transition hover:bg-rose-50 hover:text-rose-600"
                                        >
                                            <FaTrash size={13} />
                                        </button>
                                    </div>
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* ================================================= */}
                {/* MODAL 1: ADD / EDIT DELIVERY CHARGE */}
                {/* ================================================= */}
                {isModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-sm"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) closeModal();
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        {editingType !== null ? <FaEdit /> : <FaTruck />}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {editingType !== null ? "Edit Delivery Charge" : "Add Delivery Charge"}
                                        </h2>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closeModal}
                                    aria-label="Close modal"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} noValidate>
                                <div className="space-y-5 p-6">
                                    {/* Delivery Type */}
                                    <div>
                                        <label
                                            htmlFor="delivery_type"
                                            className="mb-2 block text-sm font-semibold text-gray-700"
                                        >
                                            Delivery Type <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            id="delivery_type"
                                            name="delivery_type"
                                            value={formData.delivery_type}
                                            disabled={editingType !== null}
                                            onChange={(e) => handleTypeSelect(e.target.value)}
                                            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:bg-gray-50 disabled:text-gray-500"
                                        >
                                            <option value="normal">Normal Delivery (Within 5 km)</option>
                                            <option value="monthly_van">Monthly Van Delivery</option>
                                            <option value="courier">Courier Delivery</option>
                                        </select>
                                        {errors.delivery_type && (
                                            <p className="mt-1.5 text-xs text-red-500">{errors.delivery_type}</p>
                                        )}
                                    </div>

                                    {/* Price Increase Percentage */}
                                    <div>
                                        <label
                                            htmlFor="price_increase_percentage"
                                            className="mb-2 block text-sm font-semibold text-gray-700"
                                        >
                                            Product Price Increase (%) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaPercentage className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                                            <input
                                                id="price_increase_percentage"
                                                name="price_increase_percentage"
                                                type="number"
                                                min="0"
                                                step="1"
                                                value={formData.price_increase_percentage}
                                                onChange={handleInputChange}
                                                placeholder="Enter price increase percentage"
                                                className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${
                                                    errors.price_increase_percentage
                                                        ? "border-red-400 focus:border-red-400"
                                                        : "border-gray-200 focus:border-primary"
                                                }`}
                                            />
                                        </div>
                                        {errors.price_increase_percentage && (
                                            <p className="mt-1.5 text-xs text-red-500">{errors.price_increase_percentage}</p>
                                        )}
                                    </div>

                                    {/* Delivery Charge */}
                                    <div>
                                        <label
                                            htmlFor="delivery_charge"
                                            className="mb-2 block text-sm font-semibold text-gray-700"
                                        >
                                            Delivery Charge (€) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaEuroSign className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                                            <input
                                                id="delivery_charge"
                                                name="delivery_charge"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.delivery_charge}
                                                onChange={handleInputChange}
                                                placeholder="Enter delivery charge"
                                                className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${
                                                    errors.delivery_charge
                                                        ? "border-red-400 focus:border-red-400"
                                                        : "border-gray-200 focus:border-primary"
                                                }`}
                                            />
                                        </div>
                                        {errors.delivery_charge && (
                                            <p className="mt-1.5 text-xs text-red-500">{errors.delivery_charge}</p>
                                        )}
                                    </div>

                                    {/* Minimum Order Amount */}
                                    <div>
                                        <label
                                            htmlFor="minimum_order_amount"
                                            className="mb-2 block text-sm font-semibold text-gray-700"
                                        >
                                            Free Delivery Minimum (€) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaGift className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400" />
                                            <input
                                                id="minimum_order_amount"
                                                name="minimum_order_amount"
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={formData.minimum_order_amount}
                                                onChange={handleInputChange}
                                                placeholder="Enter minimum order amount"
                                                className={`w-full rounded-xl border py-3 pl-10 pr-4 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${
                                                    errors.minimum_order_amount
                                                        ? "border-red-400 focus:border-red-400"
                                                        : "border-gray-200 focus:border-primary"
                                                }`}
                                            />
                                        </div>
                                        {errors.minimum_order_amount && (
                                            <p className="mt-1.5 text-xs text-red-500">{errors.minimum_order_amount}</p>
                                        )}
                                    </div>

                                    {/* Status Switch */}
                                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
                                                {formData.status ? <FaToggleOn /> : <FaToggleOff />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    Delivery Status
                                                </p>
                                                <p className="mt-0.5 text-xs text-gray-500">
                                                    {formData.status
                                                        ? "This delivery type is active."
                                                        : "This delivery type is inactive."}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={formData.status}
                                            aria-label="Delivery status"
                                            onClick={() =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    status: !prev.status,
                                                }))
                                            }
                                            className={`relative h-6 w-11 rounded-full transition ${
                                                formData.status ? "bg-primary" : "bg-gray-300"
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                                                    formData.status ? "left-[22px]" : "left-0.5"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        disabled={saving}
                                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                                    >
                                        <FaSave />
                                        {saving ? "Saving..." : editingType !== null ? "Save Changes" : "Add Delivery Charge"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ================================================= */}
                {/* MODAL 2: ADD / EDIT GERMANY DELIVERY PLACE */}
                {/* ================================================= */}
                {isPlaceModalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-sm"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget && !placeSaving) closePlaceModal();
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
                        >
                            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                                        <FaMapMarkerAlt />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900">
                                            {editingPlaceId ? "Edit Delivery Place" : "Add Place of Germany"}
                                        </h2>
                                        <p className="text-xs text-gray-500">
                                            Configure location for normal delivery with 5 km or monthly van.
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={closePlaceModal}
                                    disabled={placeSaving}
                                    aria-label="Close modal"
                                    className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50"
                                >
                                    <FaTimes />
                                </button>
                            </div>

                            <form onSubmit={handlePlaceSubmit} noValidate>
                                <div className="space-y-4 p-6">
                                    {/* Delivery Type */}
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-700">
                                            Delivery Service <span className="text-red-500">*</span>
                                        </label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => handlePlaceDeliveryTypeSelect("normal")}
                                                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${
                                                    placeFormData.deliveryType === "normal"
                                                        ? "border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm"
                                                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                }`}
                                            >
                                                <FaTruck className={placeFormData.deliveryType === "normal" ? "text-emerald-600" : "text-gray-400"} />
                                                Normal (Within 5 km)
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handlePlaceDeliveryTypeSelect("monthly_van")}
                                                className={`flex items-center justify-center gap-2 rounded-xl border p-3 text-xs font-bold transition ${
                                                    placeFormData.deliveryType === "monthly_van"
                                                        ? "border-blue-600 bg-blue-50 text-blue-800 shadow-sm"
                                                        : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                                                }`}
                                            >
                                                <FaShippingFast className={placeFormData.deliveryType === "monthly_van" ? "text-blue-600" : "text-gray-400"} />
                                                Monthly Van
                                            </button>
                                        </div>
                                    </div>

                                    {/* City */}
                                    <div>
                                        <label
                                            htmlFor="place_city"
                                            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                                        >
                                            City <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="place_city"
                                            type="text"
                                            value={placeFormData.city}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setPlaceFormData((prev) => ({ ...prev, city: val }));
                                                setPlaceErrors((prev) => ({ ...prev, city: "" }));
                                            }}
                                            placeholder="e.g. Frankfurt am Main, München, Köln"
                                            className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${
                                                placeErrors.city
                                                    ? "border-red-400 focus:border-red-400"
                                                    : "border-gray-200 focus:border-primary"
                                            }`}
                                        />
                                        {placeErrors.city && (
                                            <p className="mt-1 text-xs text-red-500">{placeErrors.city}</p>
                                        )}
                                    </div>

                                    {/* State & State Code Grid */}
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                        <div className="sm:col-span-2">
                                            <label
                                                htmlFor="place_state"
                                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                                            >
                                                State (Bundesland) <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                id="place_state"
                                                value={placeFormData.state}
                                                onChange={(e) => handleStateSelect(e.target.value)}
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                            >
                                                {GERMAN_STATES.map((st) => (
                                                    <option key={st.code} value={st.name}>
                                                        {st.name} ({st.nameEn})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="place_state_code"
                                                className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                                            >
                                                State Code <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                id="place_state_code"
                                                type="text"
                                                maxLength={4}
                                                value={placeFormData.stateCode}
                                                onChange={(e) =>
                                                    setPlaceFormData((prev) => ({
                                                        ...prev,
                                                        stateCode: e.target.value.toUpperCase(),
                                                    }))
                                                }
                                                placeholder="e.g. HE, BY"
                                                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 font-mono text-sm uppercase text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                            />
                                        </div>
                                    </div>

                                    {/* Postal Code (PLZ) */}
                                    <div>
                                        <label
                                            htmlFor="place_postal_code"
                                            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                                        >
                                            Postal Code (PLZ) <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <FaMapMarkerAlt className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs text-gray-400" />
                                            <input
                                                id="place_postal_code"
                                                type="text"
                                                value={placeFormData.postalCode}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setPlaceFormData((prev) => ({ ...prev, postalCode: val }));
                                                    setPlaceErrors((prev) => ({ ...prev, postalCode: "" }));
                                                }}
                                                placeholder="e.g. 60311 or 80331"
                                                className={`w-full rounded-xl border py-2.5 pl-9 pr-4 font-mono text-sm text-gray-800 outline-none transition focus:ring-2 focus:ring-primary/10 ${
                                                    placeErrors.postalCode
                                                        ? "border-red-400 focus:border-red-400"
                                                        : "border-gray-200 focus:border-primary"
                                                }`}
                                            />
                                        </div>
                                        {placeErrors.postalCode && (
                                            <p className="mt-1 text-xs text-red-500">{placeErrors.postalCode}</p>
                                        )}
                                        <p className="mt-1 text-[11px] text-gray-400">
                                            Enter a 5-digit German postal code (PLZ).
                                        </p>
                                    </div>

                                    {/* Notes / Route */}
                                    <div>
                                        <label
                                            htmlFor="place_notes"
                                            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700"
                                        >
                                            Coverage Notes / Remarks <span className="text-xs font-normal text-gray-400">(optional)</span>
                                        </label>
                                        <input
                                            id="place_notes"
                                            type="text"
                                            value={placeFormData.notes}
                                            onChange={(e) =>
                                                setPlaceFormData((prev) => ({ ...prev, notes: e.target.value }))
                                            }
                                            placeholder="e.g. Within 5km radius, Route 1 (first Saturday), etc."
                                            className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        />
                                    </div>

                                    {/* Status Switch */}
                                    <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/70 p-3.5">
                                        <div>
                                            <p className="text-xs font-bold text-gray-800">
                                                Active Status
                                            </p>
                                            <p className="mt-0.5 text-[11px] text-gray-500">
                                                {placeFormData.status
                                                    ? "This place is currently active for delivery."
                                                    : "This place is temporarily inactive."}
                                            </p>
                                        </div>

                                        <button
                                            type="button"
                                            role="switch"
                                            aria-checked={placeFormData.status}
                                            onClick={() =>
                                                setPlaceFormData((prev) => ({
                                                    ...prev,
                                                    status: !prev.status,
                                                }))
                                            }
                                            className={`relative h-6 w-11 rounded-full transition ${
                                                placeFormData.status ? "bg-primary" : "bg-gray-300"
                                            }`}
                                        >
                                            <span
                                                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all ${
                                                    placeFormData.status ? "left-[22px]" : "left-0.5"
                                                }`}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/60 px-6 py-4 sm:flex-row sm:justify-end">
                                    <button
                                        type="button"
                                        onClick={closePlaceModal}
                                        disabled={placeSaving}
                                        className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>

                                    <button
                                        type="submit"
                                        disabled={placeSaving}
                                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-90 disabled:opacity-50"
                                    >
                                        <FaSave />
                                        {placeSaving
                                            ? "Saving..."
                                            : editingPlaceId
                                            ? "Update Place"
                                            : "Save Place"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ================================================= */}
                {/* DELETE PLACE CONFIRMATION MODAL */}
                {/* ================================================= */}
                {deleteConfirmPlace && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-gray-950/50 p-4 backdrop-blur-sm"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget && !deletingPlace) {
                                setDeleteConfirmPlace(null);
                            }
                        }}
                    >
                        <div
                            role="dialog"
                            aria-modal="true"
                            className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
                        >
                            <div className="flex items-center gap-3">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                                    <FaTrash size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        Delete Delivery Place
                                    </h3>
                                    <p className="text-xs text-gray-500">
                                        This action will remove the place from active delivery routing.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-3.5 text-sm text-gray-700">
                                <p>
                                    Are you sure you want to delete{" "}
                                    <span className="font-bold text-gray-900">
                                        {deleteConfirmPlace.city} ({deleteConfirmPlace.postalCode})
                                    </span>{" "}
                                    in {deleteConfirmPlace.state} ({deleteConfirmPlace.stateCode})?
                                </p>
                            </div>

                            <div className="mt-5 flex justify-end gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setDeleteConfirmPlace(null)}
                                    disabled={deletingPlace}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleDeletePlace}
                                    disabled={deletingPlace}
                                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700 disabled:opacity-50"
                                >
                                    {deletingPlace ? "Deleting..." : "Delete Place"}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Reusable Summary Card
const SummaryCard = ({ title, value, description, icon }) => (
    <div className="rounded-2xl border border-tertiary/30 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between gap-3">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
                    {value}
                </p>
                <p className="mt-1 text-xs text-gray-400">{description}</p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {icon}
            </div>
        </div>
    </div>
);

export default DeliveryCharges;

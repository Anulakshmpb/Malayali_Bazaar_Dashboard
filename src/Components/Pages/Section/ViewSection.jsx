
import React, {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    Link2,
    Trash2,
    Loader2,
    Plus,
    Search,
    ImagePlus,
    X,
    RefreshCw,
} from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { getFunctions, httpsCallable } from "firebase/functions";
import { db, app } from "../../Config/Firebase";

const functions = getFunctions(app, "europe-west1");
const manageSection = httpsCallable(functions, "manageSection");

function ProductAutocomplete({
    value,
    onChange,
    excludeIds = [],
}) {
    const [allProducts, setAllProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState(value || "");
    const [isOpen, setIsOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [error, setError] = useState("");

    const wrapperRef = useRef(null);
    const listRef = useRef(null);
    useEffect(() => {
        setLoading(true);
        setError("");

        const unsubscribe = onSnapshot(
            collection(db, "products"),
            (snapshot) => {
                const products = snapshot.docs.map((document) => ({
                    id: document.id,
                    ...document.data(),
                }));

                setAllProducts(products);
                setLoading(false);
            },
            (err) => {
                console.error("Failed to load products:", err);
                setError("Unable to load products from the database.");
                setLoading(false);
            }
        );

        return unsubscribe;
    }, []);

    useEffect(() => {
        setSearchTerm(value || "");
    }, [value]);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                wrapperRef.current &&
                !wrapperRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);

        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (highlightedIndex >= 0 && listRef.current) {
            const items =
                listRef.current.querySelectorAll("[data-option]");

            items[highlightedIndex]?.scrollIntoView({
                block: "nearest",
            });
        }
    }, [highlightedIndex]);

    const filteredProducts = allProducts.filter((product) => {
        if (excludeIds.includes(product.id)) return false;

        const search = searchTerm.trim().toLowerCase();

        if (!search) return true;

        const searchableText = [
            product.productName,
            product.brand,
            product.category,
            product.subCategory,
            product.productType,
            product.productSKU,
            product.productId,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchableText.includes(search);
    });

    const getProductImage = (product) =>
        product.thumbnail || product.images?.[0] || "";

    const handleSelect = (product) => {
        setSearchTerm(product.productName || "");
        setIsOpen(false);
        setHighlightedIndex(-1);
        onChange(product);
    };

    const handleInputChange = (event) => {
        const inputValue = event.target.value;

        setSearchTerm(inputValue);
        setIsOpen(true);
        setHighlightedIndex(-1);
        if (!inputValue.trim()) {
            onChange(null);
        } else {
            onChange(null);
        }
    };

    const handleKeyDown = (event) => {
        if (event.key === "Escape") {
            setIsOpen(false);
            setHighlightedIndex(-1);
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);

            setHighlightedIndex((previous) =>
                previous < filteredProducts.length - 1
                    ? previous + 1
                    : 0
            );
        } else if (event.key === "ArrowUp") {
            event.preventDefault();

            setHighlightedIndex((previous) =>
                previous > 0
                    ? previous - 1
                    : filteredProducts.length - 1
            );
        } else if (event.key === "Enter") {
            event.preventDefault();

            if (
                highlightedIndex >= 0 &&
                filteredProducts[highlightedIndex]
            ) {
                handleSelect(filteredProducts[highlightedIndex]);
            }
        }
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search size={15} className="text-slate-400" />
                </div>

                <input
                    type="text"
                    role="combobox"
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-expanded={isOpen}
                    autoComplete="off"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="Search products by name, brand, category..."
                    className="h-[42px] w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                />
            </div>

            {isOpen && (
                <div
                    ref={listRef}
                    role="listbox"
                    className="absolute left-0 right-0 top-full z-50 mt-1.5 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl"
                    style={{ scrollbarWidth: "thin" }}
                >
                    {loading ? (
                        <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-400">
                            <Loader2 size={16} className="animate-spin" />
                            Loading products...
                        </div>
                    ) : error ? (
                        <div className="px-4 py-6 text-center text-sm text-rose-600">
                            {error}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="py-6 text-center text-sm text-slate-400">
                            {searchTerm.trim()
                                ? "No matching products found."
                                : "No products available."}
                        </div>
                    ) : (
                        <div className="p-1">
                            {filteredProducts.map((product, index) => {
                                const image = getProductImage(product);
                                const highlighted =
                                    index === highlightedIndex;

                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        role="option"
                                        aria-selected={highlighted}
                                        data-option
                                        onClick={() => handleSelect(product)}
                                        className={`flex w-full items-center gap-3 rounded-lg border-none px-2.5 py-2 text-left transition-colors ${
                                            highlighted
                                                ? "bg-indigo-50 ring-1 ring-indigo-200"
                                                : "hover:bg-slate-50"
                                        }`}
                                    >
                                        <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                            {image ? (
                                                <img
                                                    src={image}
                                                    alt=""
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-slate-300">
                                                    <ImagePlus size={18} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-semibold text-slate-800">
                                                {product.productName ||
                                                    "Unnamed Product"}
                                            </p>

                                            <p className="mt-0.5 truncate text-xs text-slate-500">
                                                {[
                                                    product.brand,
                                                    product.category,
                                                    product.subCategory,
                                                ]
                                                    .filter(
                                                        (item) =>
                                                            item &&
                                                            item !== "general"
                                                    )
                                                    .join(" · ") ||
                                                    "Product"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// =====================================================
// VIEW SECTION
// =====================================================
export default function ViewSection() {
    const navigate = useNavigate();
    const location = useLocation();

    const sectionId = location.state?.sectionId;

    const [section, setSection] = useState(null);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const [loadingSection, setLoadingSection] = useState(true);
    const [savingProducts, setSavingProducts] = useState(false);
    const [addingProduct, setAddingProduct] = useState(false);
    const [removingId, setRemovingId] = useState(null);

    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    // --------------------------------------------------
    // FETCH SECTION FROM BACKEND
    // --------------------------------------------------
    const fetchSection = useCallback(async () => {
        if (!sectionId) {
            setError(
                "Section ID is missing. Return to Section Management and open a section again."
            );
            setLoadingSection(false);
            return;
        }

        setLoadingSection(true);
        setError("");

        try {
            const response = await manageSection({
                action: "list",
                fields: { sectionId },
            });

            const result = response.data;

            if (!result?.success) {
                throw new Error(
                    result?.message || "Unable to fetch section details."
                );
            }

            const foundSection = (result.data || []).find(
                (item) =>
                    (item.sectionId || item.id) === sectionId
            );

            if (!foundSection) {
                throw new Error("Section not found in the database.");
            }

            setSection(foundSection);
            setProducts(
                (foundSection.products || []).map((product) => ({
                    id: product.id,
                    productName: product.name,
                    name: product.name,
                }))
            );
        } catch (err) {
            console.error("Fetch section error:", err);
            setError(
                err?.message || "Unable to load section details."
            );
        } finally {
            setLoadingSection(false);
        }
    }, [sectionId]);

    useEffect(() => {
        fetchSection();
    }, [fetchSection]);

    const saveProductLinks = async (updatedProducts) => {
        if (!section) {
            throw new Error("Section details have not loaded yet.");
        }

        const id = section.sectionId || section.id;

        const productPayload = updatedProducts.map((product) => ({
            id: String(product.id),
            name: String(
                product.productName || product.name || ""
            ).trim(),
        }));

        const response = await manageSection({
            action: "update",
            fields: {
                sectionId: id,
                sectionName: section.sectionName,
                order: section.order,
                products: productPayload,
            },
        });

        if (!response.data?.success) {
            throw new Error(
                response.data?.message ||
                    "Failed to update linked products."
            );
        }

        setProducts(
            productPayload.map((product) => ({
                id: product.id,
                name: product.name,
                productName: product.name,
            }))
        );
    };

    // --------------------------------------------------
    // ADD PRODUCT
    // --------------------------------------------------
    const handleAddProduct = async (event) => {
        event.preventDefault();
        setError("");
        setNotice("");

        if (!selectedProduct) {
            setError("Please select a product from the search results.");
            return;
        }

        const alreadyLinked = products.some(
            (product) => product.id === selectedProduct.id
        );

        if (alreadyLinked) {
            setError("This product is already linked to the section.");
            return;
        }

        const productName = (
            selectedProduct.productName || ""
        ).trim();

        if (!productName) {
            setError("The selected product does not have a valid name.");
            return;
        }

        setAddingProduct(true);
        setSavingProducts(true);

        try {
            const updatedProducts = [
                ...products,
                {
                    id: selectedProduct.id,
                    productName,
                },
            ];

            await saveProductLinks(updatedProducts);

            setSelectedProduct(null);
            setNotice("Product linked to the section successfully.");
        } catch (err) {
            console.error("Add linked product error:", err);
            setError(
                err?.message || "Unable to link the product."
            );
        } finally {
            setAddingProduct(false);
            setSavingProducts(false);
        }
    };

    // --------------------------------------------------
    // REMOVE PRODUCT
    // --------------------------------------------------
    const handleRemoveProduct = async (product) => {
        const confirmed = window.confirm(
            `Remove "${product.productName}" from this section?`
        );

        if (!confirmed) return;

        setError("");
        setNotice("");
        setRemovingId(product.id);
        setSavingProducts(true);

        try {
            const updatedProducts = products.filter(
                (item) => item.id !== product.id
            );

            await saveProductLinks(updatedProducts);

            setNotice("Product removed from the section successfully.");
        } catch (err) {
            console.error("Remove linked product error:", err);
            setError(
                err?.message || "Unable to remove the linked product."
            );
        } finally {
            setRemovingId(null);
            setSavingProducts(false);
        }
    };
    return (
        
<div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
    <div className="mx-auto w-full max-w-5xl space-y-6">

        {/* PAGE HEADER */}
        <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-5 shadow-sm sm:px-7">
            <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-600">
                    Section Management
                </p>

                <h2 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    {loadingSection
                        ? "Loading section..."
                        : section?.sectionName || "Section"}
                </h2>

                {section && (
                    <p className="mt-2 text-sm text-slate-500">
                        Display order: {section.order}
                    </p>
                )}
            </div>

            <button
                type="button"
                onClick={fetchSection}
                disabled={loadingSection || savingProducts}
                title="Refresh section"
                aria-label="Refresh section"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
                <RefreshCw
                    size={18}
                    className={loadingSection ? "animate-spin" : ""}
                />
            </button>
        </div>

        {/* ERROR MESSAGE */}
        {error && (
            <div
                role="alert"
                className="flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
            >
                <span>{error}</span>

                <button
                    type="button"
                    onClick={() => setError("")}
                    aria-label="Dismiss error"
                    className="shrink-0 rounded-md p-1 transition hover:bg-rose-100"
                >
                    <X size={16} />
                </button>
            </div>
        )}

        {/* SUCCESS MESSAGE */}
        {notice && (
            <div
                role="status"
                className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
            >
                <span>{notice}</span>

                <button
                    type="button"
                    onClick={() => setNotice("")}
                    aria-label="Dismiss message"
                    className="shrink-0 rounded-md p-1 transition hover:bg-emerald-100"
                >
                    <X size={16} />
                </button>
            </div>
        )}

        {/* LOADING STATE */}
        {loadingSection ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 shadow-sm">
                <Loader2
                    size={28}
                    className="animate-spin text-indigo-600"
                />
                <p>Loading section details from the database...</p>
            </div>
        ) : section ? (
            <>
                {/* CENTERED LINKED PRODUCTS CARD */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                    {/* CARD HEADER */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-5 py-5 sm:px-7">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                                <Link2 size={21} />
                            </div>

                            <div>
                                <h3 className="text-lg font-bold text-slate-900">
                                    Linked Products
                                </h3>
                            </div>
                        </div>

                        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                            {products.length}{" "}
                            {products.length === 1 ? "Product" : "Products"}
                        </span>
                    </div>

                    {/* CARD CONTENT */}
                    <div className="space-y-6 p-5 sm:p-7">

                        {/* ADD PRODUCT FORM */}
                        <form
                            onSubmit={handleAddProduct}
                            className="flex flex-col gap-3 sm:flex-row sm:items-end"
                        >
                            <div className="min-w-0 flex-1 space-y-2">
                                <label className="block text-sm font-semibold text-slate-700">
                                    Select Product
                                </label>

                                <ProductAutocomplete
                                    value={selectedProduct?.productName || ""}
                                    onChange={setSelectedProduct}
                                    excludeIds={products.map(
                                        (product) => product.id
                                    )}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={
                                    addingProduct ||
                                    savingProducts ||
                                    !selectedProduct
                                }
                                className="inline-flex h-[42px] shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {addingProduct ? (
                                    <>
                                        <Loader2
                                            size={16}
                                            className="animate-spin"
                                        />
                                        Adding...
                                    </>
                                ) : (
                                    <>
                                        <Plus size={17} />
                                        Add Product
                                    </>
                                )}
                            </button>
                        </form>

                        {/* PRODUCTS TABLE */}
                        <div className="overflow-hidden rounded-xl border border-slate-200">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[560px] border-collapse text-left">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50">
                                            <th className="w-16 px-4 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                                                #
                                            </th>

                                            <th className="w-24 px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Image
                                            </th>

                                            <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Product Name
                                            </th>

                                            <th className="w-24 px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {savingProducts && products.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-4 py-12 text-center text-sm text-slate-500"
                                                >
                                                    <span className="inline-flex items-center gap-2">
                                                        <Loader2
                                                            size={17}
                                                            className="animate-spin"
                                                        />
                                                        Updating products...
                                                    </span>
                                                </td>
                                            </tr>
                                        )}

                                        {!savingProducts && products.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className="px-4 py-14 text-center"
                                                >
                                                    <div className="mx-auto flex max-w-sm flex-col items-center">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                                            <Link2 size={22} />
                                                        </div>

                                                        <p className="mt-3 text-sm font-semibold text-slate-700">
                                                            No products linked yet
                                                        </p>

                                                        <p className="mt-1 text-sm text-slate-500">
                                                            Select a product above to link it to this section.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                        {products.map((product, index) => (
                                            <tr
                                                key={product.id}
                                                className="transition-colors hover:bg-slate-50/70"
                                            >
                                                <td className="px-4 py-3 text-center text-sm font-medium text-slate-500">
                                                    {index + 1}
                                                </td>

                                                <td className="px-4 py-3">
                                                    <ProductThumbnail
                                                        productId={product.id}
                                                    />
                                                </td>

                                                <td className="px-4 py-3">
                                                    <span className="text-sm font-semibold text-slate-800">
                                                        {product.productName}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        type="button"
                                                        title="Remove product link"
                                                        aria-label={`Remove ${product.productName} from section`}
                                                        disabled={savingProducts}
                                                        onClick={() =>
                                                            handleRemoveProduct(product)
                                                        }
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-rose-500 transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                                    >
                                                        {removingId === product.id ? (
                                                            <Loader2
                                                                size={17}
                                                                className="animate-spin"
                                                            />
                                                        ) : (
                                                            <Trash2 size={17} />
                                                        )}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* SAVE STATUS */}
                        {savingProducts && (
                            <p className="flex items-center gap-2 text-xs text-slate-500">
                                <Loader2
                                    size={14}
                                    className="animate-spin"
                                />
                                Saving product links to the database...
                            </p>
                        )}
                    </div>
                </section>
            </>
        ) : (
            /* SECTION NOT FOUND */
            <div className="flex min-h-64 flex-col items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                    <Link2 size={24} />
                </div>

                <h3 className="mt-4 text-lg font-bold text-slate-800">
                    Section unavailable
                </h3>

                <p className="mt-2 max-w-sm text-sm text-slate-500">
                    The section details could not be loaded. Return to the sections page and try again.
                </p>

                <button
                    type="button"
                    onClick={() => navigate("/section")}
                    className="mt-5 inline-flex items-center justify-center rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                    Back to Sections
                </button>
            </div>
        )}
    </div>
</div>

    );
}

// =====================================================
// PRODUCT THUMBNAIL
// Resolves the image from the actual product document.
// =====================================================
function ProductThumbnail({ productId }) {
    const [image, setImage] = useState("");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(
            collection(db, "products"),
            (snapshot) => {
                const document = snapshot.docs.find(
                    (item) => item.id === productId
                );

                if (document) {
                    const product = document.data();

                    setImage(
                        product.thumbnail || product.images?.[0] || ""
                    );
                } else {
                    setImage("");
                }

                setLoading(false);
            },
            (error) => {
                console.error("Product image fetch error:", error);
                setImage("");
                setLoading(false);
            }
        );

        return unsubscribe;
    }, [productId]);

    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
            {loading ? (
                <Loader2
                    size={16}
                    className="animate-spin text-slate-400"
                />
            ) : image ? (
                <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                />
            ) : (
                <ImagePlus size={18} className="text-slate-300" />
            )}
        </div>
    );
}

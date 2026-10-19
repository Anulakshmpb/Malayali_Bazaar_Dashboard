
import React, { useEffect, useMemo, useState } from "react";
import {
    Search,
    X,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    Database,
    LoaderCircle,
} from "lucide-react";

export default function CommonTable({
    columns = [],
    data = [],
    total = 0,
    loading = false,
    onQueryChange,
    title = "Data Management",
    subtitle = "View and manage your records",
    searchPlaceholder = "Search records...",
    emptyMessage = "No records found",
    emptyDescription = "Try adjusting your search or check back later.",
    rowKey = "id",
    actions = null,
    headerActions = null,
    initialPageSize = 10,
    pageSizeOptions = [10, 25, 50, 100],
    showSearch = true,
    showPagination = true,
    showPageSize = true,
    showRowNumbers = true,
    clientSide = false,
    className = "",
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [sortBy, setSortBy] = useState("");
    const [sortDirection, setSortDirection] = useState("asc");
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(initialPageSize);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 350);

        return () => clearTimeout(timeout);
    }, [searchTerm]);

    useEffect(() => {
        if (clientSide || typeof onQueryChange !== "function") return;

        onQueryChange({
            search: debouncedSearch,
            sortBy,
            sortDirection,
            page,
            pageSize,
        });
    }, [
        debouncedSearch,
        sortBy,
        sortDirection,
        page,
        pageSize,
        clientSide,
        onQueryChange,
    ]);

    const sourceData = Array.isArray(data) ? data : [];
    const clientRows = useMemo(() => {
        if (!clientSide) return sourceData;

        const search = debouncedSearch.toLowerCase();
        let rows = sourceData.filter((row) =>
            Object.values(row ?? {}).some((value) =>
                String(value ?? "").toLowerCase().includes(search)
            )
        );

        if (sortBy) {
            rows = [...rows].sort((first, second) => {
                const firstValue = sortBy
                    .split(".")
                    .reduce((current, key) => current?.[key], first);
                const secondValue = sortBy
                    .split(".")
                    .reduce((current, key) => current?.[key], second);
                const firstNumber = Number(firstValue);
                const secondNumber = Number(secondValue);

                const comparison =
                    firstValue !== "" &&
                    secondValue !== "" &&
                    Number.isFinite(firstNumber) &&
                    Number.isFinite(secondNumber)
                        ? firstNumber - secondNumber
                        : String(firstValue ?? "").localeCompare(
                              String(secondValue ?? ""),
                              undefined,
                              { numeric: true, sensitivity: "base" }
                          );

                return sortDirection === "asc"
                    ? comparison
                    : -comparison;
            });
        }

        return rows;
    }, [
        clientSide,
        debouncedSearch,
        sourceData,
        sortBy,
        sortDirection,
    ]);

    const safeTotal = clientSide
        ? clientRows.length
        : Math.max(0, Number(total) || 0);
    const totalPages = Math.max(1, Math.ceil(safeTotal / pageSize));
    const safeData = clientSide
        ? clientRows.slice((page - 1) * pageSize, page * pageSize)
        : sourceData;

    useEffect(() => {
        if (clientSide && page > totalPages) {
            setPage(totalPages);
        }
    }, [clientSide, page, totalPages]);

    const startEntry = safeTotal === 0
        ? 0
        : (page - 1) * pageSize + 1;

    const endEntry = Math.min(
        page * pageSize,
        safeTotal
    );

    const visibleColumns = useMemo(
        () => columns.filter((column) => !column.hidden),
        [columns]
    );

    const handleSort = (column) => {
        if (!column.sortable || !column.key) return;

        if (sortBy === column.key) {
            setSortDirection((previous) =>
                previous === "asc" ? "desc" : "asc"
            );
        } else {
            setSortBy(column.key);
            setSortDirection("asc");
        }

        setPage(1);
    };

    const clearSearch = () => {
        setSearchTerm("");
        setDebouncedSearch("");
        setPage(1);
    };

    const changePageSize = (event) => {
        setPageSize(Number(event.target.value));
        setPage(1);
    };

    const getRowKey = (row, index) => {
        if (typeof rowKey === "function") {
            return rowKey(row, index);
        }

        return row?.[rowKey] ?? row?.id ?? row?._id ?? index;
    };

    const getCellValue = (row, column, index) => {
        if (typeof column.render === "function") {
            return column.render(row, index);
        }

        const value = column.key
            ?.split(".")
            .reduce(
                (current, key) => current?.[key],
                row
            );

        if (value === null || value === undefined || value === "") {
            return column.emptyValue ?? "—";
        }

        if (typeof value === "boolean") {
            return value ? "Yes" : "No";
        }

        if (
            typeof value === "object" &&
            !(value instanceof Date)
        ) {
            return JSON.stringify(value);
        }

        return value instanceof Date
            ? value.toLocaleDateString()
            : value;
    };

    const getPageNumbers = () => {
        const pages = [];
        const start = Math.max(1, page - 2);
        const end = Math.min(totalPages, page + 2);

        for (let number = start; number <= end; number += 1) {
            pages.push(number);
        }

        return pages;
    };

    const buttonBase =
        "inline-flex items-center justify-center rounded-xl border " +
        "transition-all duration-200 focus:outline-none focus:ring-2 " +
        "focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-40";

    return (
        <section
            className={`w-full min-w-0 overflow-hidden rounded-2xl border border-tertiary/40 bg-white shadow-sm ${className}`}
        >
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-tertiary/30 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Database size={19} strokeWidth={1.8} />
                        </div>

                        <div className="min-w-0">
                            <h2 className="text-lg font-bold tracking-tight text-gray-900 sm:text-xl">
                                {title}
                            </h2>

                            {subtitle && (
                                <p className="mt-1 text-sm text-secondary/70">
                                    {subtitle}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {headerActions && (
                    <div className="flex flex-wrap items-center gap-2">
                        {headerActions}
                    </div>
                )}
            </div>

            {/* Search toolbar */}
            {(showSearch || actions) && (
                <div className="flex flex-col gap-3 border-b border-tertiary/30 bg-white px-5 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center md:max-w-xl">
                        {showSearch && (
                            <div className="group relative w-full">
                                <Search
                                    size={18}
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-secondary/50 transition-colors group-focus-within:text-primary"
                                />

                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) => {
                                        setSearchTerm(event.target.value);
                                        setPage(1);
                                    }}
                                    placeholder={searchPlaceholder}
                                    aria-label="Search table records"
                                    className="w-full rounded-xl border border-tertiary/50 bg-slate-50/70 py-2.5 pl-10 pr-10 text-sm text-gray-800 outline-none transition-all placeholder:text-gray-400 hover:border-tertiary focus:border-primary/60 focus:bg-white focus:ring-4 focus:ring-primary/10"
                                />

                                {searchTerm && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        aria-label="Clear search"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-secondary/60 transition hover:bg-tertiary/20 hover:text-gray-900"
                                    >
                                        <X size={15} />
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {actions && (
                        <div className="flex flex-wrap items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="relative w-full overflow-x-auto">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                    <thead>
                        <tr className="border-b border-tertiary/40 bg-slate-50/90">
                            {showRowNumbers && (
                                <th
                                    scope="col"
                                    className="w-16 whitespace-nowrap px-5 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-secondary/80"
                                >
                                    #
                                </th>
                            )}

                            {visibleColumns.map((column) => {
                                const isSorted = sortBy === column.key;

                                return (
                                    <th
                                        key={column.key ?? column.header}
                                        scope="col"
                                        aria-sort={
                                            isSorted
                                                ? sortDirection === "asc"
                                                    ? "ascending"
                                                    : "descending"
                                                : "none"
                                        }
                                        className={`whitespace-nowrap px-5 py-4 text-[11px] font-bold uppercase tracking-wider text-secondary/80 ${
                                            column.headerClassName ?? ""
                                        } ${
                                            column.align === "right"
                                                ? "text-right"
                                                : column.align === "center"
                                                    ? "text-center"
                                                    : "text-left"
                                        }`}
                                    >
                                        {column.sortable ? (
                                            <button
                                                type="button"
                                                onClick={() => handleSort(column)}
                                                className={`inline-flex items-center gap-2 rounded-md text-left transition-colors hover:text-primary focus:outline-none focus:text-primary ${
                                                    isSorted
                                                        ? "text-primary"
                                                        : ""
                                                }`}
                                            >
                                                {column.header}

                                                {isSorted ? (
                                                    sortDirection === "asc" ? (
                                                        <ArrowUp size={14} />
                                                    ) : (
                                                        <ArrowDown size={14} />
                                                    )
                                                ) : (
                                                    <ArrowUpDown
                                                        size={13}
                                                        className="text-secondary/35"
                                                    />
                                                )}
                                            </button>
                                        ) : (
                                            column.header
                                        )}
                                    </th>
                                );
                            })}

                            {typeof actions === "function" && (
                                <th
                                    scope="col"
                                    className="whitespace-nowrap px-5 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-secondary/80"
                                >
                                    Actions
                                </th>
                            )}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-tertiary/20 bg-white">
                        {loading ? (
                            Array.from({ length: Math.min(pageSize, 6) }).map(
                                (_, rowIndex) => (
                                    <tr
                                        key={`skeleton-${rowIndex}`}
                                        className="animate-pulse"
                                    >
                                        {showRowNumbers && (
                                            <td className="px-5 py-5">
                                                <div className="mx-auto h-3 w-5 rounded bg-slate-200" />
                                            </td>
                                        )}

                                        {visibleColumns.map((column, colIndex) => (
                                            <td
                                                key={column.key ?? colIndex}
                                                className="px-5 py-5"
                                            >
                                                <div
                                                    className={`h-3 rounded-md bg-slate-200 ${
                                                        colIndex % 2 === 0
                                                            ? "w-28"
                                                            : "w-36"
                                                    }`}
                                                />
                                            </td>
                                        ))}

                                        {typeof actions === "function" && (
                                            <td className="px-5 py-5">
                                                <div className="ml-auto h-7 w-16 rounded-lg bg-slate-200" />
                                            </td>
                                        )}
                                    </tr>
                                )
                            )
                        ) : safeData.length > 0 ? (
                            safeData.map((row, rowIndex) => (
                                <tr
                                    key={getRowKey(row, rowIndex)}
                                    className="group transition-colors duration-150 hover:bg-slate-50/80"
                                >
                                    {showRowNumbers && (
                                        <td className="whitespace-nowrap px-5 py-4 text-center text-xs font-medium tabular-nums text-secondary/60">
                                            {(page - 1) * pageSize + rowIndex + 1}
                                        </td>
                                    )}

                                    {visibleColumns.map((column, colIndex) => (
                                        <td
                                            key={column.key ?? colIndex}
                                            className={`px-5 py-4 text-sm text-gray-700 ${
                                                column.cellClassName ?? ""
                                            } ${
                                                column.align === "right"
                                                    ? "text-right"
                                                    : column.align === "center"
                                                        ? "text-center"
                                                        : "text-left"
                                            }`}
                                        >
                                            {getCellValue(row, column, rowIndex)}
                                        </td>
                                    ))}

                                    {typeof actions === "function" && (
                                        <td className="whitespace-nowrap px-5 py-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {actions(row)}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={
                                        visibleColumns.length +
                                        (showRowNumbers ? 1 : 0) +
                                        (typeof actions === "function" ? 1 : 0)
                                    }
                                    className="px-6 py-20 text-center"
                                >
                                    <div className="mx-auto flex max-w-sm flex-col items-center">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-secondary/50">
                                            <Search size={25} strokeWidth={1.6} />
                                        </div>

                                        <h3 className="mt-4 text-sm font-bold text-gray-900">
                                            {debouncedSearch
                                                ? "No matching records"
                                                : emptyMessage}
                                        </h3>

                                        <p className="mt-1.5 text-sm leading-6 text-secondary/65">
                                            {debouncedSearch
                                                ? "Try another search term or clear your current search."
                                                : emptyDescription}
                                        </p>

                                        {debouncedSearch && (
                                            <button
                                                type="button"
                                                onClick={clearSearch}
                                                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary focus:outline-none focus:ring-4 focus:ring-primary/15"
                                            >
                                                <X size={15} />
                                                Clear search
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {loading && (
                    <div className="absolute right-4 top-4 flex items-center gap-2 rounded-lg border border-tertiary/30 bg-white/95 px-3 py-2 text-xs font-medium text-secondary shadow-sm">
                        <LoaderCircle
                            size={14}
                            className="animate-spin text-primary"
                        />
                        Loading records
                    </div>
                )}
            </div>

            {/* Footer */}
            {showPagination && (
                <div className="flex flex-col gap-4 border-t border-tertiary/30 bg-slate-50/60 px-5 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-secondary/80">
                        <p>
                            Showing{" "}
                            <span className="font-bold text-gray-900">
                                {startEntry}–{endEntry}
                            </span>{" "}
                            of{" "}
                            <span className="font-bold text-gray-900">
                                {safeTotal.toLocaleString()}
                            </span>{" "}
                            records
                        </p>

                        {showPageSize && (
                            <div className="flex items-center gap-2">
                                <label htmlFor="common-table-page-size">
                                    Rows:
                                </label>

                                <select
                                    id="common-table-page-size"
                                    value={pageSize}
                                    onChange={changePageSize}
                                    className="cursor-pointer rounded-lg border border-tertiary/50 bg-white px-2 py-1.5 text-xs font-medium text-gray-800 outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
                                >
                                    {pageSizeOptions.map((size) => (
                                        <option key={size} value={size}>
                                            {size}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage(1)}
                            aria-label="First page"
                            className={`${buttonBase} h-9 w-9 border-tertiary/50 bg-white text-secondary hover:border-primary/40 hover:bg-primary/5 hover:text-primary`}
                        >
                            <ChevronsLeft size={16} />
                        </button>

                        <button
                            type="button"
                            disabled={page <= 1 || loading}
                            onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                            aria-label="Previous page"
                            className={`${buttonBase} h-9 w-9 border-tertiary/50 bg-white text-secondary hover:border-primary/40 hover:bg-primary/5 hover:text-primary`}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {getPageNumbers().map((number) => (
                            <button
                                type="button"
                                key={number}
                                disabled={loading}
                                aria-current={page === number ? "page" : undefined}
                                onClick={() => setPage(number)}
                                className={`${buttonBase} h-9 min-w-9 px-2.5 text-xs font-semibold ${
                                    page === number
                                        ? "border-primary bg-primary text-white shadow-sm shadow-primary/20"
                                        : "border-tertiary/50 bg-white text-secondary hover:border-primary/40 hover:bg-primary/5 hover:text-primary"
                                }`}
                            >
                                {number}
                            </button>
                        ))}

                        <button
                            type="button"
                            disabled={page >= totalPages || loading}
                            onClick={() =>
                                setPage((previous) =>
                                    Math.min(totalPages, previous + 1)
                                )
                            }
                            aria-label="Next page"
                            className={`${buttonBase} h-9 w-9 border-tertiary/50 bg-white text-secondary hover:border-primary/40 hover:bg-primary/5 hover:text-primary`}
                        >
                            <ChevronRight size={16} />
                        </button>

                        <button
                            type="button"
                            disabled={page >= totalPages || loading}
                            onClick={() => setPage(totalPages)}
                            aria-label="Last page"
                            className={`${buttonBase} h-9 w-9 border-tertiary/50 bg-white text-secondary hover:border-primary/40 hover:bg-primary/5 hover:text-primary`}
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </section>
    );
}

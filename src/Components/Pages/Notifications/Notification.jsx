import React, { useState, useEffect, useMemo } from "react";
import {
    Bell,
    CalendarCheck,
    CheckCircle2,
    Clock,
    XCircle,
    MapPin,
    Phone,
    User,
    Calendar,
    Check,
    CheckCheck,
    Inbox,
    X,
    ArrowRight,
    Loader2,
    BellRing,
    RefreshCw,
} from "lucide-react";
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    writeBatch,
} from "firebase/firestore";
import { db } from "../../Config/Firebase";
const getDate = (value) => {
    if (!value) return null;
    try {
        const date =
            typeof value?.toDate === "function"
                ? value.toDate()
                : value instanceof Date
                    ? value
                    : new Date(value);

        return Number.isNaN(date.getTime()) ? null : date;
    } catch {
        return null;
    }
};

const formatTimeAgo = (value) => {
    const date = getDate(value);

    if (!date) return "Unknown date";

    const now = new Date();
    const diffMs = Math.max(0, now - date);

    const minutes = Math.floor(diffMs / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleString([], {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

const isToday = (value) => {
    const date = getDate(value);

    if (!date) return false;

    const today = new Date();

    return (
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()
    );
};

const getNotificationConfig = (notification) => {
    const title = notification?.title?.toLowerCase() || "";
    const type = notification?.type;

    if (
        title.includes("confirmed") ||
        title.includes("received")
    ) {
        return {
            icon: CalendarCheck,
            color: "text-green-600",
            bg: "bg-green-50",
            border: "border-green-100",
            label: "Booking update",
        };
    }

    switch (type) {
        case "success":
            return {
                icon: CheckCircle2,
                color: "text-green-600",
                bg: "bg-green-50",
                border: "border-green-100",
                label: "Success",
            };

        case "warning":
            return {
                icon: Clock,
                color: "text-amber-600",
                bg: "bg-amber-50",
                border: "border-amber-100",
                label: "Warning",
            };

        case "danger":
            return {
                icon: XCircle,
                color: "text-red-600",
                bg: "bg-red-50",
                border: "border-red-100",
                label: "Important",
            };

        default:
            return {
                icon: Bell,
                color: "text-primary",
                bg: "bg-primary/10",
                border: "border-primary/10",
                label: "Notification",
            };
    }
};

const NotificationStat = ({
    title,
    value,
    icon: Icon,
    description,
    iconColor,
    iconBg,
}) => {
    return (
        <div className="bg-white border border-tertiary/40 rounded-2xl p-5 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-sm font-medium text-secondary/70">{title}</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-2">
                        {value}
                    </h3>
                </div>

                <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconBg}`}
                >
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
            </div>

            <p className="text-xs text-secondary/70">{description}</p>
        </div>
    );
};

const NotificationItem = ({
    notification,
    onView,
    onMarkRead,
}) => {
    const config = getNotificationConfig(notification);
    const Icon = config.icon;

    const unread = notification.status === "Unread";

    return (
        <div
            onClick={onView}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onView();
                }
            }}
            className={`
        group relative bg-white border rounded-2xl p-5
        transition-all duration-300 cursor-pointer
        hover:shadow-md hover:-translate-y-[2px]
        ${unread
                    ? "border-primary/30 bg-primary/[0.025]"
                    : "border-tertiary/40"
                }
      `}
        >
            <div className="flex items-start gap-4">

                <div
                    className={`
            w-12 h-12 shrink-0 rounded-xl
            flex items-center justify-center
            border ${config.bg} ${config.border}
          `}
                >
                    <Icon className={`w-5 h-5 ${config.color}`} />
                </div>

                <div className="flex-1 min-w-0">

                    <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                            <div className="flex items-center flex-wrap gap-2">

                                <h4 className="text-sm font-bold text-gray-900 truncate">
                                    {notification.title || "Notification"}
                                </h4>

                                {unread && (
                                    <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                                )}

                            </div>

                            <p className="text-xs text-secondary/70 mt-1">
                                {config.label}
                            </p>

                        </div>

                        <span className="text-xs text-secondary/70 whitespace-nowrap shrink-0">
                            {formatTimeAgo(notification.createdAt)}
                        </span>

                    </div>

                    <p className="text-sm text-secondary/70 leading-relaxed mt-3 line-clamp-2">
                        {notification.message || "No additional message available."}
                    </p>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-tertiary/40">

                        <span
                            className={`
                text-xs font-medium
                ${unread ? "text-primary" : "text-secondary/70"}
              `}
                        >
                            {unread ? "Unread" : "Read"}
                        </span>

                        <div className="flex items-center gap-2">

                            {unread && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onMarkRead();
                                    }}
                                    className="
                    flex items-center gap-1.5
                    text-xs font-semibold text-secondary/70
                    hover:text-primary transition-colors
                    px-2 py-1.5 rounded-lg
                    hover:bg-primary/5
                  "
                                >
                                    <Check className="w-3.5 h-3.5" />
                                    Mark read
                                </button>
                            )}

                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onView();
                                }}
                                className="
                  flex items-center gap-1.5
                  text-xs font-semibold text-primary
                  px-2 py-1.5 rounded-lg
                  hover:bg-primary/5 transition-colors
                "
                            >
                                View details
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
};

const EmptyNotifications = ({ filter }) => {
    return (
        <div className="
      bg-white border border-tertiary/40 border-dashed
      rounded-2xl py-16 px-6
      flex flex-col items-center justify-center text-center
    ">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                <Inbox className="w-8 h-8 text-primary" />
            </div>

            <h3 className="text-base font-bold text-gray-900">
                No notifications found
            </h3>

            <p className="text-sm text-secondary/70 mt-2 max-w-sm">
                {filter === "Unread"
                    ? "You're all caught up! There are no unread notifications."
                    : filter === "Read"
                        ? "You haven't read any notifications yet."
                        : "When new updates arrive, they will appear here."}
            </p>
        </div>
    );
};

const NotificationDetailsModal = ({
    notification,
    onClose,
}) => {
    if (!notification) return null;

    const config = getNotificationConfig(notification);
    const Icon = config.icon;
    const details = notification.details;

    const DetailRow = ({ label, children }) => (
        <div className="flex items-start justify-between gap-4 py-3 border-b border-tertiary/40 last:border-0">
            <span className="text-xs font-medium text-secondary/70 shrink-0">
                {label}
            </span>

            <div className="text-sm font-semibold text-gray-900 text-right min-w-0">
                {children || "N/A"}
            </div>
        </div>
    );

    return (
        <div
            className="
        fixed inset-0 z-[150]
        bg-slate-950/50 backdrop-blur-sm
        flex items-center justify-center
        p-4
      "
            onClick={onClose}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="notification-modal-title"
                onClick={(e) => e.stopPropagation()}
                className="
          bg-white w-full max-w-xl
          rounded-2xl border border-tertiary/40
          shadow-2xl overflow-hidden
          max-h-[90vh] flex flex-col
          animate-in zoom-in-95 duration-200
        "
            >

                <div className="flex items-center justify-between p-6 border-b border-tertiary/40">

                    <div className="flex items-center gap-3">

                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${config.bg}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                        </div>

                        <div>
                            <h3
                                id="notification-modal-title"
                                className="text-base font-bold text-gray-900"
                            >
                                Notification Details
                            </h3>

                            <p className="text-xs text-secondary/70 mt-1">
                                {formatTimeAgo(notification.createdAt)}
                            </p>
                        </div>

                    </div>

                    <button
                        onClick={onClose}
                        className="w-9 h-9 rounded-xl flex items-center justify-center text-secondary/70 hover:bg-primary/10 hover:text-gray-900 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>

                </div>

                <div className="p-6 overflow-y-auto space-y-5">

                    <div>
                        <h4 className="text-lg font-bold text-gray-900">
                            {notification.title || "Notification"}
                        </h4>

                        <p className="text-sm text-secondary/70 mt-2 leading-relaxed whitespace-pre-line">
                            {notification.message || "No message available."}
                        </p>
                    </div>

                    {details && (
                        <>


                            <div className="bg-slate-50 border border-tertiary/40 rounded-xl p-4">

                                <div className="flex items-center gap-2 mb-3">
                                    <CalendarCheck className="w-4 h-4 text-primary" />

                                    <h5 className="text-sm font-bold text-gray-900">
                                        Booking Information
                                    </h5>
                                </div>

                                <DetailRow label="Booking No">
                                    {details.bookingNo}
                                </DetailRow>

                                <DetailRow label="Route Name">
                                    {details.routeName}
                                </DetailRow>

                                <DetailRow label="Starting Point">
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-primary" />
                                        {details.startingPoint}
                                    </span>
                                </DetailRow>

                                <DetailRow label="Drop Point">
                                    <span className="inline-flex items-center gap-1">
                                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                                        {details.dropPoint}
                                    </span>
                                </DetailRow>

                                <DetailRow label="Journey Date">
                                    {details.date}
                                </DetailRow>

                                <DetailRow label="Departure">
                                    {details.departureTime}
                                </DetailRow>

                                <DetailRow label="Arrival">
                                    {details.arrivalTime}
                                </DetailRow>

                                <DetailRow label="Driver">
                                    {details.driverName}
                                </DetailRow>

                            </div>
                            <div className="bg-slate-50 border border-tertiary/40 rounded-xl p-4">

                                <div className="flex items-center gap-2 mb-3">
                                    <User className="w-4 h-4 text-primary" />

                                    <h5 className="text-sm font-bold text-gray-900">
                                        Customer Information
                                    </h5>
                                </div>

                                <DetailRow label="Booked By">
                                    {details.userName}
                                </DetailRow>

                                <DetailRow label="Contact">
                                    <span className="inline-flex items-center gap-1">
                                        <Phone className="w-3.5 h-3.5" />
                                        {details.userPhone}
                                    </span>
                                </DetailRow>

                                <DetailRow label="Passengers">
                                    {details.passengerCount}
                                </DetailRow>

                                {Array.isArray(details.passengers) &&
                                    details.passengers.length > 0 && (

                                        <div className="pt-4">
                                            <h6 className="text-xs font-bold text-secondary/70 mb-3">
                                                Passenger List
                                            </h6>

                                            <div className="space-y-2">

                                                {details.passengers.map((passenger, index) => (
                                                    <div
                                                        key={`${passenger.mobile || "passenger"}-${index}`}
                                                        className="flex items-center justify-between gap-3 bg-white border border-tertiary/40 rounded-lg p-3"
                                                    >
                                                        <span className="text-xs font-semibold text-gray-900">
                                                            {passenger.name || "N/A"}
                                                        </span>

                                                        <span className="text-xs text-secondary/70">
                                                            {passenger.mobile || "N/A"}
                                                        </span>
                                                    </div>
                                                ))}

                                            </div>
                                        </div>

                                    )}

                            </div>

                        </>
                    )}

                </div>

                <div className="p-5 border-t border-tertiary/40">
                    <button
                        onClick={onClose}
                        className="
              w-full bg-primary text-white
              rounded-xl py-3 text-sm font-semibold
              hover:opacity-90 transition-all
            "
                    >
                        Close Notification
                    </button>
                </div>

            </div>
        </div>
    );
};

export const Notification = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [filter, setFilter] = useState("All");
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        const notificationQuery = query(
            collection(db, "admin_notification"),
            orderBy("createdAt", "desc")
        );

        const unsubscribe = onSnapshot(
            notificationQuery,
            (snapshot) => {
                const data = snapshot.docs.map((item) => ({
                    id: item.id,
                    ...item.data(),
                }));

                setNotifications(data);
                setLoading(false);
                setError("");
            },
            (err) => {
                console.error("Error fetching notifications:", err);

                setError("Unable to load notifications. Please try again.");
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const unreadCount = useMemo(
        () =>
            notifications.filter(
                (item) => item.status === "Unread"
            ).length,
        [notifications]
    );

    const readCount = notifications.length - unreadCount;

    const todayCount = useMemo(
        () =>
            notifications.filter(
                (item) => isToday(item.createdAt)
            ).length,
        [notifications]
    );


    const filteredNotifications = useMemo(() => {
        if (filter === "Unread") {
            return notifications.filter(
                (item) => item.status === "Unread"
            );
        }

        if (filter === "Read") {
            return notifications.filter(
                (item) => item.status !== "Unread"
            );
        }

        return notifications;
    }, [notifications, filter]);

    const todayNotifications = filteredNotifications.filter(
        (item) => isToday(item.createdAt)
    );

    const olderNotifications = filteredNotifications.filter(
        (item) => !isToday(item.createdAt)
    );


    const handleMarkRead = async (id) => {
        try {
            await updateDoc(
                doc(db, "admin_notification", id),
                { status: "Read" }
            );
        } catch (err) {
            console.error("Error marking notification as read:", err);
            alert("Unable to update notification. Please try again.");
        }
    };
    const handleMarkAllRead = async () => {
        const unreadNotifications = notifications.filter(
            (item) => item.status === "Unread"
        );

        if (!unreadNotifications.length || updating) return;

        setUpdating(true);

        try {
            for (
                let i = 0;
                i < unreadNotifications.length;
                i += 500
            ) {
                const batch = writeBatch(db);

                unreadNotifications
                    .slice(i, i + 500)
                    .forEach((item) => {
                        batch.update(
                            doc(db, "admin_notification", item.id),
                            { status: "Read" }
                        );
                    });

                await batch.commit();
            }
        } catch (err) {
            console.error("Error marking all as read:", err);
            alert("Unable to mark all notifications as read.");
        } finally {
            setUpdating(false);
        }
    };


    const handleViewNotification = async (notification) => {
        setSelectedNotif(notification);

        if (notification.status === "Unread") {
            await handleMarkRead(notification.id);
        }
    };


    if (loading) {
        return (
            <main className="min-h-[400px] bg-white px-4 py-10 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />

                    <p className="text-sm text-secondary/70">
                        Loading notifications...
                    </p>
                </div>
            </main>
        );
    }

  
    return (
        <>
            <main className="min-h-screen bg-white px-4 pb-10 pt-4 sm:px-6"><div className="mx-auto max-w-6xl space-y-6">

                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 mb-8">

                    <div className="flex items-start gap-4">

                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <BellRing className="w-5 h-5 text-primary" />
                        </div>

                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-br from-gray-900 to-secondary text-transparent bg-clip-text">
                                Notifications
                            </h1>
                        </div>

                    </div>

                    <div className="flex items-center gap-3">

                        <button
                            onClick={() => window.location.reload()}
                            className="
                flex items-center gap-2
                px-4 py-2.5 rounded-xl
                border border-tertiary/40 bg-white
                text-sm font-medium text-gray-900
                hover:bg-primary/5 transition-colors
              "
                        >
                            <RefreshCw className="w-4 h-4" />
                            Refresh
                        </button>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                disabled={updating}
                                className="
                  flex items-center gap-2
                  px-4 py-2.5 rounded-xl
                  bg-primary text-white
                  text-sm font-semibold
                  hover:opacity-90 transition-all
                  disabled:opacity-50
                "
                            >
                                {updating ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <CheckCheck className="w-4 h-4" />
                                )}

                                {updating ? "Updating..." : "Mark all as read"}
                            </button>
                        )}

                    </div>

                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">

                    <NotificationStat
                        title="Total Notifications"
                        value={notifications.length}
                        icon={Bell}
                        description="All received notifications"
                        iconColor="text-primary"
                        iconBg="bg-primary/10"
                    />

                    <NotificationStat
                        title="Unread"
                        value={unreadCount}
                        icon={BellRing}
                        description="Notifications waiting for review"
                        iconColor="text-amber-600"
                        iconBg="bg-amber-50"
                    />

                    <NotificationStat
                        title="Read"
                        value={readCount}
                        icon={CheckCircle2}
                        description="Notifications already reviewed"
                        iconColor="text-green-600"
                        iconBg="bg-green-50"
                    />

                    <NotificationStat
                        title="Today"
                        value={todayCount}
                        icon={Calendar}
                        description="Notifications received today"
                        iconColor="text-blue-600"
                        iconBg="bg-blue-50"
                    />

                </div>

                <section className="bg-white border border-tertiary/40 rounded-2xl p-5 md:p-6">

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">

                        <div>
                            <h2 className="text-base font-bold text-gray-900">
                                Recent Activity
                            </h2>

                            <p className="text-xs text-secondary/70 mt-1">
                                View and manage your latest notifications.
                            </p>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-50 border border-tertiary/40 rounded-xl p-1">

                            {["All", "Unread", "Read"].map((item) => (
                                <button
                                    key={item}
                                    onClick={() => setFilter(item)}
                                    className={`
                    px-4 py-2 rounded-lg
                    text-xs font-semibold
                    transition-all duration-200
                    ${filter === item
                                            ? "bg-primary text-white shadow-sm"
                                            : "text-secondary/70 hover:text-gray-900 hover:bg-primary/5"
                                        }
                  `}
                                >
                                    {item}

                                    {item === "Unread" && unreadCount > 0 && (
                                        <span className="ml-1.5">
                                            ({unreadCount})
                                        </span>
                                    )}
                                </button>
                            ))}

                        </div>

                    </div>

                    {filteredNotifications.length === 0 ? (
                        <EmptyNotifications filter={filter} />
                    ) : (
                        <div className="space-y-7">

                            {todayNotifications.length > 0 && (
                                <div>

                                    <div className="flex items-center gap-3 mb-4">

                                        <span className="text-xs font-bold uppercase tracking-wider text-secondary/70">
                                            Today
                                        </span>

                                        <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md">
                                            {todayNotifications.length}
                                        </span>

                                        <div className="flex-1 h-px bg-tertiary/40" />

                                    </div>

                                    <div className="space-y-3">

                                        {todayNotifications.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onView={() =>
                                                    handleViewNotification(notification)
                                                }
                                                onMarkRead={() =>
                                                    handleMarkRead(notification.id)
                                                }
                                            />
                                        ))}

                                    </div>

                                </div>
                            )}

                            {olderNotifications.length > 0 && (
                                <div>

                                    <div className="flex items-center gap-3 mb-4">

                                        <span className="text-xs font-bold uppercase tracking-wider text-secondary/70">
                                            Older Notifications
                                        </span>

                                        <span className="text-[10px] font-semibold bg-slate-50 text-secondary/70 px-2 py-1 rounded-md">
                                            {olderNotifications.length}
                                        </span>

                                        <div className="flex-1 h-px bg-tertiary/40" />

                                    </div>

                                    <div className="space-y-3">

                                        {olderNotifications.map((notification) => (
                                            <NotificationItem
                                                key={notification.id}
                                                notification={notification}
                                                onView={() =>
                                                    handleViewNotification(notification)
                                                }
                                                onMarkRead={() =>
                                                    handleMarkRead(notification.id)
                                                }
                                            />
                                        ))}

                                    </div>

                                </div>
                            )}

                        </div>
                    )}

                    {notifications.length > 0 && (
                        <div className="mt-6 pt-5 border-t border-tertiary/40 flex items-center justify-between">

                            <p className="text-xs text-secondary/70">
                                Showing {filteredNotifications.length} of{" "}
                                {notifications.length} notifications
                            </p>

                            <div className="flex items-center gap-1.5 text-xs text-green-600 font-medium">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                Live updates enabled
                            </div>

                        </div>
                    )}

                </section>

            </div></main>
            {selectedNotif && (
                <NotificationDetailsModal
                    notification={selectedNotif}
                    onClose={() => setSelectedNotif(null)}
                />
            )}

        </>
    );
};
export default Notification;

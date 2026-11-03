import {
    useCallback,
    useEffect,
    useRef,
    useState
} from "react";
import {
    getToken,
    onMessage
} from "firebase/messaging";
import {
    doc,
    runTransaction,
    Timestamp
} from "firebase/firestore";

import { db } from "../../Config/Firebase";
import { getFirebaseMessaging } from "../../Config/Messaging";

const VAPID_KEY =
    process.env.REACT_APP_FIREBASE_VAPID_KEY;

const SERVICE_WORKER_PATH =
    "/firebase-messaging-sw.js";

const useFcmSubscription = (
    userId,
    collectionName = "users"
) => {
    const [permission, setPermission] = useState(
        typeof Notification !== "undefined"
            ? Notification.permission
            : "denied"
    );

    const [isSubscribed, setIsSubscribed] = useState(false);

    const [loading, setLoading] = useState(false);

    const [error, setError] = useState(null);

    const [foregroundMessage, setForegroundMessage] =
        useState(null);

    const [serviceWorkerMessage, setServiceWorkerMessage] =
        useState(null);

    const unsubscribeMessageRef = useRef(null);


    const saveWebFcmToken = useCallback(
        async (token) => {
            if (!userId || !token) {
                throw new Error(
                    "User ID or FCM token is missing."
                );
            }

            const userRef = doc(
                db,
                collectionName,
                userId
            );

            await runTransaction(db, async (transaction) => {
                const userSnapshot =
                    await transaction.get(userRef);

                if (!userSnapshot.exists()) {
                    throw new Error(
                        "User document does not exist."
                    );
                }

                const userData = userSnapshot.data();

                const fcmTokenData =
                    userData.fcmToken || {};

                const currentWebTokens =
                    Array.isArray(fcmTokenData.web)
                        ? fcmTokenData.web
                        : [];

                const now = Timestamp.now();

                const existingToken =
                    currentWebTokens.find(
                        (item) => item.token === token
                    );

                const updatedWebTokens = existingToken
                    ? currentWebTokens.map((item) =>
                        item.token === token
                            ? {
                                ...item,
                                updatedAt: now
                            }
                            : item
                    )
                    : [
                        ...currentWebTokens,
                        {
                            token,
                            createdAt: now,
                            updatedAt: now
                        }
                    ];

                transaction.update(userRef, {
                    "fcmToken.web": updatedWebTokens,
                    updatedAt: now
                });
            });

            return true;
        },
        [userId, collectionName]
    );

    // --------------------------------------------------
    // REGISTER SERVICE WORKER AND SUBSCRIBE
    // --------------------------------------------------

    const subscribe = useCallback(
        async (requestPermission = false) => {
            if (!userId) {
                setError("User is not logged in.");
                return false;
            }

            if (!("serviceWorker" in navigator)) {
                setError(
                    "Service workers are not supported in this browser."
                );

                return false;
            }

            if (!("Notification" in window)) {
                setError(
                    "Notifications are not supported in this browser."
                );

                return false;
            }

            if (!VAPID_KEY) {
                setError(
                    "Firebase VAPID key is missing."
                );

                return false;
            }

            setLoading(true);
            setError(null);

            try {
                let currentPermission =
                    Notification.permission;
                if (
                    requestPermission &&
                    currentPermission === "default"
                ) {
                    currentPermission =
                        await Notification.requestPermission();
                }

                setPermission(currentPermission);

                if (currentPermission !== "granted") {
                    setIsSubscribed(false);

                    if (currentPermission === "denied") {
                        setError(
                            "Notification permission is blocked. Enable it in browser settings."
                        );
                    }

                    return false;
                }
                const serviceWorkerRegistration =
                    await navigator.serviceWorker.register(
                        SERVICE_WORKER_PATH
                    );

                await navigator.serviceWorker.ready;

                const messaging =
                    await getFirebaseMessaging();

                if (!messaging) {
                    throw new Error(
                        "Firebase Messaging is not supported."
                    );
                }
                const token = await getToken(messaging, {
                    vapidKey: VAPID_KEY,
                    serviceWorkerRegistration
                });

                if (!token) {
                    throw new Error(
                        "Unable to generate FCM token."
                    );
                }
                await saveWebFcmToken(token);

                setPermission("granted");
                setIsSubscribed(true);

                return true;

            } catch (err) {
                console.error(
                    "FCM subscription error:",
                    err
                );

                setError(
                    err?.message ||
                    "Failed to enable notifications."
                );

                setIsSubscribed(false);

                return false;

            } finally {
                setLoading(false);
            }
        },
        [userId, saveWebFcmToken]
    );

    // --------------------------------------------------
    // AUTOMATIC TOKEN REGISTRATION
    // --------------------------------------------------

    useEffect(() => {
        if (!userId) {
            setIsSubscribed(false);
            setForegroundMessage(null);
            setServiceWorkerMessage(null);
            return;
        }

        if (
            typeof Notification !== "undefined" &&
            Notification.permission === "granted"
        ) {
            subscribe(false);
        } else {
            setPermission(
                typeof Notification !== "undefined"
                    ? Notification.permission
                    : "denied"
            );
        }
    }, [userId, subscribe]);

    // --------------------------------------------------
    // FOREGROUND FCM MESSAGES
    // --------------------------------------------------

    useEffect(() => {
        let isMounted = true;

        const setupForegroundListener = async () => {
            if (!userId) return;

            try {
                const messaging =
                    await getFirebaseMessaging();

                if (!messaging || !isMounted) return;

                unsubscribeMessageRef.current?.();

                unsubscribeMessageRef.current = onMessage(
                    messaging,
                    (payload) => {
                        console.log(
                            "[FCM] Foreground message:",
                            payload
                        );

                        const data = payload.data || {};

                        const message = {
                            title:
                                data.title ||
                                payload.notification?.title ||
                                "New Notification",

                            body:
                                data.body ||
                                payload.notification?.body ||
                                "",

                            type: data.type || "GENERAL",

                            url: data.url || "/",

                            orderId:
                                data.orderId ||
                                data.bookingId ||
                                "",

                            notificationId:
                                data.notificationId || null,

                            receivedAt: new Date()
                        };

                        setForegroundMessage(message);
                    }
                );

            } catch (err) {
                console.error(
                    "Foreground notification listener error:",
                    err
                );
            }
        };

        setupForegroundListener();

        return () => {
            isMounted = false;

            unsubscribeMessageRef.current?.();

            unsubscribeMessageRef.current = null;
        };
    }, [userId]);

    // --------------------------------------------------
    // SERVICE WORKER MESSAGES
    // --------------------------------------------------

    useEffect(() => {
        if (!userId || !("serviceWorker" in navigator)) {
            return;
        }

        const handleServiceWorkerMessage = (event) => {
            const message = event.data;

            if (
                message?.type !== "FCM_NOTIFICATION_CLICK"
            ) {
                return;
            }

            console.log(
                "[FCM] Notification clicked:",
                message.data
            );

            setServiceWorkerMessage({
                ...message.data,
                receivedAt: new Date()
            });
        };

        navigator.serviceWorker.addEventListener(
            "message",
            handleServiceWorkerMessage
        );

        return () => {
            navigator.serviceWorker.removeEventListener(
                "message",
                handleServiceWorkerMessage
            );
        };
    }, [userId]);

    // --------------------------------------------------
    // REFRESH TOKEN WHEN USER RETURNS TO DASHBOARD
    // --------------------------------------------------

    useEffect(() => {
        if (!userId) return;

        const handleFocus = () => {
            if (
                typeof Notification !== "undefined" &&
                Notification.permission === "granted"
            ) {
                subscribe(false);
            }
        };

        window.addEventListener("focus", handleFocus);

        return () => {
            window.removeEventListener(
                "focus",
                handleFocus
            );
        };
    }, [userId, subscribe]);

    return {
        subscribe,
        isSubscribed,
        loading,
        error,
        permission,
        foregroundMessage,
        setForegroundMessage,
        serviceWorkerMessage,
        setServiceWorkerMessage
    };
};

export default useFcmSubscription;

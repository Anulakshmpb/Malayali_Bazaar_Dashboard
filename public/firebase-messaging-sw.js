/* eslint-env serviceworker */
/* eslint-disable no-restricted-globals */
/* global firebase */

const serviceWorkerScope = self;

importScripts(
    "https://www.gstatic.com/firebasejs/13.0.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/13.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "YOUR_FIREBASE_API_KEY",
    authDomain: "malayali-bazaar.firebaseapp.com",
    projectId: "malayali-bazaar",
    storageBucket: "malayali-bazaar.firebasestorage.app",
    messagingSenderId: "173521641394",
    appId: "1:173521641394:web:ef550238b527132091ceab"
});

const messaging = firebase.messaging();

// --------------------------------------------------
// BACKGROUND MESSAGE HANDLER
// --------------------------------------------------

messaging.onBackgroundMessage((payload) => {
    console.log(
        "[FCM Service Worker] Background message received:",
        payload
    );

    const data = payload.data || {};

    const title = data.title || "Malayali Bazaar";

    const options = {
        body: data.body || "You have a new notification.",
        icon: data.icon || "/logo192.png",
        badge: "/logo192.png",

        data: {
            url: data.url || "/",
            notificationId: data.notificationId || "",
            type: data.type || "GENERAL",
            orderId: data.orderId || data.bookingId || ""
        },

        tag: data.notificationId || undefined,
        renotify: false
    };

    return serviceWorkerScope.registration.showNotification(
        title,
        options
    );
});

// --------------------------------------------------
// NOTIFICATION CLICK HANDLER
// --------------------------------------------------

serviceWorkerScope.addEventListener("notificationclick", (event) => {

    event.notification.close();

    const notificationData = event.notification.data || {};

    const targetUrl = notificationData.url || "/";

    let url;

    try {
        url = new URL(
            targetUrl,
            serviceWorkerScope.location.origin
        );
    } catch (error) {
        console.error("[FCM] Invalid notification URL:", error);
        return;
    }
    if (url.origin !== serviceWorkerScope.location.origin) {
        console.warn("[FCM] External notification URL blocked.");
        return;
    }

    event.waitUntil(
        (async () => {

            const windowClients =
                await serviceWorkerScope.clients.matchAll({
                    type: "window",
                    includeUncontrolled: true
                });

            for (const client of windowClients) {

                if (
                    new URL(client.url).origin ===
                    serviceWorkerScope.location.origin
                ) {

                    await client.navigate(url.href);

                    await client.focus();

                    client.postMessage({
                        type: "FCM_NOTIFICATION_CLICK",
                        data: notificationData
                    });

                    return;
                }
            }

            await serviceWorkerScope.clients.openWindow(url.href);

        })()
    );
});

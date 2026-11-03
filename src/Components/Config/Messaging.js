
import { getMessaging, isSupported } from "firebase/messaging";
import { app } from "./Firebase";

let messagingInstance = null;

export const getFirebaseMessaging = async () => {
    try {
        const supported = await isSupported();
        if (!supported) {
            console.warn(
                "Firebase Cloud Messaging is not supported in this browser."
            );
            return null;
        }
        if (!messagingInstance) {
            messagingInstance = getMessaging(app);
        }

        return messagingInstance;

    } catch (error) {
        console.error(
            "Firebase Messaging initialization failed:",
            error
        );

        return null;
    }
};

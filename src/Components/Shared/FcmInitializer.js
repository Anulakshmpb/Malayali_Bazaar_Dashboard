
import React, { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import useFcmSubscription from "./hooks/UseFcmSubscription";
import { auth } from "../Config/Firebase";

const FcmInitializer = () => {
    const [userId, setUserId] = React.useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUserId(user?.uid || null);
        });

        return () => unsubscribe();
    }, []);

    const {
        subscribe,
        isSubscribed,
        permission,
        loading,
        error,
    } = useFcmSubscription(userId);

    useEffect(() => {
        if (permission === "granted" && !isSubscribed && userId) {
            subscribe(false);
        }
    }, [permission, isSubscribed, userId, subscribe]);

    return null;
};

export default FcmInitializer;

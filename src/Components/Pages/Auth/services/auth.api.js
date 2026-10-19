import { doc, getDoc } from "firebase/firestore";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth, db } from "../../../Config/Firebase";

// ==================== AUTHENTICATION FUNCTIONS ==================== //

export const adminLogin = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const adminRef = doc(db, 'adminUsers', user.uid);
        const adminSnap = await getDoc(adminRef);

        if (!adminSnap.exists()) {
            await signOut(auth);
            return {
                success: false,
                error: 'Access denied. Admin only.',
            };
        }
        
        const adminData = adminSnap.data();
        if (adminData.uid !== user.uid) {
            await signOut(auth);
            return {
                success: false,
                error: 'Account disabled. Contact admin.',
            };
        }
        
        return {
            success: true,
            user: userCredential.user,
        };
    } catch (error) {
        console.error("Login Error:", error);
        let errorMessage = "An error occurred during login. Please try again.";

        if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
            errorMessage = 'User not found or invalid credentials.';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Incorrect password.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed login attempts. Please try again later.';
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = 'Network error. Please check your connection.';
        }

        return {
            success: false,
            error: errorMessage,
        };
    }
}

export const adminLogout = async () => {
    await signOut(auth);
    return {
        success: true,
    };
}
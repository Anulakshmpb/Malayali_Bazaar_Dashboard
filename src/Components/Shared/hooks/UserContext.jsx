import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import {
  doc,
  onSnapshot,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '../../Config/Firebase';

export const UserContext = createContext(null);

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

// Aliases for developer convenience
export const useAuth = useUser;
export const useUserContext = useUser;

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null); // Firebase Auth User
  const [adminUser, setAdminUser] = useState(null); // Firestore adminUsers document
  const [permissions, setPermissions] = useState(null); // Linked permissions document
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper to resolve permissions document by permissionId or role name
  const loadPermissionsForAdmin = useCallback(async (adminData) => {
    const role = String(adminData.role || '').trim().toLowerCase();
    const isSuper =
      role === 'super admin' ||
      role === 'superadmin' ||
      role === 'owner' ||
      role === 'master admin';

    if (isSuper) {
      setPermissions({ permissions: ['*'] });
      setLoading(false);
      return null;
    }

    // 1. If admin has a permissionId, try to load/listen to it
    if (adminData.permissionId) {
      try {
        const permDocRef = doc(db, 'permissions', adminData.permissionId);
        const permUnsub = onSnapshot(
          permDocRef,
          async (permSnap) => {
            if (permSnap.exists()) {
              setPermissions({
                id: permSnap.id,
                ...permSnap.data(),
              });
              setLoading(false);
            } else {
              // Fallback: look up by role name
              await fallbackPermissionsByRole(adminData.role);
            }
          },
          async (permErr) => {
            console.error('Permission doc listener error:', permErr);
            await fallbackPermissionsByRole(adminData.role);
          }
        );
        return permUnsub;
      } catch (err) {
        console.error('Error attaching permission listener:', err);
        await fallbackPermissionsByRole(adminData.role);
        return null;
      }
    }

    // 2. If no permissionId, fallback to role name lookup
    await fallbackPermissionsByRole(adminData.role);
    return null;
  }, []);

  const fallbackPermissionsByRole = async (roleName) => {
    if (!roleName) {
      setPermissions(null);
      setLoading(false);
      return;
    }

    try {
      const q = query(
        collection(db, 'permissions'),
        where('permissionName', '==', roleName)
      );
      const snap = await getDocs(q);

      if (!snap.empty) {
        const d = snap.docs[0];
        setPermissions({ id: d.id, ...d.data() });
      } else {
        // Try roleName field
        const q2 = query(
          collection(db, 'permissions'),
          where('roleName', '==', roleName)
        );
        const snap2 = await getDocs(q2);
        if (!snap2.empty) {
          const d2 = snap2.docs[0];
          setPermissions({ id: d2.id, ...d2.data() });
        } else {
          setPermissions(null);
        }
      }
    } catch (err) {
      console.error('Error fetching permissions by role:', err);
      setPermissions(null);
    } finally {
      setLoading(false);
    }
  };

  // Real-time synchronization with Firebase Auth and Firestore adminUsers collection
  useEffect(() => {
    let unsubscribeAdminDoc = null;
    let unsubscribePermissionDoc = null;

    setLoading(true);

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (unsubscribeAdminDoc) {
          unsubscribeAdminDoc();
          unsubscribeAdminDoc = null;
        }
        if (unsubscribePermissionDoc) {
          unsubscribePermissionDoc();
          unsubscribePermissionDoc = null;
        }

        if (!currentUser) {
          setUser(null);
          setAdminUser(null);
          setPermissions(null);
          setError(null);
          setLoading(false);
          return;
        }

        setUser(currentUser);

        try {
          const adminDocRef = doc(db, 'adminUsers', currentUser.uid);

          unsubscribeAdminDoc = onSnapshot(
            adminDocRef,
            async (adminSnap) => {
              if (adminSnap.exists()) {
                const adminData = {
                  id: adminSnap.id,
                  ...adminSnap.data(),
                };
                setAdminUser(adminData);
                setError(null);

                if (unsubscribePermissionDoc) {
                  unsubscribePermissionDoc();
                  unsubscribePermissionDoc = null;
                }

                const permUnsub = await loadPermissionsForAdmin(adminData);
                if (permUnsub) {
                  unsubscribePermissionDoc = permUnsub;
                }
              } else {
                // Fallback: Check if document exists where uid == currentUser.uid
                try {
                  const adminQuery = query(
                    collection(db, 'adminUsers'),
                    where('uid', '==', currentUser.uid)
                  );
                  const querySnap = await getDocs(adminQuery);

                  if (!querySnap.empty) {
                    const firstDoc = querySnap.docs[0];
                    const fallbackData = {
                      id: firstDoc.id,
                      ...firstDoc.data(),
                    };
                    setAdminUser(fallbackData);
                    setError(null);

                    if (unsubscribePermissionDoc) {
                      unsubscribePermissionDoc();
                      unsubscribePermissionDoc = null;
                    }

                    const permUnsub = await loadPermissionsForAdmin(fallbackData);
                    if (permUnsub) {
                      unsubscribePermissionDoc = permUnsub;
                    }
                  } else {
                    console.warn(
                      `No admin record found in 'adminUsers' for UID: ${currentUser.uid}`
                    );
                    setAdminUser(null);
                    setPermissions(null);
                    setError('Admin user record not found in adminUsers.');
                    setLoading(false);
                  }
                } catch (queryErr) {
                  console.error('Error during fallback admin lookup:', queryErr);
                  setAdminUser(null);
                  setPermissions(null);
                  setError(queryErr.message || 'Error querying admin record.');
                  setLoading(false);
                }
              }
            },
            (err) => {
              console.error('Error listening to adminUsers document:', err);
              setError(err.message || 'Failed to listen to admin record.');
              setLoading(false);
            }
          );
        } catch (err) {
          console.error('Error initializing admin user listener:', err);
          setError(err.message);
          setLoading(false);
        }
      },
      (authErr) => {
        console.error('Firebase Auth error in UserContext:', authErr);
        setUser(null);
        setAdminUser(null);
        setPermissions(null);
        setError(authErr.message);
        setLoading(false);
      }
    );

    return () => {
      unsubscribeAuth();
      if (unsubscribeAdminDoc) unsubscribeAdminDoc();
      if (unsubscribePermissionDoc) unsubscribePermissionDoc();
    };
  }, [loadPermissionsForAdmin]);

  // Logout handler
  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      setUser(null);
      setAdminUser(null);
      setPermissions(null);
      setError(null);
    } catch (err) {
      console.error('Error signing out:', err);
      throw err;
    }
  }, []);

  // Manual refresh helper
  const refreshAdminUser = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    try {
      const adminDocRef = doc(db, 'adminUsers', currentUser.uid);
      const snap = await getDoc(adminDocRef);

      if (snap.exists()) {
        const data = { id: snap.id, ...snap.data() };
        setAdminUser(data);
        await loadPermissionsForAdmin(data);
        return data;
      }
      return null;
    } catch (err) {
      console.error('Error refreshing admin record:', err);
      throw err;
    }
  }, [loadPermissionsForAdmin]);

  // Permission checker for routes
  const hasPermission = useCallback(
    (routePath) => {
      if (!adminUser) return false;

      // Super Admin bypasses all route permission checks
      const role = String(adminUser.role || '').trim().toLowerCase();
      if (
        role === 'super admin' ||
        role === 'superadmin' ||
        role === 'owner' ||
        role === 'master admin'
      ) {
        return true;
      }

      const cleanPath = String(routePath || '').split('?')[0].split('#')[0];
      if (!cleanPath) return false;

      const allowed =
        permissions?.permissions || permissions?.allowedRoutes || [];
      if (!Array.isArray(allowed) || allowed.length === 0) {
        return false;
      }

      // Wildcard check
      if (allowed.includes('*')) return true;

      // Direct exact match
      if (allowed.includes(cleanPath)) return true;

      // Pattern match (e.g. /customer-ledger/view/:id)
      const matchesPattern = allowed.some((pattern) => {
        if (!pattern.includes(':')) return false;
        const regexPattern = pattern
          .replace(/:[a-zA-Z0-9_]+/g, '[^/]+')
          .replace(/\//g, '\\/');
        return new RegExp(`^${regexPattern}$`).test(cleanPath);
      });
      if (matchesPattern) return true;

      // Parent route check: e.g. if allowed has '/orders', allow subviews like '/orders/view'
      const matchesParent = allowed.some((parentRoute) => {
        if (!parentRoute || parentRoute === '/' || parentRoute.includes(':')) {
          return false;
        }
        return cleanPath.startsWith(parentRoute + '/');
      });
      if (matchesParent) return true;

      return false;
    },
    [adminUser, permissions]
  );

  const allowedRoutes = useMemo(() => {
    if (!adminUser) return [];
    const role = String(adminUser.role || '').trim().toLowerCase();
    if (
      role === 'super admin' ||
      role === 'superadmin' ||
      role === 'owner' ||
      role === 'master admin'
    ) {
      return ['*'];
    }
    return permissions?.permissions || permissions?.allowedRoutes || [];
  }, [adminUser, permissions]);

  const value = useMemo(
    () => ({
      user,
      adminUser,
      adminData: adminUser,
      currentUser: adminUser,
      permissions,
      allowedRoutes,
      loading,
      error,
      isAuthenticated: Boolean(user && adminUser),
      isAdmin: Boolean(adminUser && adminUser.status !== 'inactive'),
      isActive: adminUser?.status === 'active',
      role: adminUser?.role || '',
      name: adminUser?.name || '',
      email: adminUser?.email || user?.email || '',
      mobile: adminUser?.mobile || '',
      logout,
      refreshAdminUser,
      hasPermission,
    }),
    [
      user,
      adminUser,
      permissions,
      allowedRoutes,
      loading,
      error,
      logout,
      refreshAdminUser,
      hasPermission,
    ]
  );

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export default UserContext;

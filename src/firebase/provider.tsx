
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

interface UserAuthState {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  orgId: string | null;
  allowedLocs: string[];
  role: string | null;
}

export interface FirebaseContextState extends UserAuthState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  locId: string | null;
  setLoc: (loc: any) => void;
}

export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userState, setUserState] = useState<UserAuthState>({
    user: null,
    isUserLoading: true,
    userError: null,
    orgId: null,
    allowedLocs: [],
    role: null
  });

  const [locId, setLocId] = useState<string | null>(null);

  useEffect(() => {
    const savedLoc = localStorage.getItem('restauranteFlow_locId');
    if (savedLoc) setLocId(savedLoc);
  }, []);

  const setLoc = (loc: any) => {
    const id = loc?.id || null;
    setLocId(id);
    if (id) {
      localStorage.setItem('restauranteFlow_locId', id);
    } else {
      localStorage.removeItem('restauranteFlow_locId');
    }
  };

  useEffect(() => {
    if (!auth) return;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Usamos onSnapshot para el perfil del usuario para asegurar sincronización instantánea
        const unsubscribeUser = onSnapshot(doc(firestore, 'users', firebaseUser.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUserState({
              user: firebaseUser,
              isUserLoading: false,
              userError: null,
              orgId: userData?.orgId || null,
              allowedLocs: userData?.allowedLocIds || [],
              role: userData?.role || 'user'
            });
          } else {
            // Si el documento no existe todavía, mantenemos el estado de carga brevemente
            // o lo marcamos como perfil incompleto si ya pasó tiempo (aquí lo marcamos para el UI)
            setUserState(prev => ({ ...prev, user: firebaseUser, isUserLoading: false, orgId: null }));
          }
        }, (error) => {
          console.error("Error fetching user profile:", error);
          setUserState(prev => ({ ...prev, user: firebaseUser, isUserLoading: false }));
        });

        return () => unsubscribeUser();
      } else {
        setUserState({ user: null, isUserLoading: false, userError: null, orgId: null, allowedLocs: [], role: null });
        setLoc(null);
      }
    });

    return () => unsubscribeAuth();
  }, [auth, firestore]);

  const contextValue = useMemo(() => ({
    ...userState,
    areServicesAvailable: !!(firebaseApp && firestore && auth),
    firebaseApp,
    firestore,
    auth,
    locId,
    setLoc
  }), [firebaseApp, firestore, auth, userState, locId]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) throw new Error('useFirebase must be used within a FirebaseProvider.');
  return context;
};

export const useAuth = () => useFirebase().auth!;
export const useFirestore = () => useFirebase().firestore!;
export const useUser = () => {
  const { user, isUserLoading, userError, orgId, role } = useFirebase();
  return { user, isUserLoading, userError, orgId, role };
};

export const useTenant = () => {
  const { orgId, locId, setLoc, allowedLocs } = useFirebase();
  return { orgId, locId, setLoc, allowedLocs };
};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T & {__memo?: boolean} {
  const memoized = useMemo(factory, deps);
  if(typeof memoized !== 'object' || memoized === null) return memoized as any;
  (memoized as any).__memo = true;
  return memoized as any;
}

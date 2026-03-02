
'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
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
    allowedLocs: []
  });

  const [locId, setLocId] = useState<string | null>(null);

  useEffect(() => {
    // Restaurar locId de localStorage
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

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Intentar obtener el orgId del documento del usuario
          const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
          const userData = userDoc.data();
          
          setUserState({
            user: firebaseUser,
            isUserLoading: false,
            userError: null,
            orgId: userData?.orgId || firebaseUser.uid,
            allowedLocs: userData?.allowedLocIds || []
          });
        } catch (e) {
          setUserState(prev => ({ ...prev, user: firebaseUser, isUserLoading: false }));
        }
      } else {
        setUserState({ user: null, isUserLoading: false, userError: null, orgId: null, allowedLocs: [] });
        setLoc(null);
      }
    });
    return () => unsubscribe();
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
  const { user, isUserLoading, userError, orgId } = useFirebase();
  return { user, isUserLoading, userError, orgId };
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

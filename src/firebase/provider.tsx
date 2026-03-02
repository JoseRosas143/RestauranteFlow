
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { UserProfile, Organization, Location } from '@/lib/types';

interface FirebaseContextProps {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
  user: User | null;
  profile: UserProfile | null;
  currentOrg: Organization | null;
  currentLoc: Location | null;
  setLoc: (loc: Location | null) => void;
  loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextProps | null>(null);

export function FirebaseProvider({ 
  children, 
  app, 
  db, 
  auth 
}: { 
  children: React.ReactNode; 
  app: FirebaseApp; 
  db: Firestore; 
  auth: Auth;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentLoc, setCurrentLoc] = useState<Location | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        // En un app real buscaríamos el perfil en orgs/X/users/Y
        // Para el prototipo, simulamos un perfil de admin multi-sucursal
        const mockProfile: UserProfile = {
          uid: u.uid,
          role: 'admin',
          orgId: 'org_demo',
          allowedLocIds: ['loc_norte', 'loc_sur']
        };
        setProfile(mockProfile);

        const orgDoc = await getDoc(doc(db, 'orgs', mockProfile.orgId));
        if (orgDoc.exists()) {
          setCurrentOrg({ id: orgDoc.id, ...orgDoc.data() } as Organization);
        } else {
          setCurrentOrg({ id: 'org_demo', name: 'ChoripanFlow Corp' });
        }
        
        // Recuperar locación guardada
        const savedLocId = localStorage.getItem('preferred_loc');
        if (savedLocId && mockProfile.allowedLocIds.includes(savedLocId)) {
          const locDoc = await getDoc(doc(db, 'orgs', mockProfile.orgId, 'locations', savedLocId));
          if (locDoc.exists()) {
            setCurrentLoc({ id: locDoc.id, ...locDoc.data() } as Location);
          }
        }
      } else {
        setProfile(null);
        setCurrentOrg(null);
        setCurrentLoc(null);
      }
      setLoading(false);
    });
  }, [auth, db]);

  const setLoc = (loc: Location | null) => {
    setCurrentLoc(loc);
    if (loc) localStorage.setItem('preferred_loc', loc.id);
  };

  return (
    <FirebaseContext.Provider value={{ 
      app, db, auth, user, profile, currentOrg, currentLoc, setLoc, loading 
    }}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
};

export const useFirestore = () => useFirebase().db;
export const useAuth = () => useFirebase().auth;
export const useTenant = () => {
  const { currentOrg, currentLoc, setLoc, profile } = useFirebase();
  return { 
    orgId: currentOrg?.id, 
    locId: currentLoc?.id, 
    setLoc, 
    allowedLocs: profile?.allowedLocIds || [],
    role: profile?.role
  };
};

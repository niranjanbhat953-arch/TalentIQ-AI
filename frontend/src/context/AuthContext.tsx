import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { api } from '../lib/api';
import { UserProfile } from '../types';

interface AuthContextType {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  idToken: string | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signInAsDemoRecruiter: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [idToken, setIdToken] = useState<string | null>(localStorage.getItem('talentiq_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync token with API client
  useEffect(() => {
    api.setToken(idToken);
    if (idToken) {
      localStorage.setItem('talentiq_token', idToken);
    } else {
      localStorage.removeItem('talentiq_token');
    }
  }, [idToken]);

  const fetchProfile = async () => {
    try {
      const p = await api.getMe();
      setProfile(p);
    } catch (err: any) {
      console.warn("Could not fetch user profile:", err);
    }
  };

  useEffect(() => {
    // Check if demo user is active
    const demoToken = localStorage.getItem('talentiq_demo_user');
    if (demoToken) {
      setIdToken(demoToken);
      api.setToken(demoToken);
      fetchProfile().finally(() => setLoading(false));
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setError(null);
      if (fbUser) {
        try {
          const token = await fbUser.getIdToken();
          setUser(fbUser);
          setIdToken(token);
          api.setToken(token);

          // Sync user in backend Firestore
          const synced = await api.syncUser({
            displayName: fbUser.displayName || undefined,
            photoUrl: fbUser.photoURL || undefined,
          });
          setProfile(synced);
        } catch (err: any) {
          setError(err.message || 'Failed to authenticate user.');
        }
      } else {
        setUser(null);
        setIdToken(null);
        setProfile(null);
        api.setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token = await result.user.getIdToken();
      setUser(result.user);
      setIdToken(token);
      api.setToken(token);

      const synced = await api.syncUser({
        displayName: result.user.displayName || undefined,
        photoUrl: result.user.photoURL || undefined,
      });
      setProfile(synced);
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signInAsDemoRecruiter = async () => {
    setLoading(true);
    setError(null);
    try {
      const demoToken = "dev-token-recruiter_alex_turner";
      localStorage.setItem('talentiq_demo_user', demoToken);
      setIdToken(demoToken);
      api.setToken(demoToken);

      const synced = await api.syncUser({
        displayName: "Alex Turner",
        photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
        organization: "TalentIQ Enterprise Team",
      });
      setProfile(synced);
    } catch (err: any) {
      setError(err.message || 'Demo Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      localStorage.removeItem('talentiq_demo_user');
      localStorage.removeItem('talentiq_token');
      await firebaseSignOut(auth);
      setUser(null);
      setIdToken(null);
      setProfile(null);
      api.setToken(null);
    } catch (err: any) {
      setError(err.message || 'Sign-Out failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        idToken,
        loading,
        error,
        signInWithGoogle,
        signInAsDemoRecruiter,
        signOut,
        refreshProfile: fetchProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

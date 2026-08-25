"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  updateProfile,
} from "firebase/auth";
import { toast } from "react-hot-toast";
import { auth, firebaseReady, googleProvider } from "@/lib/firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  createAccount: (email: string, password: string, name?: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  sendVerification: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth || !firebaseReady) return;

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
      if (nextUser) {
        void nextUser.getIdToken().then((token) => fetch("/api/auth/session", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })).catch(() => undefined);
      } else {
        void fetch("/api/auth/session", { method: "DELETE" }).catch(() => undefined);
      }
    });

    return () => unsubscribe();
  }, []);

  // If auth/fb isn't ready, drop loading once we know that.
  useEffect(() => {
    if (auth && firebaseReady) return;
    const timer = window.setTimeout(() => setLoading(false), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const signInWithGoogle = async () => {
    if (!auth || !googleProvider) {
      toast.error("Firebase authentication is not configured yet.");
      return;
    }

    await signInWithPopup(auth, googleProvider);
    toast.success("Signed in with Google");
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!auth) {
      toast.error("Firebase authentication is not configured yet.");
      return;
    }

    await signInWithEmailAndPassword(auth, email, password);
    toast.success("Signed in successfully");
  };

  const createAccount = async (email: string, password: string, name?: string) => {
    if (!auth) {
      toast.error("Firebase authentication is not configured yet.");
      return;
    }

    const credential = await createUserWithEmailAndPassword(auth, email, password);
    if (name?.trim()) await updateProfile(credential.user, { displayName: name.trim() });
    await sendEmailVerification(credential.user);
    toast.success("Account created successfully");
  };

  const resetPassword = async (email: string) => {
    if (!auth) return void toast.error("Firebase authentication is not configured yet.");
    await sendPasswordResetEmail(auth, email);
    toast.success("Password reset email sent");
  };

  const sendVerification = async () => {
    if (!auth?.currentUser) return void toast.error("Sign in first");
    await sendEmailVerification(auth.currentUser);
    toast.success("Verification email sent");
  };

  const signOutUser = async () => {
    if (!auth) {
      toast.error("Firebase authentication is not configured yet.");
      return;
    }

    await signOut(auth);
    await fetch("/api/auth/session", { method: "DELETE" });
    toast.success("Signed out");
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      signInWithGoogle,
      signInWithEmail,
      createAccount,
      resetPassword,
      sendVerification,
      signOutUser,
    }),
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

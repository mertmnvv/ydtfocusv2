"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Firestore'da kullanıcı profili oluştur/güncelle
  async function ensureUserProfile(firebaseUser) {
    if (!firebaseUser) return null;
    const userRef = doc(db, "users", firebaseUser.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      // Yeni kullanıcı: profil oluştur
      const profile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Kullanıcı",
        photoURL: firebaseUser.photoURL || null,
        role: "user",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };
      await setDoc(userRef, profile);
      return profile;
    } else {
      // Mevcut kullanıcı: lastLogin güncelle
      await setDoc(userRef, { lastLogin: serverTimestamp() }, { merge: true });
      return userSnap.data();
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const profile = await ensureUserProfile(firebaseUser);
        setUserProfile(profile);
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Email/Password ile kayıt
  async function register(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    return result;
  }

  // Email/Password ile giriş
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google ile giriş
  async function loginWithGoogle() {
    return signInWithPopup(auth, googleProvider);
  }

  // Çıkış
  async function logout() {
    setUser(null);
    setUserProfile(null);
    return signOut(auth);
  }

  const value = {
    user,
    userProfile,
    loading,
    register,
    login,
    loginWithGoogle,
    logout,
    isAdmin: userProfile?.role === "admin",
    authModalOpen,
    setAuthModalOpen,
    requireAuth: (action) => {
      if (user) {
        return action();
      } else {
        setAuthModalOpen(true);
      }
    }
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

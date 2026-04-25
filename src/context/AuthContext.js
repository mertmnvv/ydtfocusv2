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
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { incrementStudyMinutes } from "@/lib/firestore";

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
        searchName: (firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Kullanıcı").toLowerCase(),
        photoURL: firebaseUser.photoURL || null,
        role: "free",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      };
      await setDoc(userRef, profile);
      return profile;
    } else {
      // Mevcut kullanıcı: lastLogin güncelle
      const updates = { lastLogin: serverTimestamp() };
      
      // Eğer mevcut isim generic ise ve Firebase Auth'da daha iyi bir isim varsa güncelle
      const currentData = userSnap.data();
      let dName = currentData.displayName;

      if ((!currentData.displayName || currentData.displayName === "Kullanıcı") && firebaseUser.displayName) {
        updates.displayName = firebaseUser.displayName;
        dName = firebaseUser.displayName;
      }
      if (!currentData.photoURL && firebaseUser.photoURL) {
        updates.photoURL = firebaseUser.photoURL;
      }

      // Her durumda searchName'i kontrol et/ekle
      if (!currentData.searchName || updates.displayName) {
        updates.searchName = (dName || "Kullanıcı").toLowerCase();
      }

      await setDoc(userRef, updates, { merge: true });
      return { ...currentData, ...updates };
    }
  }

  useEffect(() => {
    let unsubscribeProfile = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      // Önceki profil aboneliğini temizle (Eğer varsa)
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        setUser(firebaseUser);
        
        // Önce profili garanti et (yoksa oluştur)
        await ensureUserProfile(firebaseUser);

        // Real-time profil takibi
        const userRef = doc(db, "users", firebaseUser.uid);
        unsubscribeProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setUserProfile(snap.data());
          }
          setLoading(false);
        });
      } else {
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeProfile) unsubscribeProfile();
    };
  }, []);

  // Aktif Çalışma Süresi Takibi (Uygulama içinde geçirilen süre)
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      // Her 60 saniyede bir Firestore'u güncelle
      incrementStudyMinutes(user.uid, 1).catch(console.error);
    }, 60000);

    return () => clearInterval(interval);
  }, [user]);

  // Email/Password ile kayıt
  async function register(email, password, displayName) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    // Firestore'u hemen güncelle ki onAuthStateChanged'deki yarışı kazanalım
    await setDoc(doc(db, "users", result.user.uid), { displayName }, { merge: true });
    return result;
  }

  // Email/Password ile giriş
  async function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  // Google ile giriş
  async function loginWithGoogle() {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        // Google'dan gelen profil bilgilerini hemen Firestore'a yansıt
        await setDoc(doc(db, "users", result.user.uid), {
          displayName: result.user.displayName,
          photoURL: result.user.photoURL,
          lastLogin: serverTimestamp()
        }, { merge: true });
      }
      return result;
    } catch (err) {
      // If popup is blocked, try redirect method
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        const { signInWithRedirect } = await import("firebase/auth");
        return signInWithRedirect(auth, googleProvider);
      }
      console.error("Google login error:", err.code, err.message);
      throw err;
    }
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
    isPremium: userProfile?.role === "premium" || userProfile?.role === "admin",
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

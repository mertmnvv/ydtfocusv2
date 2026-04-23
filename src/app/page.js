"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push("/dashboard");
      } else {
        router.push("/login");
      }
    }
  }, [user, loading, router]);

  return (
    <div className="auth-loading-screen">
      <div className="auth-loading-spinner">
        <div className="spinner-ring"></div>
        <div className="spinner-brand">
          ydt<span>focus</span>
        </div>
      </div>
    </div>
  );
}

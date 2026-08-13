"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { getStoredAuthToken } from "@/lib/auth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = getStoredAuthToken();
    if (!token) {
      router.replace("/login");
    } else {
      setIsChecking(false);
    }
  }, [router]);

  if (isChecking) {
    return (
      <div className="h-screen bg-[#f2f3f3] flex items-center justify-center">
      </div>
    );
  }

  return (
    <AppShell>{children}</AppShell>
  );
}
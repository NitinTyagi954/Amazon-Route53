"use client";

import React, { useState } from "react";
import { TopHeader } from "./TopHeader";
import { BreadcrumbBar } from "./BreadcrumbBar";
import { Sidebar } from "./Sidebar";

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f2f3f3]">
      {/* 1. AWS Top Navigation Bar */}
      <TopHeader />

      {/* 2. Secondary Navigation / Breadcrumbs */}
      <BreadcrumbBar
        isSidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* 3. Main Area: Sidebar + Page Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-[#f2f3f3] min-w-0">
          <div className="p-6 max-w-[1400px] mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};

"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/api/auth";
import { clearStoredAuthToken } from "@/lib/auth";
import {
  Search,
  Bell,
  HelpCircle,
  Settings,
  Globe,
  ChevronDown,
  User,
  Terminal,
  Grid,
} from "lucide-react";

export const TopHeader: React.FC = () => {
  const router = useRouter();
  const [searchFocused, setSearchFocused] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [regionMenuOpen, setRegionMenuOpen] = useState(false);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logoutUser();
    clearStoredAuthToken();
    router.push("/login");
  };

  return (
    <header className="bg-[#161e2e] text-white h-10 px-3 flex items-center justify-between text-xs select-none sticky top-0 z-50 border-b border-[#0f141c]">
      {/* Left section: Logo, Services & Search */}
      <div className="flex items-center gap-3 flex-1 max-w-2xl">
        {/* AWS Logo */}
        <Link
          href="/"
          className="flex items-center gap-1 text-white hover:opacity-90 font-black tracking-tight text-sm py-1 px-1.5 rounded-[2px]"
        >
          <span className="text-[#ec7211] font-extrabold text-base leading-none">
            aws
          </span>
        </Link>

        {/* Services Dropdown */}
        <button
          type="button"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-white hover:bg-[#263244] rounded-[2px] transition-colors font-semibold"
        >
          <Grid className="w-3.5 h-3.5 text-gray-300" />
          <span>Services</span>
        </button>

        {/* Console Search Bar */}
        <div className="relative flex-1 max-w-md">
          <div
            className={`flex items-center bg-[#0f141c] border ${
              searchFocused ? "border-[#ec7211] ring-1 ring-[#ec7211]" : "border-[#353f4e]"
            } rounded-[2px] px-2.5 py-1 text-xs text-gray-200 transition-all`}
          >
            <Search className="w-3.5 h-3.5 text-gray-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Search for services, features, and docs"
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="bg-transparent border-none outline-none text-xs text-white placeholder-gray-400 w-full"
            />
            <kbd className="hidden md:inline-block bg-[#232f3e] text-gray-400 text-[10px] px-1 py-0.5 rounded border border-gray-600 font-mono shrink-0 ml-1">
              Alt+S
            </kbd>
          </div>
        </div>
      </div>

      {/* Right section: Utilities, Region & Account */}
      <div className="flex items-center gap-1 sm:gap-2">
        {/* CloudShell Icon */}
        <button
          type="button"
          title="AWS CloudShell"
          className="p-1.5 text-gray-300 hover:text-white hover:bg-[#263244] rounded-[2px] transition-colors"
        >
          <Terminal className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          type="button"
          title="Notifications"
          className="relative p-1.5 text-gray-300 hover:text-white hover:bg-[#263244] rounded-[2px] transition-colors"
        >
          <Bell className="w-4 h-4" />
        </button>

        {/* Help */}
        <button
          type="button"
          title="Support and Documentation"
          className="p-1.5 text-gray-300 hover:text-white hover:bg-[#263244] rounded-[2px] transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        {/* Settings */}
        <button
          type="button"
          title="Settings"
          className="hidden sm:block p-1.5 text-gray-300 hover:text-white hover:bg-[#263244] rounded-[2px] transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#353f4e] mx-1 hidden sm:block" />

        {/* Region Selector (Route 53 is Global) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setRegionMenuOpen(!regionMenuOpen);
              setUserMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2 py-1 text-gray-200 hover:text-white hover:bg-[#263244] rounded-[2px] transition-colors"
          >
            <Globe className="w-3.5 h-3.5 text-gray-300" />
            <span className="font-medium hidden md:inline">Global</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {regionMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setRegionMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-50 w-64 bg-[#161e2e] border border-[#353f4e] shadow-xl rounded-[2px] p-3 text-left">
                <div className="text-gray-400 text-[11px] font-semibold uppercase tracking-wider mb-2">
                  Service Region
                </div>
                <div className="flex items-center gap-2 p-2 bg-[#263244] rounded-[2px] text-white font-medium">
                  <Globe className="w-4 h-4 text-[#ec7211]" />
                  <div>
                    <div>Global</div>
                    <div className="text-[10px] text-gray-300 font-normal">
                      Route 53 does not require region selection
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User / Account Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setRegionMenuOpen(false);
            }}
            className="flex items-center gap-1.5 px-2 py-1 text-gray-200 hover:text-white hover:bg-[#263244] rounded-[2px] transition-colors"
          >
            <div className="w-5 h-5 rounded-full bg-[#ec7211] text-white flex items-center justify-center font-bold text-[10px]">
              A
            </div>
            <span className="font-medium hidden lg:inline">
              admin @ 1234-5678-9012
            </span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute right-0 top-8 z-50 w-64 bg-[#161e2e] border border-[#353f4e] shadow-xl rounded-[2px] p-3 text-left">
                <div className="border-b border-[#353f4e] pb-2 mb-2">
                  <div className="text-white font-semibold text-xs">
                    Admin User
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Account ID: 1234-5678-9012
                  </div>
                </div>
                <div className="space-y-1 text-gray-300 text-xs">
                  <div className="p-1.5 hover:bg-[#263244] rounded-[2px] cursor-pointer">
                    Account settings
                  </div>
                  <div className="p-1.5 hover:bg-[#263244] rounded-[2px] cursor-pointer">
                    Billing & Cost Management
                  </div>
                  <div className="p-1.5 hover:bg-[#263244] rounded-[2px] cursor-pointer">
                    Security credentials
                  </div>
                </div>
                <div className="mt-1 pt-1 border-t border-[#353f4e] text-gray-300 text-xs">
                  <div
                    className="p-1.5 hover:bg-[#263244] rounded-[2px] cursor-pointer"
                    onClick={handleLogout}
                  >
                    Sign out
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  LayoutDashboard,
  Globe2,
  Activity,
  UserCheck,
  Share2,
  FileCheck,
  BookOpen,
  Shield,
  Layers,
  FileText,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { SidebarSection } from "./SidebarSection";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const navItemClass = (active: boolean) =>
    `flex items-center gap-2.5 px-3 py-1.5 text-xs transition-colors border-l-[3px] ${
      active
        ? "border-[#ec7211] bg-[#ebf3fb] text-[#0972d3] font-bold"
        : "border-transparent text-[#545b64] hover:bg-[#f2f3f3] hover:text-[#16191f] font-medium"
    }`;

  const subNavItemClass = (active: boolean) =>
    `flex items-center justify-between pl-6 pr-3 py-1.5 text-xs transition-colors border-l-[3px] ${
      active
        ? "border-[#ec7211] bg-[#ebf3fb] text-[#0972d3] font-bold"
        : "border-transparent text-[#545b64] hover:bg-[#f2f3f3] hover:text-[#16191f] font-normal"
    }`;

  if (!isOpen) {
    return null;
  }

  return (
    <aside className="w-64 bg-white border-r border-[#eaeded] shrink-0 h-[calc(100vh-76px)] overflow-y-auto flex flex-col select-none z-30 transition-all duration-200">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#eaeded]">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-[#16191f]">Route 53</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3] rounded-[2px] transition-colors"
          title="Collapse navigation"
          aria-label="Collapse navigation"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation items */}
      <div className="py-2 flex-1 space-y-0.5">
        {/* Core items */}
        <Link href="/" className={navItemClass(isActive("/"))}>
          <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
          <span>Dashboard</span>
        </Link>

        <Link
          href="/hosted-zones"
          className={navItemClass(isActive("/hosted-zones"))}
        >
          <Globe2 className="w-3.5 h-3.5 shrink-0" />
          <span>Hosted zones</span>
        </Link>

        <Link
          href="/health-checks"
          className={navItemClass(isActive("/health-checks"))}
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span>Health checks</span>
        </Link>

        <Link
          href="/profiles"
          className={navItemClass(isActive("/profiles"))}
        >
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Profiles</span>
        </Link>

        <div className="my-2 border-t border-[#eaeded]" />

        {/* Traffic Management Section */}
        <SidebarSection title="Traffic management" defaultExpanded={false}>
          <div className={subNavItemClass(false)}>
            <span>Traffic flow policies</span>
          </div>
          <div className={subNavItemClass(false)}>
            <span>Traffic policy records</span>
          </div>
        </SidebarSection>

        {/* Domains Section */}
        <SidebarSection title="Domains" defaultExpanded={false}>
          <div className={subNavItemClass(false)}>
            <span>Registered domains</span>
          </div>
          <div className={subNavItemClass(false)}>
            <span>Pending requests</span>
          </div>
        </SidebarSection>

        {/* Global Resolver (Route 53 Resolver DNS Firewall) */}
        <SidebarSection title="Global Resolver" defaultExpanded={false}>
          <div className={subNavItemClass(false)}>
            <span>DNS Firewall rule groups</span>
          </div>
          <div className={subNavItemClass(false)}>
            <span>Domain lists</span>
          </div>
          <div className={subNavItemClass(false)}>
            <span>Resolver endpoints</span>
          </div>
        </SidebarSection>

        {/* VPC Resolver */}
        <SidebarSection title="VPC Resolver" defaultExpanded={false}>
          <div className={subNavItemClass(false)}>
            <span>Inbound endpoints</span>
          </div>
          <div className={subNavItemClass(false)}>
            <span>Outbound endpoints</span>
          </div>
          <div className={subNavItemClass(false)}>
            <span>Rules</span>
          </div>
          <div className={subNavItemClass(false)}>
            <span>Query logging</span>
          </div>
        </SidebarSection>

        {/* Additional features */}
        <div className="py-1">
          <div className={navItemClass(false)}>
            <Shield className="w-3.5 h-3.5 shrink-0" />
            <span>DNSSEC signing</span>
          </div>
          <div className={navItemClass(false)}>
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span>CIDR location sets</span>
          </div>
        </div>

        <div className="my-2 border-t border-[#eaeded]" />

        {/* Support & Docs links */}
        <div className="px-3 py-2 space-y-2">
          <a
            href="https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/Welcome.html"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-[11px] text-[#0972d3] hover:underline"
          >
            <span>Developer Guide</span>
            <ExternalLink className="w-3 h-3 text-[#545b64]" />
          </a>
          <a
            href="https://aws.amazon.com/route53/pricing/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between text-[11px] text-[#0972d3] hover:underline"
          >
            <span>Route 53 Pricing</span>
            <ExternalLink className="w-3 h-3 text-[#545b64]" />
          </a>
        </div>
      </div>
    </aside>
  );
};

"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ChevronRight } from "lucide-react";

interface BreadcrumbBarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

const routeTitles: Record<string, string> = {
  "/": "Dashboard",
  "/hosted-zones": "Hosted zones",
  "/health-checks": "Health checks",
  "/profiles": "Profiles",
};

export const BreadcrumbBar: React.FC<BreadcrumbBarProps> = ({
  onToggleSidebar,
}) => {
  const pathname = usePathname();
  const currentPageTitle = routeTitles[pathname] || "Route 53";

  return (
    <div className="bg-white border-b border-[#eaeded] h-9 px-4 flex items-center justify-between text-xs sticky top-10 z-40">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="p-1 text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3] rounded-[2px] transition-colors focus:outline-none"
          title="Toggle navigation sidebar"
          aria-label="Toggle navigation sidebar"
        >
          <Menu className="w-4 h-4" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
          <Link
            href="/"
            className="text-[#545b64] hover:text-[#0972d3] hover:underline font-medium"
          >
            Route 53
          </Link>

          {pathname !== "/" && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#879596]" />
              <span className="text-[#16191f] font-semibold">
                {currentPageTitle}
              </span>
            </>
          )}

          {pathname === "/" && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-[#879596]" />
              <span className="text-[#16191f] font-semibold">
                Dashboard
              </span>
            </>
          )}
        </nav>
      </div>

      <div className="flex items-center gap-2">
        <a
          href="https://docs.aws.amazon.com/route53/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#0972d3] hover:text-[#033160] hover:underline text-xs hidden sm:inline"
        >
          Documentation
        </a>
      </div>
    </div>
  );
};

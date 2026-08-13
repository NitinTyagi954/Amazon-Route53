"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface SidebarSectionProps {
  title: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
}

export const SidebarSection: React.FC<SidebarSectionProps> = ({
  title,
  defaultExpanded = false,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="py-1">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-bold text-[#545b64] hover:text-[#16191f] hover:bg-[#f2f3f3] transition-colors rounded-[2px]"
      >
        <span className="uppercase tracking-wider text-[11px]">{title}</span>
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-[#545b64]" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-[#545b64]" />
        )}
      </button>

      {isExpanded && <div className="mt-0.5 space-y-0.5">{children}</div>}
    </div>
  );
};

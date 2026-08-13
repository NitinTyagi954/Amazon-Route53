import React, { useState } from "react";
import { Info, X } from "lucide-react";

interface InfoIconProps {
  title?: string;
  description?: string;
  linkText?: string;
  linkHref?: string;
  className?: string;
}

export const InfoIcon: React.FC<InfoIconProps> = ({
  title = "Information",
  description,
  linkText,
  linkHref,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1 text-xs text-[#0972d3] hover:text-[#033160] hover:underline font-normal focus:outline-none"
        title="View details"
      >
        <Info className="w-3.5 h-3.5" />
        <span>Info</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-6 z-50 w-72 bg-white border border-[#eaeded] shadow-lg rounded-[2px] p-4 text-left">
            <div className="flex items-start justify-between mb-2">
              <h4 className="text-sm font-bold text-[#16191f]">{title}</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-[#545b64] hover:text-[#16191f] p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            {description && (
              <p className="text-xs text-[#545b64] leading-relaxed mb-3">
                {description}
              </p>
            )}
            {linkText && linkHref && (
              <a
                href={linkHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#0972d3] hover:underline inline-flex items-center gap-1 font-semibold"
              >
                {linkText} &rarr;
              </a>
            )}
          </div>
        </>
      )}
    </div>
  );
};

import React from "react";

interface CardProps {
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export const Card: React.FC<CardProps> = ({
  title,
  subtitle,
  headerAction,
  footer,
  children,
  className = "",
  bodyClassName = "",
}) => {
  return (
    <div
      className={`bg-white border border-[#eaeded] rounded-[2px] shadow-sm flex flex-col justify-between ${className}`}
    >
      {title && (
        <div className="border-b border-[#eaeded] px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#16191f]">{title}</h3>
            {subtitle && (
              <p className="text-xs text-[#545b64] mt-0.5">{subtitle}</p>
            )}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={`p-6 flex-1 ${bodyClassName}`}>{children}</div>
      {footer && (
        <div className="border-t border-[#eaeded] bg-[#fafafa] px-6 py-3 flex items-center justify-between">
          {footer}
        </div>
      )}
    </div>
  );
};

import React from "react";
import { InfoIcon } from "./InfoIcon";

interface PageHeaderProps {
  title: string;
  description?: string;
  infoTitle?: string;
  infoDescription?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  infoTitle,
  infoDescription,
  actions,
}) => {
  return (
    <div className="mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#16191f] tracking-tight">
            {title}
          </h1>
          {infoDescription && (
            <InfoIcon
              title={infoTitle || title}
              description={infoDescription}
            />
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
      {description && (
        <p className="mt-1.5 text-sm text-[#545b64] max-w-3xl leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
};

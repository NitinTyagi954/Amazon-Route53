import React from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type AlertType = "success" | "error" | "warning" | "info";

interface AlertProps {
  type?: AlertType;
  title?: string;
  children: React.ReactNode;
  onDismiss?: () => void;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  type = "info",
  title,
  children,
  onDismiss,
  className = "",
}) => {
  const styles: Record<
    AlertType,
    {
      container: string;
      icon: React.ReactNode;
      titleColor: string;
    }
  > = {
    success: {
      container: "bg-[#f2f8fd] border border-[#eaeded] border-l-4 border-l-[#1d8102]",
      icon: <CheckCircle2 className="w-4 h-4 text-[#1d8102] shrink-0" />,
      titleColor: "text-[#1d8102]",
    },
    error: {
      container: "bg-[#fdf3f1] border border-[#eaeded] border-l-4 border-l-[#d13212]",
      icon: <AlertCircle className="w-4 h-4 text-[#d13212] shrink-0" />,
      titleColor: "text-[#d13212]",
    },
    warning: {
      container: "bg-[#fffbf2] border border-[#eaeded] border-l-4 border-l-[#ec7211]",
      icon: <AlertTriangle className="w-4 h-4 text-[#ec7211] shrink-0" />,
      titleColor: "text-[#ec7211]",
    },
    info: {
      container: "bg-[#f2f8fd] border border-[#eaeded] border-l-4 border-l-[#0972d3]",
      icon: <Info className="w-4 h-4 text-[#0972d3] shrink-0" />,
      titleColor: "text-[#0972d3]",
    },
  };

  const currentStyle = styles[type];

  return (
    <div
      className={`rounded-[2px] p-3.5 flex items-start justify-between gap-3 text-xs shadow-sm ${currentStyle.container} ${className}`}
      role="alert"
    >
      <div className="flex items-start gap-2.5 flex-1 min-w-0">
        <span className="mt-0.5">{currentStyle.icon}</span>
        <div className="space-y-0.5 flex-1">
          {title && (
            <h5 className={`font-bold text-xs ${currentStyle.titleColor}`}>
              {title}
            </h5>
          )}
          <div className="text-[#16191f] leading-relaxed">{children}</div>
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-[#545b64] hover:text-[#16191f] p-0.5 rounded-[2px]"
          title="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

import React from "react";

export type ButtonVariant = "primary" | "secondary" | "link" | "icon" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "secondary",
  size = "md",
  icon,
  iconPosition = "left",
  children,
  className = "",
  disabled,
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center font-semibold rounded-[2px] transition-colors focus:outline-none focus:ring-2 focus:ring-[#0972d3] focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeStyles: Record<ButtonSize, string> = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-1.5 text-sm",
    lg: "px-5 py-2 text-base",
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      "bg-[#ec7211] hover:bg-[#eb5f07] active:bg-[#dd5b00] text-white border border-[#ec7211] shadow-sm",
    secondary:
      "bg-white hover:bg-[#f2f3f3] text-[#16191f] border border-[#545b64] shadow-sm active:bg-[#eaeded]",
    link:
      "bg-transparent hover:underline text-[#0972d3] hover:text-[#033160] border-none p-0 font-normal focus:ring-0",
    icon:
      "p-1.5 bg-transparent hover:bg-[#eaeded] text-[#545b64] hover:text-[#16191f] border-none",
    danger:
      "bg-[#d13212] hover:bg-[#ba270a] text-white border border-[#d13212] shadow-sm",
  };

  const appliedSize = variant === "link" || variant === "icon" ? "" : sizeStyles[size];

  return (
    <button
      className={`${baseStyles} ${appliedSize} ${variantStyles[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === "left" && <span className={children ? "mr-1.5" : ""}>{icon}</span>}
      {children}
      {icon && iconPosition === "right" && <span className={children ? "ml-1.5" : ""}>{icon}</span>}
    </button>
  );
};

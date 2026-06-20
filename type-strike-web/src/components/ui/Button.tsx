"use client";

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg" | "xl";
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}

export default function Button({
  children,
  onClick,
  variant = "primary",
  size = "md",
  fullWidth = false,
  disabled = false,
  className = "",
  type = "button",
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-extrabold tracking-[1.5px] rounded-xl transition-all active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none";

  const variants: Record<string, string> = {
    primary: "bg-accent-primary text-text-white hover:brightness-110 shadow-lg shadow-accent-primary/40",
    secondary: "bg-bg-surface text-text-body border border-border hover:bg-bg-surface-dark",
    ghost: "text-text-label hover:text-text-body",
  };

  const sizes: Record<string, string> = {
    sm: "text-[11px] px-3 py-1.5",
    md: "text-[13px] px-5 py-2.5",
    lg: "text-[14px] px-6 py-3",
    xl: "text-[15px] px-8 py-4",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${sizes[size]} ${fullWidth ? "w-full" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

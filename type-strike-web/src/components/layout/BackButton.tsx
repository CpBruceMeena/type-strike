"use client";

import { useRouter } from "next/navigation";

interface BackButtonProps {
  href?: string;
  className?: string;
  ariaLabel?: string;
  onClick?: () => void;
}

export default function BackButton({
  href,
  className = "",
  ariaLabel = "Back",
  onClick,
}: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (onClick) {
          onClick();
        } else if (href) {
          router.push(href);
        } else {
          router.back();
        }
      }}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-text-body hover:text-text-white transition-colors ${className}`}
      aria-label={ariaLabel}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path
          d="M12 4L6 10L12 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

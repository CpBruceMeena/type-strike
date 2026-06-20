"use client";

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  withParticles?: boolean;
}

export default function PageContainer({
  children,
  className = "",
  withParticles = false,
}: PageContainerProps) {
  return (
    <div className={`relative flex min-h-dvh w-full flex-col ${className}`}>
      {children}
    </div>
  );
}

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
    <div className={`relative mx-auto flex min-h-dvh w-full max-w-[480px] flex-col ${className}`}>
      {children}
    </div>
  );
}

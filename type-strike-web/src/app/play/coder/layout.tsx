import ParticleField from "@/components/effects/ParticleField";

export default function CoderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ParticleField />
      {/* Full-bleed gameplay arena */}
      <div className="relative z-10 flex h-dvh flex-col">
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </>
  );
}

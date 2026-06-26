import ParticleField from "@/components/effects/ParticleField";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ParticleField />
      <div className="relative z-10 flex h-dvh flex-col">
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </>
  );
}

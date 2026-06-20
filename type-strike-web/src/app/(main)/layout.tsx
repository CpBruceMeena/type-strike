import BottomNav from "@/components/layout/BottomNav";
import ParticleField from "@/components/effects/ParticleField";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ParticleField />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[480px] flex-col">
        <main className="flex-1">{children}</main>
        <BottomNav />
      </div>
    </>
  );
}

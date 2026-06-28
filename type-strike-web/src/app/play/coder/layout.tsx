import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ParticleField from "@/components/effects/ParticleField";
import AchievementToast from "@/components/achievements/AchievementToast";

export default function CoderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ParticleField />
      <AchievementToast />
      <div className="relative z-10 flex h-dvh flex-col">
        <Navbar />
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>
      </div>
    </>
  );
}

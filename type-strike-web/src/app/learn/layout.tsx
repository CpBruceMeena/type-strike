import Sidebar from "@/components/layout/Sidebar";
import BottomNav from "@/components/layout/BottomNav";
import ParticleField from "@/components/effects/ParticleField";
import AchievementToast from "@/components/achievements/AchievementToast";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ParticleField />
      <AchievementToast />
      <div className="relative z-10 flex h-dvh">
        <Sidebar />
        <div className="flex flex-1 flex-col min-w-0 h-dvh overflow-hidden">
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

import Navbar from "@/components/layout/Navbar";
import BottomNav from "@/components/layout/BottomNav";
import ParticleField from "@/components/effects/ParticleField";
import AchievementToast from "@/components/achievements/AchievementToast";
import AgentationInit from "@/components/analytics/AgentationInit";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AgentationInit />
      <ParticleField />
      <AchievementToast />
      <div className="relative z-10 flex h-dvh flex-col">
        {/* Global top navbar */}
        <Navbar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
          {/* Mobile bottom nav */}
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>
      </div>
    </>
  );
}

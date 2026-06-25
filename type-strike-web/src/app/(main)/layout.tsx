import Sidebar from "@/components/layout/Sidebar";
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
      <div className="relative z-10 flex h-dvh">
        {/* Desktop sidebar */}
        <Sidebar />

        {/* Main content area */}
        <div className="flex flex-1 flex-col min-w-0 h-dvh overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6 lg:px-8">
              {children}
            </div>
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

import Sidebar from "@/components/layout/Sidebar";

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 h-dvh overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

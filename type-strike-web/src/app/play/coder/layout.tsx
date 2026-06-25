import Sidebar from "@/components/layout/Sidebar";

export default function CoderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0 h-dvh overflow-hidden">
        {children}
      </div>
    </div>
  );
}

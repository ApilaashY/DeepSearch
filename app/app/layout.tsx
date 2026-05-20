import Sidebar from "@/components/Sidebar";
import ReduxProvider from "@/components/ReduxProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <div className="flex w-screen h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1">{children}</div>
      </div>
    </ReduxProvider>
  );
}

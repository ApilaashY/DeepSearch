import Sidebar from '@/app/components/Sidebar';
import ReduxProvider from '@/app/components/ReduxProvider';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider>
      <div className="flex w-screen h-screen overflow-hidden max-md:flex-col">
        <Sidebar />
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </ReduxProvider>
  );
}

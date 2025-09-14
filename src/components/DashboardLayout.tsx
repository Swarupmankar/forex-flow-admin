import { ReactNode } from "react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminHeader title={title} />
      
      <main className="ml-60 pt-16">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
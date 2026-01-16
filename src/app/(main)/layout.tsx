"use client";

import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Header } from "@/components/layout/header";
import { AuthGate } from "@/components/auth";

const TABS: { [key: string]: string } = {
  "/ask": "Ask.",
  "/add": "Add.",
  "/help": "Help.",
  "/chat": "Chat.",
  "/people": "People.",
  "/space": "Space.",
  "/profile": "Profile.",
};

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeTab = TABS[pathname] || "";

  // NOTE: All authentication logic has been removed for mock mode.
  // The user is managed by the InformationProvider.

  return (
    <AuthGate>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <MainSidebar activeTab={pathname} />
        </Sidebar>
        <SidebarInset>
          <div className="flex h-full flex-col">
            <Header activeTab={activeTab} />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </AuthGate>
  );
}

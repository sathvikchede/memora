"use client";

import { usePathname } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Header } from "@/components/layout/header";
import { InformationProvider } from "@/context/information-context";

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

  // The original auth check is disabled for the test environment.
  // When you want to restore it, let me know!

  return (
    <InformationProvider>
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
    </InformationProvider>
  );
}

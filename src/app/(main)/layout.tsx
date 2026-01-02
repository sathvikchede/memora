"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Header } from "@/components/layout/header";
import { useUser } from "@/firebase";
import { useEffect } from "react";
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
  // const { user, isUserLoading } = useUser();
  // const router = useRouter();

  // useEffect(() => {
  //   if (!isUserLoading && !user) {
  //     router.push('/login');
  //   }
  // }, [user, isUserLoading, router]);

  // if (isUserLoading) {
  //   return (
  //     <div className="flex min-h-screen items-center justify-center">
  //       <p>Loading...</p>
  //     </div>
  //   );
  // }

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

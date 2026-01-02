"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
} from "@/components/ui/sidebar";
import { MainSidebar } from "@/components/layout/main-sidebar";
import { Header } from "@/components/layout/header";
import { InformationProvider } from "@/context/information-context";
import { useUser, useDoc, useMemoFirebase } from "@/firebase";
import { useEffect } from "react";
import { doc, getFirestore } from "firebase/firestore";

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
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const userDocRef = useMemoFirebase(() => {
    const firestore = getFirestore();
    return user ? doc(firestore, 'users', user.uid) : null;
  }, [user]);

  const { data: userData, isLoading: isUserDataLoading } = useDoc(userDocRef);

  useEffect(() => {
    const isLoading = isUserLoading || isUserDataLoading;
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (userData && !(userData as any).onboardingCompleted) {
        router.push('/onboarding');
      }
    }
  }, [user, userData, isUserLoading, isUserDataLoading, router]);

  if (isUserLoading || isUserDataLoading || !user) {
    return (
       <div className="flex h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

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

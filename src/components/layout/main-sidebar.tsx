
"use client";
import Link from "next/link";
import {
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  HelpCircle,
  Plus,
  AlertCircle,
  MessageSquareText,
  Users,
  Atom,
  User,
} from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";

const MIcon = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-6 w-6 shrink-0"
    >
      <path
        d="M9 16V8H7V16H9Z"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <path
        d="M9 10C9 8.89543 9.89543 8 11 8C12.1046 8 13 8.89543 13 10V16H11V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M13 10C13 8.89543 13.8954 8 15 8C16.1046 8 17 8.89543 17 10V16H15V10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="16" r="1" fill="currentColor" />
    </svg>
  );

const menuItems = [
  { href: "/ask", icon: HelpCircle, label: "Ask.", tooltip: "Ask" },
  { href: "/add", icon: Plus, label: "Add.", tooltip: "Add" },
  { href: "/help", icon: AlertCircle, label: "Help.", tooltip: "Help" },
  { href: "/chat", icon: MessageSquareText, label: "Chat.", tooltip: "Chat" },
  { href: "/people", icon: Users, label: "People.", tooltip: "People" },
];

const bottomMenuItems = [
  { href: "/space", icon: Atom, label: "Space.", tooltip: "Space" },
  { href: "/profile", icon: User, label: "Profile.", tooltip: "Profile" },
];

interface MainSidebarProps {
    activeTab: string;
}

export function MainSidebar({ activeTab }: MainSidebarProps) {
  const { state } = useSidebar();

  return (
    <>
      <SidebarHeader className="p-4">
        {state === "expanded" ? (
          <h1 className="text-2xl font-bold">memora.</h1>
        ) : (
          <MIcon />
        )}
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={activeTab === item.href}
                tooltip={{ children: item.tooltip, side: "right" }}
                className="font-semibold justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="stroke-[2.5px]" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-2">
        <SidebarMenu>
          {bottomMenuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                isActive={activeTab === item.href}
                tooltip={{ children: item.tooltip, side: "right" }}
                className="font-semibold justify-start"
              >
                <Link href={item.href}>
                  <item.icon className="stroke-[2.5px]" />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </>
  );
}

    

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { History, PlusCircle, ChevronLeft } from "lucide-react";
import { ChatInterface } from "./chat-interface";
import { useInformation } from "@/context/information-context";


type View = "new-chat" | "history" | "chat-detail" | "sources" | "post";
type HistoryItem = { id: string; title: string; date: string };

const fakeHistory: HistoryItem[] = [
  { id: "1", title: "Impact of AI on modern education", date: "2024-07-28" },
  { id: "2", title: "Best practices for React development", date: "2024-07-27" },
  { id: "3", title: "Quantum computing explained", date: "2024-07-25" },
];


export function AskClient() {
  const [view, setView] = useState<View>("new-chat");
  const [activeChat, setActiveChat] = useState<HistoryItem | null>(null);
  const { entries } = useInformation();

  const renderNav = () => {
    let title = "";
    let showBackButton = false;
    let backAction = () => {};

    switch (view) {
        case "history":
            title = "History";
            showBackButton = true;
            backAction = () => setView("new-chat");
            break;
        case "chat-detail":
            title = activeChat?.title || "";
            showBackButton = true;
            backAction = () => { setView("history"); setActiveChat(null); };
            break;
        case "sources":
            title = "Sources";
            showBackButton = true;
            backAction = () => setView("chat-detail");
            break;
        case "post":
            title = "Post Question";
            showBackButton = true;
            backAction = () => setView("chat-detail");
            break;
    }
    
    if (!showBackButton) {
        return (
            <>
              <Button variant="ghost" className="w-1/2" onClick={() => setView("new-chat")}>
                <PlusCircle className="md:mr-2" /> <span className="hidden md:inline">New Chat</span>
              </Button>
              <Button variant="ghost" className="w-1/2" onClick={() => setView("history")}>
                <History className="md:mr-2" /> <span className="hidden md:inline">History</span>
              </Button>
            </>
        );
    }

    return (
        <div className="relative flex w-full items-center">
          <Button variant="ghost" className="w-auto" onClick={backAction}>
            <ChevronLeft className="md:mr-2" />
            <span className="hidden md:inline">Back</span>
          </Button>
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <span className="truncate px-2 text-center font-semibold">{title}</span>
          </div>
        </div>
    );
  };

  const renderContent = () => {
    switch (view) {
        case "history":
            return (
                <div className="divide-y divide-border">
                    {fakeHistory.map(item => (
                        <div key={item.id} onClick={() => { setView("chat-detail"); setActiveChat(item);}} className="flex cursor-pointer items-center justify-between p-4 hover:bg-accent">
                            <span className="font-medium">{item.title}</span>
                            <span className="text-sm text-muted-foreground">{item.date}</span>
                        </div>
                    ))}
                </div>
            );
        case "chat-detail":
            return <ChatInterface key={activeChat?.id} onShowSources={() => setView('sources')} onPost={() => setView('post')} />;
        case "sources":
            return (
                <div className="divide-y divide-border p-4">
                    {entries.map((source, index) => (
                        <div key={index} className="py-4">
                            <div className="flex justify-between text-sm text-muted-foreground">
                                <span>{source.type}</span>
                                <span>{source.date}</span>
                            </div>
                            <p className="my-2">{source.text}</p>
                            <div className="text-right">
                                <Button variant="link" className="p-0 h-auto text-muted-foreground">
                                    - {source.contributor}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            );
        case "post":
            return <ChatInterface isPostView={true} />;
        default:
            return <ChatInterface key="new-chat" onShowSources={() => setView('sources')} onPost={() => setView('post')} />;
    }
  };

  return (
    <div className="flex h-full flex-col px-4 sm:px-6 lg:px-8">
       <div className="mx-auto w-full max-w-4xl flex-1 flex flex-col">
        <div className="flex h-14 items-center justify-center gap-2">
            {renderNav()}
        </div>
        <Separator />
        <div className="flex-1 overflow-y-auto py-4">
            {renderContent()}
        </div>
       </div>
    </div>
  );
}

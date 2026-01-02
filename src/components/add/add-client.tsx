"use client";

import { useState, useRef, useEffect, useId } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Send,
  Upload,
  Mic,
  Image as ImageIcon,
  FileText,
  UserX,
  Camera,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useIsMobile } from "@/hooks/use-mobile";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useInformation, Entry } from "@/context/information-context";
import { useRouter } from "next/navigation";

export function AddClient() {
  const { entries, addEntry } = useInformation();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const formId = useId();
  const router = useRouter();

  const handleSend = () => {
    if (input.trim()) {
      const randomStatus = ['success', 'adjusted', 'mismatch'][Math.floor(Math.random() * 3)] as 'success' | 'adjusted' | 'mismatch';
      const newEntry: Entry = {
        id: `entry-${Date.now()}`,
        text: input,
        contributor: "You",
        date: new Date().toISOString().split("T")[0],
        type: 'add',
        status: randomStatus
      };
      addEntry(newEntry);
      setInput("");
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = isMobile ? 84 : 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input, isMobile]);

  const getStatusMessage = (status?: 'success' | 'adjusted' | 'mismatch') => {
    switch (status) {
        case 'success': return 'Entry added successfully';
        case 'adjusted': return 'Entry tone adjusted for appropriateness';
        case 'mismatch': return 'Entry does not match the selected space';
        default: return '';
    }
  }

  const entriesForAdd = entries.filter(e => e.type === 'add');

  return (
    <div className="flex h-full flex-col px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
            <ScrollArea className="flex-1 pr-4">
                <div className="space-y-4 py-4">
                    {entriesForAdd.map(entry => (
                        <div key={entry.id} className="space-y-2">
                            <div className="rounded-md border p-4">{entry.text}</div>
                            {entry.status && (
                                <Alert variant={entry.status === 'mismatch' ? 'destructive' : 'default'} className="border-0">
                                    <AlertDescription className="text-muted-foreground">
                                        {getStatusMessage(entry.status)}
                                    </AlertDescription>
                                </Alert>
                            )}
                        </div>
                    ))}
                </div>
            </ScrollArea>

            <div className="flex-shrink-0 bg-background py-4">
                <div className="space-y-2">
                    <div className="flex h-12 items-center justify-evenly gap-2 rounded-md border p-1">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="flex-1" aria-label="Upload">
                                    <Upload />
                                    <span className="hidden md:ml-2 md:inline">Upload</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                {isMobile && <DropdownMenuItem><Camera className="mr-2 h-4 w-4" /> Camera</DropdownMenuItem>}
                                <DropdownMenuItem><ImageIcon className="mr-2 h-4 w-4" /> Image</DropdownMenuItem>
                                <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> File</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        
                        <Button variant="ghost" className="flex-1" aria-label="Anonymous">
                            <UserX />
                            <span className="hidden md:ml-2 md:inline">Anonymous</span>
                        </Button>

                        <Button variant="ghost" className="flex-1" aria-label="Voice Input">
                            <Mic />
                            <span className="hidden md:ml-2 md:inline">Voice</span>
                        </Button>
                    </div>
                    <form
                        id={formId}
                        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                        className="relative flex items-center"
                    >
                        <Textarea
                            ref={textareaRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSend();
                                }
                            }}
                            placeholder="Add information to Memora..."
                            className="min-h-[48px] resize-none pr-12 rounded-full py-3.5"
                            rows={1}
                        />
                        <Button
                            type="submit"
                            size="icon"
                            className="absolute right-2 rounded-full"
                            disabled={!input.trim()}
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    </div>
  );
}

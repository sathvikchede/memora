
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useInformation } from "@/context/information-context";
import { answerUserQuery, AnswerUserQueryInput } from "@/ai/flows/answer-user-queries-with-sources";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
  showActions?: boolean;
}

interface ChatInterfaceProps {
  onShowSources?: () => void;
  onPost?: () => void;
  isPostView?: boolean;
}

const MIcon = () => (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-full w-full"
    >
      <circle cx="12" cy="12" r="2" fill="white" />
    </svg>
  );

const initialMessages: Message[] = [
    { id: 'ai-1', text: "Hello! How can I help you today?", sender: 'ai' },
];

export function ChatInterface({ onShowSources, onPost, isPostView = false }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(isPostView ? [] : initialMessages);
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const formId = useId();
  const { entries } = useInformation();
  const [isThinking, setIsThinking] = useState(false);

  const handleSend = async () => {
    if (input.trim()) {
        setMessages(prev => prev.map(m => ({ ...m, showActions: false })));
        const userMessage: Message = { id: `user-${Date.now()}`, text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsThinking(true);
        
        if (entries.length === 0) {
            // Simulate AI response
            setTimeout(() => {
                const aiResponse: Message = { id: `ai-${Date.now()}`, text: `This is a simulated AI response to: "${userMessage.text}". I don't have enough information yet.`, sender: 'ai', showActions: true };
                setMessages(prev => [...prev, aiResponse]);
                setIsThinking(false);
            }, 1000);
        } else {
            const queryInput: AnswerUserQueryInput = {
                query: input,
                summaries: entries.map(e => e.text),
                sources: entries.map(e => ({
                    contributor: e.contributor,
                    rawInformation: e.text,
                    date: e.date,
                    type: e.type,
                })),
            };

            try {
                const result = await answerUserQuery(queryInput);
                const aiResponse: Message = { id: `ai-${Date.now()}`, text: result.answer, sender: 'ai', showActions: true };
                setMessages(prev => [...prev, aiResponse]);
            } catch (error) {
                console.error("Error calling AI flow:", error);
                const errorResponse: Message = { id: `ai-${Date.now()}`, text: "Sorry, I encountered an error while processing your request.", sender: 'ai', showActions: false };
                setMessages(prev => [...prev, errorResponse]);
            } finally {
                setIsThinking(false);
            }
        }
    }
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = isMobile ? 84 : 120; // 3 lines on mobile, 5 on web approx
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input, isMobile]);

  const atBottom = messages.length > 2;
  const lastAiMessage = messages.slice().reverse().find(m => m.sender === 'ai');

  return (
    <div className={cn("flex h-full flex-col", { "justify-center": !atBottom && !isPostView })}>
      <ScrollArea className="flex-1 pr-4">
        <div className="space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex items-start gap-3",
                message.sender === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.sender === "ai" && (
                <Avatar className="h-8 w-8 border border-white">
                  <AvatarFallback className="bg-black text-white">
                    <MIcon />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  "max-w-[75%] rounded-lg p-3 border",
                  message.sender === "user"
                    ? "bg-black text-white border-white/50"
                    : "bg-black text-white border-white/50"
                )}
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}
           {isThinking && (
             <div className="flex items-start gap-3 justify-start">
                <Avatar className="h-8 w-8 border border-white">
                  <AvatarFallback className="bg-black text-white">
                    <MIcon />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-muted rounded-lg p-3">
                    <p className="text-sm">Thinking...</p>
                </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className={cn("mt-4 flex-shrink-0", { "sticky bottom-0 bg-background py-4": atBottom || isPostView })}>
        
        {lastAiMessage?.showActions && !isPostView && (
            <div className="mb-2 flex h-12 items-center justify-evenly gap-2 rounded-md border border-input p-1">
                {lastAiMessage.text.includes("enough information") ? (
                    <Button variant="ghost" className="flex-1 border-0" onClick={onPost}>Post</Button>
                ) : (
                    <>
                        <Button variant="ghost" className="flex-1 border-0" onClick={onShowSources}>Sources</Button>
                        <Button variant="ghost" className="flex-1 border-0" onClick={onPost}>Post</Button>
                    </>
                )}
            </div>
        )}

        <div className="space-y-2">
            <div className="flex h-12 items-center justify-evenly gap-2 rounded-md border border-input p-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="flex-1" aria-label="Upload" disabled={isThinking}>
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
                
                {isPostView && (
                    <Button variant="ghost" className="flex-1" aria-label="Anonymous" disabled={isThinking}>
                        <UserX />
                        <span className="hidden md:ml-2 md:inline">Anonymous</span>
                    </Button>
                )}

                <Button variant="ghost" className="flex-1" aria-label="Voice Input" disabled={isThinking}>
                    <Mic />
                    <span className="hidden md:ml-2 md:inline">Voice</span>
                </Button>
            </div>
            <form
                id={formId}
                onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                className="relative"
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
                placeholder={isPostView ? "Post a question to the community..." : "Ask memora anything..."}
                className="min-h-[48px] resize-none pr-12 rounded-full border-input"
                rows={1}
                disabled={isThinking}
                />
                <Button
                    type="submit"
                    size="icon"
                    className="absolute bottom-2 right-2 rounded-full"
                    disabled={!input.trim() || isThinking}
                >
                    {isThinking ? (
                        <div className="h-4 w-4 border-2 border-background/80 border-t-transparent rounded-full animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </form>
        </div>
      </div>
    </div>
  );
}

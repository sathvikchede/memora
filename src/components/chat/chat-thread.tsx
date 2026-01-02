'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Send,
  Upload,
  Mic,
  Image as ImageIcon,
  FileText,
  BrainCircuit,
  Camera,
  X,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  useInformation,
  Author,
  ChatMessage,
} from '@/context/information-context';

interface ChatThreadProps {
  recipient: Author;
}

interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string; // data URL
}

export function ChatThread({ recipient }: ChatThreadProps) {
  const {
    currentUser,
    getChatMessages,
    sendChatMessage,
    getRememberState,
    toggleRememberState,
  } = useInformation();
  const [input, setInput] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const formId = useId();

  const conversationId = [currentUser.id, recipient.id].sort().join('-');
  const messages = getChatMessages(conversationId);
  const isRemembering = getRememberState(conversationId);

  const handleSend = () => {
    if (input.trim() || uploadedFiles.length > 0) {
      sendChatMessage(conversationId, input, uploadedFiles);
      setInput('');
      setUploadedFiles([]);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const newFile: UploadedFile = {
          id: `file-${Date.now()}`,
          name: file.name,
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: e.target?.result as string,
        };
        setUploadedFiles((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    }
    event.target.value = ''; // Reset file input
  };

  const removeUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = isMobile ? 84 : 120;
      textareaRef.current.style.height = `${Math.min(
        scrollHeight,
        maxHeight
      )}px`;
    }
  }, [input, isMobile]);

  return (
    <div className="flex h-full flex-col">
      <div className="relative flex-1">
        <ScrollArea className="h-full pr-4">
          <div className="space-y-6 py-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  'relative flex items-start gap-3',
                  message.senderId === currentUser.id
                    ? 'justify-end'
                    : 'justify-start'
                )}
              >
                {message.remembered && (
                  <div className="absolute left-0 top-0 h-full w-1 rounded-full bg-white"></div>
                )}
                {message.senderId === recipient.id && (
                  <Avatar className="h-8 w-8 ml-4">
                    <AvatarImage src={recipient.avatar} />
                    <AvatarFallback>{recipient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-[75%] rounded-lg',
                    message.senderId === currentUser.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted',
                    message.remembered && 'ml-4'
                  )}
                >
                  <p className="p-3 text-sm">{message.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>


      <div className="flex-shrink-0 bg-background py-4">
        <div className="space-y-2">
          {uploadedFiles.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="relative shrink-0">
                  {file.type === 'image' ? (
                    <img
                      src={file.url}
                      alt={file.name}
                      className="h-20 w-20 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 flex-col items-center justify-center rounded-md border bg-muted">
                      <FileText className="h-8 w-8" />
                      <span className="mt-1 max-w-full truncate px-1 text-xs">
                        {file.name}
                      </span>
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full"
                    onClick={() => removeUploadedFile(file.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="flex h-12 items-center justify-evenly gap-2 rounded-md border p-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex-1" aria-label="Upload">
                  <Upload />
                  <span className="hidden md:ml-2 md:inline">Upload</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem asChild>
                  <label className="flex items-center">
                    <ImageIcon className="mr-2 h-4 w-4" /> Image
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <label className="flex items-center">
                    <FileText className="mr-2 h-4 w-4" /> File
                    <input
                      type="file"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant={isRemembering ? 'secondary' : 'ghost'}
              className="flex-1"
              aria-label="Remember this"
              onClick={() => toggleRememberState(conversationId)}
            >
              <BrainCircuit />
              <span className="hidden md:ml-2 md:inline">Remember this</span>
            </Button>

            <Button
              variant="ghost"
              className="flex-1"
              aria-label="Voice Input"
            >
              <Mic />
              <span className="hidden md:ml-2 md:inline">Voice</span>
            </Button>
          </div>
          <form
            id={formId}
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="relative flex items-center"
          >
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Chat with them..."
              className="min-h-[48px] resize-none rounded-full py-3.5 pr-12"
              rows={1}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 rounded-full"
              disabled={!input.trim() && uploadedFiles.length === 0}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

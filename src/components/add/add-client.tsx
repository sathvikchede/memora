
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
  History,
  PlusCircle,
  X,
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
import { Separator } from "@/components/ui/separator";
import { processMultimediaInput, ProcessMultimediaInputInput } from "@/ai/flows/process-multimedia-input";


interface UploadedFile {
  id: string;
  name: string;
  type: 'image' | 'file';
  url: string; // data URL
}

export function AddClient() {
  const { entries, addEntry, currentUser } = useInformation();
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();
  const formId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [view, setView] = useState<'add' | 'history'>('add');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSending, setIsSending] = useState(false);


  const handleSend = async () => {
    if (input.trim() || uploadedFiles.length > 0) {
      setIsSending(true);

      if (uploadedFiles.length > 0) {
        // Process file uploads
        for (const file of uploadedFiles) {
           const multimediaInput: ProcessMultimediaInputInput = {
                mediaDataUri: file.url,
                additionalText: input.trim()
            };
            try {
                const result = await processMultimediaInput(multimediaInput);
                const newEntry: Entry = {
                    id: `entry-${Date.now()}`,
                    text: result.summary,
                    contributor: isAnonymous ? "Anonymous" : currentUser.name,
                    date: new Date().toISOString().split("T")[0],
                    type: 'add',
                    status: 'success'
                };
                addEntry(newEntry);
            } catch (error) {
                console.error("Error processing file:", error);
                 const errorEntry: Entry = {
                    id: `entry-${Date.now()}`,
                    text: `Failed to process file: ${file.name}`,
                    contributor: isAnonymous ? "Anonymous" : currentUser.name,
                    date: new Date().toISOString().split("T")[0],
                    type: 'add',
                    status: 'mismatch' // or some other error status
                };
                addEntry(errorEntry);
            }
        }
      } else if (input.trim()) {
        // Process text-only input
        const randomStatus = ['success', 'adjusted', 'mismatch'][Math.floor(Math.random() * 3)] as 'success' | 'adjusted' | 'mismatch';
        const newEntry: Entry = {
          id: `entry-${Date.now()}`,
          text: input,
          contributor: isAnonymous ? "Anonymous" : currentUser.name,
          date: new Date().toISOString().split("T")[0],
          type: 'add',
          status: randomStatus
        };
        addEntry(newEntry);
      }

      setInput("");
      setUploadedFiles([]);
      setIsSending(false);
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
    if (event.target) event.target.value = '';
  };
  
  const removeUploadedFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };


  const handleVoiceInput = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = false;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = 'en-US';

    recognitionRef.current.onstart = () => {
      setIsRecording(true);
    };

    recognitionRef.current.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setInput(prev => prev ? `${prev} ${finalTranscript}` : finalTranscript);
      }
    };
    
    recognitionRef.current.start();
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = isMobile ? 84 : 120;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [input, isMobile]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const getStatusMessage = (status?: 'success' | 'adjusted' | 'mismatch') => {
    switch (status) {
        case 'success': return 'Entry added successfully';
        case 'adjusted': return 'Entry tone adjusted for appropriateness';
        case 'mismatch': return 'Entry does not match the selected space';
        default: return '';
    }
  }

  const entriesForAdd = entries.filter(e => e.type === 'add');

  const renderNav = () => {
    return (
      <div className="flex h-14 w-full items-center justify-center gap-2">
        <Button variant={view === 'add' ? 'secondary' : 'ghost'} className="w-1/2" onClick={() => setView('add')}>
          <PlusCircle className="md:mr-2" /> <span className="hidden md:inline">Add</span>
        </Button>
        <Button variant={view === 'history' ? 'secondary' : 'ghost'} className="w-1/2" onClick={() => setView('history')}>
          <History className="md:mr-2" /> <span className="hidden md:inline">History</span>
        </Button>
      </div>
    );
  };

  const renderAddView = () => (
    <>
      <div className="flex-1"></div>
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
                <Button variant="ghost" className="flex-1" aria-label="Upload" disabled={isSending}>
                  <Upload />
                  <span className="hidden md:ml-2 md:inline">Upload</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {isMobile && <DropdownMenuItem><label className="flex items-center"><Camera className="mr-2 h-4 w-4" /> Camera</label></DropdownMenuItem>}
                <DropdownMenuItem asChild><label className="flex items-center"><ImageIcon className="mr-2 h-4 w-4" /> Image<input ref={imageInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} /></label></DropdownMenuItem>
                <DropdownMenuItem asChild><label className="flex items-center"><FileText className="mr-2 h-4 w-4" /> File<input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} /></label></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button variant={isAnonymous ? "secondary" : "ghost"} className="flex-1" aria-label="Anonymous" onClick={() => setIsAnonymous(!isAnonymous)} disabled={isSending}>
              <UserX />
              <span className="hidden md:ml-2 md:inline">Anonymous</span>
            </Button>

            <Button variant={isRecording ? "secondary" : "ghost"} className="flex-1" aria-label="Voice Input" onClick={handleVoiceInput} disabled={isSending}>
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
              disabled={isSending}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-2 rounded-full"
              disabled={(!input.trim() && uploadedFiles.length === 0) || isSending}
            >
              {isSending ? (
                  <div className="h-4 w-4 border-2 border-background/80 border-t-transparent rounded-full animate-spin" />
              ) : (
                  <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  );

  const renderHistoryView = () => (
    <ScrollArea className="flex-1 pr-4">
      <div className="space-y-4 py-4">
        {entriesForAdd.map(entry => (
          <div key={entry.id} className="space-y-2">
            {entry.contributor === 'Anonymous' && (
              <p className="text-xs font-semibold text-muted-foreground">Anonymous</p>
            )}
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
        {entriesForAdd.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground">No entries added yet.</p>
          </div>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <div className="flex h-full flex-col px-4 sm:px-6 lg:px-8">
      <div className="mx-auto flex h-full w-full max-w-4xl flex-col">
        {renderNav()}
        <Separator />
        {view === 'add' ? renderAddView() : renderHistoryView()}
      </div>
    </div>
  );
}

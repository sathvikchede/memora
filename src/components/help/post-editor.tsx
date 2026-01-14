
"use client";

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, Underline, Image as ImageIcon, Paperclip, UserX } from "lucide-react";
import { useInformation } from '@/context/information-context';
import { processNewEntry } from '@/services/entry-processor';
import ReactMarkdown from 'react-markdown';
import { useToast } from '@/hooks/use-toast';

interface PostEditorProps {
    mode: "post-question" | "answer-question" | "follow-up-question";
    question?: string;
    questionId?: string; // For answers and follow-ups
    answerId?: string; // For follow-ups
    onPost: () => void;
}

export function PostEditor({ mode, question = "", questionId, answerId, onPost }: PostEditorProps) {
    const [content, setContent] = useState(mode === 'post-question' ? question : "");
    const [isAnonymous, setIsAnonymous] = useState(false);
    const editorRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { currentUser, addQuestion, addAnswer, addFollowUp, updateCreditBalance, refreshSummaries } = useInformation();
    const { toast } = useToast();

    const applyStyle = (style: 'bold' | 'italic' | 'underline' | 'h1' | 'h2' | 'h3') => {
        const textarea = editorRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = content.substring(start, end);

        let prefix = '';
        let suffix = '';
        let placeholder = '';
        let isBlock = false;

        switch (style) {
            case 'bold':
                prefix = '**';
                suffix = '**';
                placeholder = 'Bold Text';
                break;
            case 'italic':
                prefix = '_';
                suffix = '_';
                placeholder = 'Italic Text';
                break;
            case 'underline':
                prefix = '<u>';
                suffix = '</u>';
                placeholder = 'Underlined Text';
                break;
            case 'h1':
                prefix = '# ';
                placeholder = 'Heading 1';
                isBlock = true;
                break;
            case 'h2':
                prefix = '## ';
                placeholder = 'Heading 2';
                isBlock = true;
                break;
            case 'h3':
                prefix = '### ';
                placeholder = 'Heading 3';
                isBlock = true;
                break;
        }

        const textToInsert = selectedText || placeholder;
        
        const before = content.substring(0, start);
        const after = content.substring(end);
        
        let newText: string;
        let selectionStart: number;
        let selectionEnd: number;

        if (isBlock) {
            const startOfLine = before.lastIndexOf('\n') + 1;
            const needsPrefixNewline = start > 0 && content.charAt(start - 1) !== '\n';
            const finalPrefix = (needsPrefixNewline ? '\n' : '') + prefix;

            if (selectedText) {
                 newText = `${before.substring(0,startOfLine)}${prefix}${content.substring(startOfLine,end)}${after}`;
                 selectionStart = startOfLine;
                 selectionEnd = end + prefix.length;
            } else {
                newText = `${before}${finalPrefix}${placeholder}${after}`;
                selectionStart = start + finalPrefix.length;
                selectionEnd = selectionStart + placeholder.length;
            }
        } else { // Inline styles
            newText = `${before}${prefix}${textToInsert}${suffix}${after}`;
            selectionStart = start + prefix.length;
            selectionEnd = selectionStart + textToInsert.length;
        }

        setContent(newText);

        textarea.focus();
        setTimeout(() => {
            textarea.selectionStart = selectionStart;
            textarea.selectionEnd = selectionEnd;
        }, 0);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isImage: boolean) => {
        const file = e.target.files?.[0];
        if (!file || !editorRef.current) return;

        const textarea = editorRef.current;
        const start = textarea.selectionStart;
        
        // This is a placeholder. In a real app, you'd upload the file and get a URL.
        const fileMarkdown = isImage ? `![${file.name}](placeholder_url_for_${file.name})` : `[${file.name}](placeholder_url_for_${file.name})`;
        
        const newText = `${content.substring(0, start)} ${fileMarkdown} ${content.substring(start)}`;
        setContent(newText);

        e.target.value = ''; // Reset file input
    };

    const getButtonText = () => {
        switch (mode) {
            case "post-question": return "Post Question";
            case "answer-question": return "Post Answer";
            case "follow-up-question": return "Post Follow-up";
        }
    }

    const handlePost = () => {
        if (!content.trim()) return;

        const author = isAnonymous
            ? { id: 'anonymous', name: "Anonymous", department: "Unknown", avatar: "/avatars/anonymous.png" }
            : currentUser;

        let awardedCredits = false;
        let contentForProcessing = '';

        switch (mode) {
            case "post-question":
                addQuestion({ question: content, author });
                break;
            case "answer-question":
                if(questionId) {
                    addAnswer(questionId, { text: content, author, upvotes: 0, downvotes: 0 }, question);
                    awardedCredits = true;
                    // Create rich content for topic extraction that includes the question context
                    contentForProcessing = `Question: ${question}\nAnswer: ${content}`;
                }
                break;
            case "follow-up-question":
                 if (answerId && questionId) {
                    addFollowUp(answerId, { question: content, author, parentId: questionId }, question);
                }
                break;
        }

        // Process for topic-level source tracking (in background)
        if (contentForProcessing && awardedCredits) {
            processNewEntry(contentForProcessing, 'help', {
                original_question_id: questionId,
            }).then((result) => {
                if (result.success) {
                    refreshSummaries();
                    console.log('Help answer processed for topic tracking:', result);
                }
            }).catch((error) => {
                console.error('Error processing help answer for topic tracking:', error);
            });
        }

        if (awardedCredits && !isAnonymous) {
            updateCreditBalance(currentUser.id, 10);
            toast({
                title: "Credits Awarded!",
                description: "You've earned 10 credits for your contribution.",
            });
        }

        onPost();
    }

    return (
        <div className="flex h-full flex-col">
            <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, false)} className="hidden" />
            <input type="file" ref={imageInputRef} accept="image/*" onChange={(e) => handleFileChange(e, true)} className="hidden" />
            
            <div className="flex flex-wrap items-center gap-2 border-b p-2">
                <Button variant="ghost" size="sm" onClick={() => applyStyle('h1')}>H1</Button>
                <Button variant="ghost" size="sm" onClick={() => applyStyle('h2')}>H2</Button>
                <Button variant="ghost" size="sm" onClick={() => applyStyle('h3')}>H3</Button>
                <Button variant="ghost" size="icon" onClick={() => applyStyle('bold')}><Bold className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => applyStyle('italic')}><Italic className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => applyStyle('underline')}><Underline className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => imageInputRef.current?.click()}><ImageIcon className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><Paperclip className="h-4 w-4" /></Button>
                 <Button 
                    variant={isAnonymous ? "secondary" : "ghost"} 
                    size="sm" 
                    onClick={() => setIsAnonymous(!isAnonymous)}
                >
                    <UserX className="mr-2 h-4 w-4" /> Anonymous
                </Button>
            </div>
            <Textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                    mode === 'post-question' ? 'Type your question here...' :
                    mode === 'answer-question' ? 'Type your answer here...' :
                    'Type your follow-up question here...'
                }
                className="flex-1 resize-none rounded-none border-0 focus-visible:ring-0"
            />
            <div className="flex-shrink-0 border-t p-4">
               <div className="max-h-48 overflow-y-auto rounded-md border p-4 prose prose-sm dark:prose-invert">
                 <h3 className="text-xs font-bold uppercase text-muted-foreground">Preview</h3>
                 <ReactMarkdown>{content || "Your rendered output will appear here."}</ReactMarkdown>
               </div>
            </div>
            <div className="flex-shrink-0 p-4">
                <Button className="w-full" onClick={handlePost} disabled={!content.trim()}>
                    {getButtonText()}
                </Button>
            </div>
        </div>
    );
}

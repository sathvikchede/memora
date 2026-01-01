
"use client";

import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bold, Italic, Underline, Image as ImageIcon, Paperclip, UserX } from "lucide-react";
import { useInformation } from '@/context/information-context';

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
    const { addQuestion, addAnswer, addFollowUp } = useInformation();

    const handleFormat = (format: string) => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
        console.log(`Applying format: ${format}`);
    };

    const getButtonText = () => {
        switch (mode) {
            case "post-question": return "Post Question";
            case "answer-question": return "Post Answer";
            case "follow-up-question": return "Post Follow-up";
        }
    }

    const handlePost = () => {
        const author = { 
            name: isAnonymous ? "Anonymous" : "Current User", 
            department: isAnonymous ? "Unknown" : "Your Department", 
            avatar: isAnonymous ? "/avatars/anonymous.png" : "/avatars/user.png" 
        };

        switch (mode) {
            case "post-question":
                addQuestion({ question: content, author });
                break;
            case "answer-question":
                if(questionId) {
                    addAnswer(questionId, { text: content, author, upvotes: 0, downvotes: 0 });
                }
                break;
            case "follow-up-question":
                 if (answerId && questionId) {
                    addFollowUp(answerId, { question: content, author, parentId: questionId });
                }
                break;
        }
        onPost();
    }

    return (
        <div className="flex h-full flex-col">
            <div className="flex flex-wrap items-center gap-2 border-b p-2">
                <Button variant="ghost" size="sm" onClick={() => handleFormat('h1')}>H1</Button>
                <Button variant="ghost" size="sm" onClick={() => handleFormat('h2')}>H2</Button>
                <Button variant="ghost" size="sm" onClick={() => handleFormat('h3')}>H3</Button>
                <Button variant="ghost" size="icon" onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><ImageIcon className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Paperclip className="h-4 w-4" /></Button>
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
            <div className="flex-shrink-0 p-4">
                <Button className="w-full" onClick={handlePost} disabled={!content.trim()}>
                    {getButtonText()}
                </Button>
            </div>
        </div>
    );
}

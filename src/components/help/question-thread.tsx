
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import React, { useEffect, useState } from 'react';
import { useInformation, Question as QuestionType, Author as AuthorType, Answer as AnswerType } from "@/context/information-context";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const ThreadItem = ({ 
    children, 
    author, 
    level = 0, 
    onChat,
    isLast,
}: { 
    children: React.ReactNode, 
    author: AuthorType, 
    level?: number, 
    onChat: () => void,
    isLast: boolean,
}) => {
    return (
        <div className="relative flex items-start gap-3">
            <div className="relative z-10 flex flex-col items-center">
                <Avatar className="h-8 w-8">
                    <AvatarImage src={author.avatar} alt={author.name} />
                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {!isLast && <div className="absolute top-10 left-1/2 -translate-x-1/2 h-[calc(100%_-_1rem)] w-0.5 bg-border"></div>}
            </div>
            
            <div className="w-full">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{author.name}</p>
                    <p className="text-xs text-muted-foreground">{author.department}</p>
                    <Button variant="link" size="sm" onClick={onChat} className="ml-auto p-0 h-auto text-muted-foreground">Chat</Button>
                </div>
                <div className="mt-2">
                    {children}
                </div>
            </div>
        </div>
    );
};

interface QuestionThreadProps {
    questionId: string;
    onAnswer: (questionId: string, question: string) => void;
    onFollowUp: (questionId: string, answerId: string, question: string) => void;
}

export function QuestionThread({ questionId, onAnswer, onFollowUp }: QuestionThreadProps) {
    const { questions, currentUser, upvoteAnswer, downvoteAnswer } = useInformation();
    const [isClient, setIsClient] = useState(false);
    const [expandedAnswers, setExpandedAnswers] = useState<string[]>([]);
    const router = useRouter();

    const handleChat = (userId: string) => {
        if (userId !== currentUser.id) {
            router.push(`/chat?userId=${userId}`);
        }
    };


    const toggleAnswerExpansion = (answerId: string) => {
        setExpandedAnswers(prev => 
            prev.includes(answerId) 
                ? prev.filter(id => id !== answerId) 
                : [...prev, answerId]
        );
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null;
    }

    const thread = questions.find(q => q.id === questionId); 

    if (!thread) {
        return <div>Question not found.</div>
    }

    const isYourQuery = thread.author.id === currentUser.id;

    const canFollowUp = (level: number) => level < 2;

    const renderAnswers = (question: QuestionType, answers: AnswerType[], level: number) => {
        return answers.map((answer, index) => {
            const hasFollowUps = answer.followUps && answer.followUps.length > 0;
            const isExpanded = expandedAnswers.includes(answer.id);
            const isLast = index === answers.length - 1 && !hasFollowUps;
            
            return (
                <div className="space-y-6" key={answer.id}>
                    <ThreadItem author={answer.author} level={level + 1} onChat={() => handleChat(answer.author.id)} isLast={isLast}>
                        <p className={cn("text-sm", !isExpanded && "line-clamp-3")}>{answer.text}</p>
                        <Button 
                            variant="link" 
                            className="w-auto h-auto p-0 text-xs text-muted-foreground mt-2"
                            onClick={() => toggleAnswerExpansion(answer.id)}
                        >
                            {isExpanded ? 'Read less' : 'Read more'}
                        </Button>
                        <div className="mt-2 flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground" onClick={() => upvoteAnswer(question.id, answer.id)}><ThumbsUp className="h-4 w-4" /> {answer.upvotes}</Button>
                            <Button variant="ghost" size="sm" className="flex items-center gap-1 text-muted-foreground" onClick={() => downvoteAnswer(question.id, answer.id)}><ThumbsDown className="h-4 w-4" /> {answer.downvotes}</Button>
                            {isYourQuery && canFollowUp(level) && (
                                <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onFollowUp(question.id, answer.id, question.question)}>Follow-up</Button>
                            )}
                        </div>
                    </ThreadItem>
                    {hasFollowUps && isExpanded && <div className="mt-6 space-y-6 pl-4 border-l-2 border-border ml-4">{renderFollowUps(question, answer.followUps, level + 1)}</div>}
                </div>
            );
        });
    }

    const renderFollowUps = (originalQuestion: QuestionType, followUps: QuestionType[], level: number) => {
        return followUps.map((followUp, index) => {
             const hasAnswers = followUp.answers && followUp.answers.length > 0;
             const isLast = index === followUps.length - 1 && !hasAnswers;

            return (
                <div className="space-y-6" key={followUp.id}>
                    <ThreadItem author={followUp.author} level={level + 1} onChat={() => handleChat(followUp.author.id)} isLast={isLast}>
                        <p className="font-semibold text-sm">{followUp.question}</p>
                         <div className="mt-2 flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => onAnswer(followUp.id, followUp.question)}>Answer</Button>
                        </div>
                    </ThreadItem>
                    {hasAnswers && <div className="mt-6 space-y-6 pl-4 border-l-2 border-border ml-4">{renderAnswers(followUp, followUp.answers, level + 1)}</div>}
                </div>
            );
        });
    }

    const hasAnswers = thread.answers.length > 0;

    return (
        <div className="space-y-6">
           <ThreadItem author={thread.author} level={0} onChat={() => handleChat(thread.author.id)} isLast={!hasAnswers}>
                <h2 className="text-lg font-bold">{thread.question}</h2>
                <div className="mt-4 flex items-center gap-2">
                    <Button onClick={() => onAnswer(thread.id, thread.question)}>Answer</Button>
                </div>
            </ThreadItem>
            {hasAnswers && <div className="mt-6 space-y-6 pl-4 border-l-2 border-border ml-4">{renderAnswers(thread, thread.answers, 0)}</div>}
        </div>
    );
}


"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import React, { useEffect, useState } from 'react';
import { useSpaceData } from "@/context/space-data-context";
import { useFirebase } from "@/firebase";
import { FirestoreQuestion, FirestoreAnswer } from "@/services/firestore";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import ReactMarkdown from 'react-markdown';

// Author type for display purposes
interface DisplayAuthor {
    id: string;
    name: string;
}

const ThreadItem = ({
    children,
    author,
    level = 0,
    onChat,
    isLast,
}: {
    children: React.ReactNode,
    author: DisplayAuthor,
    level?: number,
    onChat: () => void,
    isLast: boolean,
}) => {
    return (
        <div className="relative flex items-start gap-3">
            <div className="relative z-10 flex flex-col items-center">
                <Avatar className="h-8 w-8">
                    <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
                </Avatar>
                {!isLast && <div className="absolute top-10 left-1/2 -translate-x-1/2 h-[calc(100%_-_1rem)] w-0.5 bg-border"></div>}
            </div>

            <div className="w-full">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{author.name}</p>
                    <Button variant="link" size="sm" onClick={onChat} className="ml-auto p-0 h-auto text-muted-foreground">Chat</Button>
                </div>
                <div className="mt-2 prose prose-sm dark:prose-invert max-w-none">
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
    const { questions, upvoteAnswer, downvoteAnswer } = useSpaceData();
    const { user } = useFirebase();
    const [isClient, setIsClient] = useState(false);
    const [expandedAnswers, setExpandedAnswers] = useState<string[]>([]);
    const router = useRouter();

    const handleChat = (userId: string) => {
        if (user && userId !== user.uid) {
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

    if (!isClient || !user) {
        return null;
    }

    const thread = questions.find(q => q.questionId === questionId);

    if (!thread) {
        return <div>Question not found.</div>
    }

    const isYourQuery = thread.askedBy === user.uid;

    const renderAnswers = (question: FirestoreQuestion & { questionId: string }, answers: FirestoreAnswer[]) => {
        return answers.map((answer, index) => {
            const isExpanded = expandedAnswers.includes(answer.id);
            const isLastInGroup = index === answers.length - 1;

            const author: DisplayAuthor = {
                id: answer.authorId,
                name: answer.authorName,
            };

            return (
                <div className="space-y-6" key={answer.id}>
                    <ThreadItem author={author} level={1} onChat={() => handleChat(answer.authorId)} isLast={isLastInGroup}>
                        <div className={cn(!isExpanded && "line-clamp-3")}>
                            <ReactMarkdown>{answer.text}</ReactMarkdown>
                        </div>
                        <Button
                            variant="link"
                            className="w-auto h-auto p-0 text-xs text-muted-foreground mt-2"
                            onClick={() => toggleAnswerExpansion(answer.id)}
                        >
                            {isExpanded ? 'Read less' : 'Read more'}
                        </Button>
                        <div className="mt-2 flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-muted-foreground"
                                onClick={() => upvoteAnswer(question.questionId, answer.id)}
                            >
                                <ThumbsUp className="h-4 w-4" /> {answer.upvotes}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="flex items-center gap-1 text-muted-foreground"
                                onClick={() => downvoteAnswer(question.questionId, answer.id)}
                            >
                                <ThumbsDown className="h-4 w-4" /> {answer.downvotes}
                            </Button>
                            {isYourQuery && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-muted-foreground"
                                    onClick={() => onFollowUp(question.questionId, answer.id, question.question)}
                                >
                                    Follow-up
                                </Button>
                            )}
                        </div>
                    </ThreadItem>
                </div>
            );
        });
    }

    const hasAnswers = thread.answers && thread.answers.length > 0;

    const questionAuthor: DisplayAuthor = {
        id: thread.askedBy,
        name: thread.askedByName,
    };

    return (
        <div className="space-y-6">
           <ThreadItem author={questionAuthor} level={0} onChat={() => handleChat(thread.askedBy)} isLast={!hasAnswers}>
                <ReactMarkdown className="text-lg font-bold">{thread.question}</ReactMarkdown>
                <div className="mt-4 flex items-center gap-2">
                    <Button onClick={() => onAnswer(thread.questionId, thread.question)}>Answer</Button>
                </div>
            </ThreadItem>
            {hasAnswers && (
                <div className="mt-6 space-y-6 pl-4 border-l-2 border-border ml-4">
                    {renderAnswers(thread, thread.answers)}
                </div>
            )}
        </div>
    );
}

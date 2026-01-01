
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import React from 'react';
import { useInformation, Question as QuestionType, Author as AuthorType } from "@/context/information-context";

const ThreadItem = ({ children, author, isLast, level = 0 }: { children: React.ReactNode, author: AuthorType, isLast: boolean, level?: number }) => (
    <div className="relative flex items-start gap-4">
        <div className="flex flex-col items-center">
            <Avatar>
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {!isLast && <div className="mt-2 h-full w-px bg-border" style={{ marginLeft: `${level > 0 ? 0 : '0'}` }}></div>}
        </div>
        {!isLast && level > 0 && <div className="absolute left-4 top-4 h-px w-4 bg-border"></div>}
        <div className="w-full">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold">{author.name}</p>
                    <p className="text-sm text-muted-foreground">{author.department}</p>
                </div>
                <Button variant="outline" size="sm">Chat</Button>
            </div>
            <div className="mt-2 rounded-lg border bg-muted p-4">
                {children}
            </div>
        </div>
    </div>
);

interface QuestionThreadProps {
    questionId: string;
    onAnswer: (questionId: string, question: string) => void;
    onFollowUp: (questionId: string, answerId: string, question: string) => void;
}

export function QuestionThread({ questionId, onAnswer, onFollowUp }: QuestionThreadProps) {
    const { questions } = useInformation();
    const thread = questions.find(q => q.id === questionId); 

    if (!thread) {
        return <div>Question not found.</div>
    }

    const isYourQuery = thread.author.name === "Current User";

    const canFollowUp = (level: number) => level < 2;

    const renderQuestionLevel = (question: QuestionType, level: number) => (
        <>
            <ThreadItem author={question.author} isLast={question.answers.length === 0} level={level}>
                <p>{question.question}</p>
                <div className="flex justify-end mt-4">
                    <Button onClick={() => onAnswer(question.id, question.question)}>Answer</Button>
                </div>
            </ThreadItem>

            {question.answers.map((answer) => (
                <div className="pl-8" key={answer.id}>
                    <ThreadItem author={answer.author} isLast={!answer.followUps || answer.followUps.length === 0} level={level + 1}>
                        <p className="line-clamp-3">{answer.text}</p>
                        <Button variant="link" className="p-0 h-auto text-blue-500">Read More</Button>
                        <div className="mt-4 flex">
                            <Button variant="outline" className="flex-1 rounded-r-none"><ThumbsUp className="mr-2 h-4 w-4" /> {answer.upvotes}</Button>
                            <Button variant="outline" className="flex-1 rounded-l-none"><ThumbsDown className="mr-2 h-4 w-4" /> {answer.downvotes}</Button>
                        </div>
                         {isYourQuery && canFollowUp(level) && (
                            <div className="flex justify-end mt-2">
                                 <Button onClick={() => onFollowUp(question.id, answer.id, question.question)}>Follow-up</Button>
                            </div>
                        )}
                    </ThreadItem>
                     {answer.followUps.map(followUp => (
                        <div className="pl-8" key={followUp.id}>
                            {renderQuestionLevel(followUp, level + 1)}
                        </div>
                    ))}
                </div>
            ))}
        </>
    );


    return (
        <div className="space-y-6">
           {renderQuestionLevel(thread, 0)}
        </div>
    );
}

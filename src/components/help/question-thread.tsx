
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import React from 'react';
import { useInformation, Question as QuestionType, Author as AuthorType, Answer as AnswerType } from "@/context/information-context";

const ThreadItem = ({ children, author, isLast, level = 0, hasMoreAfter = false }: { children: React.ReactNode, author: AuthorType, isLast: boolean, level?: number, hasMoreAfter?: boolean }) => (
    <div className="relative flex items-start gap-4">
        <div className="relative flex flex-col items-center">
            <Avatar>
                <AvatarImage src={author.avatar} alt={author.name} />
                <AvatarFallback>{author.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {hasMoreAfter && <div className="absolute top-10 h-full w-px bg-border" style={{ left: '50%', transform: 'translateX(-50%)' }}></div>}
        </div>
        
        {level > 0 && (
          <>
            <div className="absolute left-5 top-5 h-px w-3 bg-border"></div>
          </>
        )}
        
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

    const renderAnswers = (question: QuestionType, answers: AnswerType[], level: number) => {
        return answers.map((answer, answerIndex) => {
            const isLastAnswer = answerIndex === answers.length - 1;
            const hasFollowUps = answer.followUps && answer.followUps.length > 0;
            const hasMoreAfter = !isLastAnswer || hasFollowUps;

            return (
                <div className="pl-8" key={answer.id}>
                    <ThreadItem author={answer.author} isLast={!hasFollowUps} level={level + 1} hasMoreAfter={hasFollowUps}>
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
                    {hasFollowUps && renderFollowUps(question, answer.followUps, level + 1)}
                </div>
            );
        });
    }

    const renderFollowUps = (originalQuestion: QuestionType, followUps: QuestionType[], level: number) => {
        return followUps.map((followUp, followUpIndex) => {
             const isLastFollowUp = followUpIndex === followUps.length - 1;
             const hasAnswers = followUp.answers && followUp.answers.length > 0;
             const hasMoreAfter = !isLastFollowUp || hasAnswers;

            return (
                <div className="pl-8" key={followUp.id}>
                    <ThreadItem author={followUp.author} isLast={!hasAnswers} level={level + 1} hasMoreAfter={hasAnswers}>
                        <p>{followUp.question}</p>
                        <div className="flex justify-end mt-4">
                            <Button onClick={() => onAnswer(followUp.id, followUp.question)}>Answer</Button>
                        </div>
                    </ThreadItem>
                    {hasAnswers && renderAnswers(followUp, followUp.answers, level + 1)}
                </div>
            );
        });
    }

    return (
        <div className="space-y-6">
           <ThreadItem author={thread.author} isLast={thread.answers.length === 0} level={0} hasMoreAfter={thread.answers.length > 0}>
                <p>{thread.question}</p>
                <div className="flex justify-end mt-4">
                    <Button onClick={() => onAnswer(thread.id, thread.question)}>Answer</Button>
                </div>
            </ThreadItem>
            {renderAnswers(thread, thread.answers, 0)}
        </div>
    );
}

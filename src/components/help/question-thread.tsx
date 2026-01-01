"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import React from 'react';

const fakeThread = {
    id: "q1",
    question: "How to set up Firebase Authentication in a Next.js app?",
    author: { name: "John Doe", department: "Computer Science", avatar: "/avatars/john.png" },
    answers: [
        {
            id: "a1",
            text: "You can use the official 'firebase' package. First, you need to create a Firebase project and get your configuration keys. Then, initialize Firebase in a client-side component. After that, you can use the auth functions like `signInWithPopup` or `onAuthStateChanged` to manage user sessions. It's quite straightforward once you get the config set up properly.",
            author: { name: "Jane Smith", department: "Software Engineering", avatar: "/avatars/jane.png" },
            upvotes: 12,
            downvotes: 1,
            followUps: [
                {
                    id: "f1",
                    question: "Thanks! How do you handle protecting routes for authenticated users?",
                    author: { name: "John Doe", department: "Computer Science", avatar: "/avatars/john.png" },
                    answer: {
                        id: "fa1",
                        text: "You can use a higher-order component (HOC) or a React Hook that checks the user's authentication state. If the user is not logged in, you can redirect them to the login page. This prevents unauthorized access to sensitive parts of your application.",
                        author: { name: "Jane Smith", department: "Software Engineering", avatar: "/avatars/jane.png" },
                        upvotes: 8,
                        downvotes: 0,
                    }
                }
            ]
        }
    ]
};

const ThreadItem = ({ children, author, isLast, level = 0 }: { children: React.ReactNode, author: any, isLast: boolean, level?: number }) => (
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
    onFollowUp: (answerId: string, question: string) => void;
}

export function QuestionThread({ questionId, onAnswer, onFollowUp }: QuestionThreadProps) {
    const thread = fakeThread; // In a real app, fetch based on questionId

    const isYourQuery = thread.author.name === "John Doe"; // Replace with actual user check

    return (
        <div className="space-y-6">
            {/* Original Question */}
            <ThreadItem author={thread.author} isLast={thread.answers.length === 0}>
                <p>{thread.question}</p>
                <div className="flex justify-end mt-4">
                    <Button onClick={() => onAnswer(thread.id, thread.question)}>Answer</Button>
                </div>
            </ThreadItem>

            {/* Answers */}
            {thread.answers.map((answer, answerIndex) => (
                <React.Fragment key={answer.id}>
                    <div className="pl-8">
                        <ThreadItem author={answer.author} isLast={!answer.followUps || answer.followUps.length === 0}>
                            <p className="line-clamp-3">{answer.text}</p>
                            <Button variant="link" className="p-0 h-auto text-blue-500">Read More</Button>
                            <div className="mt-4 flex">
                                <Button variant="outline" className="flex-1 rounded-r-none"><ThumbsUp className="mr-2 h-4 w-4" /> {answer.upvotes}</Button>
                                <Button variant="outline" className="flex-1 rounded-l-none"><ThumbsDown className="mr-2 h-4 w-4" /> {answer.downvotes}</Button>
                            </div>
                             {isYourQuery && (
                                <div className="flex justify-end mt-2">
                                     <Button onClick={() => onFollowUp(answer.id, thread.question)}>Follow-up</Button>
                                </div>
                            )}
                        </ThreadItem>
                    </div>

                    {/* Follow-ups */}
                    {answer.followUps && answer.followUps.map((followUp, followUpIndex) => (
                         <React.Fragment key={followUp.id}>
                            <div className="pl-16">
                                 <ThreadItem author={followUp.author} isLast={!followUp.answer}>
                                    <p>{followUp.question}</p>
                                    <div className="flex justify-end mt-4">
                                        <Button onClick={() => onAnswer(followUp.id, followUp.question)}>Answer</Button>
                                    </div>
                                </ThreadItem>
                            </div>
                            {followUp.answer && (
                                <div className="pl-24">
                                     <ThreadItem author={followUp.answer.author} isLast={true}>
                                        <p className="line-clamp-3">{followUp.answer.text}</p>
                                        <Button variant="link" className="p-0 h-auto text-blue-500">Read More</Button>
                                         <div className="mt-4 flex">
                                            <Button variant="outline" className="flex-1 rounded-r-none"><ThumbsUp className="mr-2 h-4 w-4" /> {followUp.answer.upvotes}</Button>
                                            <Button variant="outline" className="flex-1 rounded-l-none"><ThumbsDown className="mr-2 h-4 w-4" /> {followUp.answer.downvotes}</Button>
                                        </div>
                                    </ThreadItem>
                                </div>
                            )}
                         </React.Fragment>
                    ))}
                </React.Fragment>
            ))}
        </div>
    );
}

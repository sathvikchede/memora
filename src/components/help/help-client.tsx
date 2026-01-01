"use client";

import { useState, useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { OpenQueries } from "./open-queries";
import { YourQueries } from "./your-queries";
import { YourResponses } from "./your-responses";
import { QuestionThread } from "./question-thread";
import { PostEditor } from "./post-editor";

type HelpView = "open-queries" | "your-queries" | "your-responses" | "question-detail" | "post-question" | "answer-question" | "follow-up-question";

function HelpClientContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    
    const [view, setView] = useState<HelpView>("open-queries");
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [activeQuestion, setActiveQuestion] = useState<string>("");
    
    useEffect(() => {
        const viewParam = searchParams.get('view') as HelpView;
        const idParam = searchParams.get('id');
        const questionParam = searchParams.get('question');
        
        if (viewParam) setView(viewParam);
        else setView('open-queries');
        
        if (idParam) setActiveQuestionId(idParam);
        else setActiveQuestionId(null);
        
        if (questionParam) setActiveQuestion(decodeURIComponent(questionParam));
        else setActiveQuestion("");

    }, [searchParams]);
    
    const navigate = (newView: HelpView, params?: Record<string, string>) => {
        const newParams = new URLSearchParams(searchParams.toString());
        newParams.set('view', newView);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value) newParams.set(key, value);
                else newParams.delete(key);
            });
        }
        router.push(`/help?${newParams.toString()}`);
    };

    const handleBack = () => {
        switch (view) {
            case "question-detail":
                const from = searchParams.get('from') || 'open-queries';
                navigate(from as HelpView, { id: undefined, question: undefined });
                break;
            case "post-question":
                router.back(); // Go back to the previous page (ask tab)
                break;
            case "answer-question":
            case "follow-up-question":
                navigate("question-detail", { id: activeQuestionId!, question: activeQuestion });
                break;
            default:
                // This case should ideally not be hit if back button is only shown in specific views
                navigate("open-queries");
        }
    };

    const renderNav = () => {
        const navViews: HelpView[] = ["open-queries", "your-queries", "your-responses"];
        if (navViews.includes(view)) {
            return (
                <div className="flex w-full items-center justify-center gap-2">
                    <Button variant={view === "open-queries" ? "secondary" : "ghost"} className="flex-1" onClick={() => navigate("open-queries")}>Open Queries</Button>
                    <Button variant={view === "your-queries" ? "secondary" : "ghost"} className="flex-1" onClick={() => navigate("your-queries")}>Your Queries</Button>
                    <Button variant={view === "your-responses" ? "secondary" : "ghost"} className="flex-1" onClick={() => navigate("your-responses")}>Your Responses</Button>
                </div>
            );
        }

        let title = "";
        switch(view) {
            case "question-detail": title = activeQuestion; break;
            case "post-question": title = "Post a Question"; break;
            case "answer-question": title = `Answer: ${activeQuestion}`; break;
            case "follow-up-question": title = `Follow-up: ${activeQuestion}`; break;
        }

        return (
            <div className="relative flex w-full items-center justify-center">
                <div className="absolute left-0">
                    <Button variant="ghost" className="w-auto" onClick={handleBack}>
                        <ChevronLeft className="md:mr-2" />
                        <span className="hidden md:inline">Back</span>
                    </Button>
                </div>
                <span className="truncate px-16 text-center font-bold text-lg">{title}</span>
            </div>
        );
    };

    const renderContent = () => {
        switch (view) {
            case "open-queries":
                return <OpenQueries onQuestionSelect={(id, question) => navigate("question-detail", { id, question, from: 'open-queries' })} />;
            case "your-queries":
                return <YourQueries onQuestionSelect={(id, question) => navigate("question-detail", { id, question, from: 'your-queries' })} />;
            case "your-responses":
                return <YourResponses onQuestionSelect={(id, question) => navigate("question-detail", { id, question, from: 'your-responses' })} />;
            case "question-detail":
                if (!activeQuestionId) return <div>Question not found.</div>;
                return <QuestionThread 
                            questionId={activeQuestionId} 
                            onAnswer={(id, q) => navigate('answer-question', {id, question: q})}
                            onFollowUp={(id, q) => navigate('follow-up-question', {id, question: q})}
                        />;
            case "post-question":
                return <PostEditor 
                            mode="post-question"
                            question={activeQuestion}
                            onPost={() => router.back()}
                        />;
            case "answer-question":
                 if (!activeQuestionId) return <div>Question not found.</div>;
                return <PostEditor 
                            mode="answer-question"
                            question={activeQuestion}
                            onPost={() => navigate('question-detail', { id: activeQuestionId, question: activeQuestion })}
                        />;
            case "follow-up-question":
                 if (!activeQuestionId) return <div>Question not found.</div>;
                return <PostEditor 
                            mode="follow-up-question"
                            question={activeQuestion}
                            onPost={() => navigate('question-detail', { id: activeQuestionId, question: activeQuestion })}
                        />;
            default:
                return <div>Select a view</div>;
        }
    };

    return (
        <div className="flex h-full flex-col px-4 sm:px-6 lg:px-8">
           <div className="mx-auto w-full max-w-4xl flex-1 flex flex-col">
            <div className="flex h-14 items-center justify-center gap-2">
                {renderNav()}
            </div>
            <Separator />
            <div className="flex-1 overflow-y-auto py-4">
                {renderContent()}
            </div>
           </div>
        </div>
    );
}


export function HelpClient() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <HelpClientContent />
        </Suspense>
    )
}

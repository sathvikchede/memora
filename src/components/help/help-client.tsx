
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
import { useInformation } from "@/context/information-context";

type HelpView = "open-queries" | "your-queries" | "your-responses" | "question-detail" | "post-question" | "answer-question" | "follow-up-question";

function HelpClientContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { getQuestionById } = useInformation();
    
    const [view, setView] = useState<HelpView>("open-queries");
    const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
    const [activeQuestion, setActiveQuestion] = useState<string>("");
    const [activeAnswerId, setActiveAnswerId] = useState<string | null>(null);
    
    useEffect(() => {
        const viewParam = searchParams.get('view') as HelpView;
        const idParam = searchParams.get('id');
        const questionParam = searchParams.get('question');
        const answerIdParam = searchParams.get('answerId');
        
        if (viewParam) setView(viewParam);
        else setView('open-queries');
        
        if (idParam) setActiveQuestionId(idParam);
        else setActiveQuestionId(null);

        if (answerIdParam) setActiveAnswerId(answerIdParam);
        else setActiveAnswerId(null);
        
        if (questionParam) setActiveQuestion(decodeURIComponent(questionParam));
        else setActiveQuestion("");

    }, [searchParams]);
    
    const navigate = (newView: HelpView, params?: Record<string, string | undefined>) => {
        const newParams = new URLSearchParams(searchParams);
        newParams.set('view', newView);
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined) newParams.set(key, value);
                else newParams.delete(key);
            });
        }
        router.push(`/help?${newParams.toString()}`);
    };

    const handleBack = () => {
        const from = searchParams.get('from') || 'open-queries';
        switch (view) {
            case "question-detail":
                navigate(from as HelpView);
                break;
            case "post-question":
                router.back(); 
                break;
            case "answer-question":
            case "follow-up-question":
                const questionToReturn = getQuestionById(activeQuestionId!);
                const rootQuestionId = questionToReturn?.parentId || activeQuestionId!;
                const rootQuestionText = getQuestionById(rootQuestionId)?.question || activeQuestion;
                navigate("question-detail", { id: rootQuestionId, question: rootQuestionText, from });
                break;
            default:
                navigate("open-queries");
        }
    };

    const truncateTitle = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    const renderNav = () => {
        const navViews: HelpView[] = ["open-queries", "your-queries", "your-responses"];
        if (navViews.includes(view)) {
            return (
                <div className="flex w-full items-center justify-center gap-2">
                    <Button variant={view === "your-queries" ? "secondary" : "ghost"} className="flex-1" onClick={() => navigate("your-queries")}>Your Queries</Button>
                    <Button variant={view === "open-queries" ? "secondary" : "ghost"} className="flex-1" onClick={() => navigate("open-queries")}>Open Queries</Button>
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
            <div className="relative flex h-14 w-full items-center justify-center">
                <div className="absolute left-0">
                    <Button variant="ghost" className="w-auto" onClick={handleBack}>
                        <ChevronLeft className="md:mr-2" />
                        <span className="hidden md:inline">Back</span>
                    </Button>
                </div>
                <div className="w-full text-center">
                    <span className="truncate px-16 text-center font-bold text-lg">{truncateTitle(title, 45)}</span>
                </div>
            </div>
        );
    };

    const renderContent = () => {
        const from = searchParams.get('from') || 'open-queries';
        switch (view) {
            case "open-queries":
                return <OpenQueries onQuestionSelect={(id, q) => navigate("question-detail", { id, question: q, from: 'open-queries' })} />;
            case "your-queries":
                return <YourQueries onQuestionSelect={(id, q) => navigate("question-detail", { id, question: q, from: 'your-queries' })} />;
            case "your-responses":
                return <YourResponses onQuestionSelect={(id, q) => navigate("question-detail", { id, question: q, from: 'your-responses' })} />;
            case "question-detail":
                if (!activeQuestionId) return <div>Question not found.</div>;
                return <QuestionThread 
                            questionId={activeQuestionId} 
                            onAnswer={(id, q) => navigate('answer-question', {id, question: q, from})}
                            onFollowUp={(qId, aId, q) => navigate('follow-up-question', {id: qId, answerId: aId, question: q, from})}
                        />;
            case "post-question":
                return <PostEditor 
                            mode="post-question"
                            question={activeQuestion}
                            onPost={() => router.back()}
                        />;
            case "answer-question":
                 if (!activeQuestionId) return <div>Question not found.</div>;
                 const questionToReturnFromAnswer = getQuestionById(activeQuestionId!);
                 const rootQuestionIdFromAnswer = questionToReturnFromAnswer?.parentId || activeQuestionId!;
                 const rootQuestionTextFromAnswer = getQuestionById(rootQuestionIdFromAnswer)?.question || activeQuestion;

                return <PostEditor 
                            mode="answer-question"
                            question={activeQuestion}
                            questionId={activeQuestionId}
                            onPost={() => navigate('question-detail', { id: rootQuestionIdFromAnswer, question: rootQuestionTextFromAnswer, from })}
                        />;
            case "follow-up-question":
                 if (!activeQuestionId || !activeAnswerId) return <div>Question not found.</div>;
                 const questionToReturnFromFollowUp = getQuestionById(activeQuestionId!);
                 const rootQuestionIdFromFollowUp = questionToReturnFromFollowUp?.parentId || activeQuestionId!;
                 const rootQuestionTextFromFollowUp = getQuestionById(rootQuestionIdFromFollowUp)?.question || activeQuestion;
                return <PostEditor 
                            mode="follow-up-question"
                            question={activeQuestion}
                            questionId={activeQuestionId}
                            answerId={activeAnswerId}
                            onPost={() => navigate('question-detail', { id: rootQuestionIdFromFollowUp, question: rootQuestionTextFromFollowUp, from })}
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

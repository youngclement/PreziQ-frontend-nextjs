"use client";

// Update the imports at the top of question-preview.tsx
import {
    Clock, Image, Zap, Pencil, ChevronDown, ArrowUp,
    Search, Monitor, Tablet, Smartphone
} from "lucide-react";
import {
    Card, CardHeader, CardTitle, CardDescription, CardContent
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { QuizQuestion, QuizOption } from "../types";
import { motion, AnimatePresence } from "framer-motion";
import React, { useEffect, useRef } from "react";

interface QuestionPreviewProps {
    questions: QuizQuestion[];
    activeQuestionIndex: number;
    timeLimit: number;
    backgroundImage: string;
    previewMode: boolean;
    onQuestionTextChange: (value: string, questionIndex: number) => void;
    onOptionChange: (questionIndex: number, optionIndex: number, field: string, value: any) => void;
    onChangeQuestion: (index: number) => void;
}

export function QuestionPreview({
    questions,
    activeQuestionIndex,
    timeLimit,
    backgroundImage,
    previewMode,
    onQuestionTextChange,
    onOptionChange,
    onChangeQuestion
}: QuestionPreviewProps) {
    const [viewMode, setViewMode] = React.useState("desktop");
    const [showScrollTop, setShowScrollTop] = React.useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const questionRefs = useRef<(HTMLDivElement | null)[]>([]);

    // Function to handle scroll to question
    const scrollToQuestion = (index: number) => {
        if (questionRefs.current[index]) {
            questionRefs.current[index]?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            onChangeQuestion(index);
        }
    };

    // Setup scroll event listener
    useEffect(() => {
        const handleScroll = () => {
            if (scrollContainerRef.current) {
                setShowScrollTop(scrollContainerRef.current.scrollTop > 300);

                // Find which question is most visible
                const containerTop = scrollContainerRef.current.scrollTop;
                const containerHeight = scrollContainerRef.current.clientHeight;
                const containerCenter = containerTop + containerHeight / 2;

                let closestIndex = 0;
                let closestDistance = Infinity;

                questionRefs.current.forEach((ref, index) => {
                    if (ref) {
                        const rect = ref.getBoundingClientRect();
                        const refCenter = rect.top + rect.height / 2;
                        const distance = Math.abs(refCenter - containerCenter);

                        if (distance < closestDistance) {
                            closestDistance = distance;
                            closestIndex = index;
                        }
                    }
                });

                if (closestIndex !== activeQuestionIndex) {
                    onChangeQuestion(closestIndex);
                }
            }
        };

        const scrollContainer = scrollContainerRef.current;
        if (scrollContainer) {
            scrollContainer.addEventListener('scroll', handleScroll);
        }

        return () => {
            if (scrollContainer) {
                scrollContainer.removeEventListener('scroll', handleScroll);
            }
        };
    }, [activeQuestionIndex, onChangeQuestion]);

    // Scroll to active question when it changes
    useEffect(() => {
        scrollToQuestion(activeQuestionIndex);
    }, []);

    const scrollToTop = () => {
        scrollContainerRef.current?.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    return (
        <motion.div
            className="flex flex-col h-full space-y-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {/* Enhanced Preview Header */}
            <Card className="border border-gray-100 dark:border-gray-800 shadow-md overflow-hidden">
                <CardHeader className="p-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
                                <Zap className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <CardTitle className="text-sm font-semibold">
                                    Question Preview
                                </CardTitle>
                                <CardDescription className="text-xs">
                                    {activeQuestionIndex + 1} of {questions.length} Questions
                                </CardDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-background/80 backdrop-blur-sm rounded-md border border-border px-2 flex items-center">
                                <Select
                                    value={activeQuestionIndex.toString()}
                                    onValueChange={(value) => scrollToQuestion(Number(value))}
                                >
                                    <SelectTrigger className="h-9 w-[130px] border-0 focus:ring-0 focus:ring-offset-0 bg-transparent">
                                        <SelectValue placeholder="Select question" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {questions.map((_, idx) => (
                                            <SelectItem key={idx} value={idx.toString()}>
                                                Question {idx + 1}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <Tabs defaultValue="desktop" value={viewMode} onValueChange={setViewMode}>
                                <TabsList className="h-9 bg-background/80 backdrop-blur-sm">
                                    <TabsTrigger value="desktop" className="px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Monitor className="h-4 w-4 mr-1" />
                                        <span className="sr-only sm:not-sr-only sm:text-xs">Desktop</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="tablet" className="px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Tablet className="h-4 w-4 mr-1" />
                                        <span className="sr-only sm:not-sr-only sm:text-xs">Tablet</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="mobile" className="px-3 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                                        <Smartphone className="h-4 w-4 mr-1" />
                                        <span className="sr-only sm:not-sr-only sm:text-xs">Mobile</span>
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Scroll to top button */}
            {showScrollTop && (
                <Button
                    variant="secondary"
                    size="icon"
                    className="fixed bottom-6 right-6 z-50 rounded-full h-12 w-12 shadow-lg"
                    onClick={scrollToTop}
                >
                    <ArrowUp className="h-5 w-5" />
                </Button>
            )}

            {/* Main Scrollable Preview Area */}
            <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto pr-2 pb-20"
                style={{ maxHeight: 'calc(100vh - 14rem)' }}
            >
                <div className="space-y-16 pb-8">
                    {questions.map((question, questionIndex) => (
                        <div
                            key={questionIndex}
                            ref={el => questionRefs.current[questionIndex] = el}
                            className={cn(
                                "relative",
                                questionIndex === activeQuestionIndex && "scroll-mt-4"
                            )}
                        >
                            {/* Question number indicator */}
                            <div className="absolute -left-16 top-1/2 transform -translate-y-1/2 hidden md:flex flex-col items-center">
                                <div className={cn(
                                    "h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold",
                                    questionIndex === activeQuestionIndex
                                        ? "bg-primary text-primary-foreground"
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {questionIndex + 1}
                                </div>
                                {questionIndex < questions.length - 1 && (
                                    <div className="h-24 w-px bg-border/50 my-2"></div>
                                )}
                            </div>

                            {/* Question Card */}
                            <Card className={cn(
                                "border-none shadow-xl overflow-hidden transition-all duration-200",
                                questionIndex === activeQuestionIndex
                                    ? "ring-2 ring-primary/20 scale-100"
                                    : "scale-[0.98] opacity-90 hover:opacity-100 hover:scale-[0.99]"
                            )}>
                                <div className={cn(
                                    "transition-all duration-300",
                                    viewMode === "tablet" && "max-w-2xl mx-auto",
                                    viewMode === "mobile" && "max-w-sm mx-auto"
                                )}>
                                    <motion.div
                                        className={cn(
                                            "aspect-video rounded-t-xl flex flex-col shadow-sm relative overflow-hidden",
                                            backgroundImage && "bg-cover bg-center"
                                        )}
                                        style={{
                                            backgroundImage: backgroundImage
                                                ? `url(${backgroundImage})`
                                                : `linear-gradient(135deg, ${['#60a5fa, #3b82f6', '#f472b6, #ec4899', '#34d399, #10b981', '#a78bfa, #8b5cf6', '#fbbf24, #f59e0b'][questionIndex % 5]
                                                })`,
                                        }}
                                        initial={{ opacity: 0.8 }}
                                        whileInView={{ opacity: 1 }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        {/* Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />

                                        {/* Status Bar */}
                                        <div className="absolute top-0 left-0 right-0 h-14 bg-gradient-to-b from-black/40 to-transparent flex items-center justify-between px-6 text-white z-10">
                                            <motion.div
                                                className="flex items-center gap-2"
                                                whileHover={{ scale: 1.05 }}
                                            >
                                                <Zap className="h-5 w-5 text-yellow-400" />
                                                <span className="text-base font-bold tracking-tight">PreziQ</span>
                                            </motion.div>
                                            <div className="flex items-center gap-3">
                                                <motion.div
                                                    className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full"
                                                >
                                                    <span className="text-sm font-medium">Question {questionIndex + 1}</span>
                                                </motion.div>
                                                <motion.div
                                                    className="flex items-center gap-1 bg-black/30 px-3 py-1 rounded-full"
                                                    whileHover={{ scale: 1.05 }}
                                                >
                                                    <Clock className="h-4 w-4" />
                                                    <span className="text-sm font-medium">{timeLimit}s</span>
                                                </motion.div>
                                            </div>
                                        </div>

                                        {/* Question Area */}
                                        <div className="flex-1 flex flex-col items-center justify-center p-8 z-10">
                                            {!previewMode ? (
                                                <div className="relative w-full max-w-3xl group">
                                                    <Textarea
                                                        value={question.question_text}
                                                        onChange={(e) => onQuestionTextChange(e.target.value, questionIndex)}
                                                        placeholder="Type your question here..."
                                                        className="text-2xl md:text-3xl font-bold text-center bg-transparent border-none resize-none focus-visible:ring-2 focus-visible:ring-white/20 text-white placeholder-white/50 p-0 min-h-[120px]"
                                                    />
                                                    <motion.div
                                                        className="absolute top-2 right-2"
                                                        initial={{ opacity: 0 }}
                                                        whileHover={{ opacity: 1 }}
                                                    >
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-white/20 hover:bg-white/30">
                                                            <Pencil className="h-4 w-4" />
                                                        </Button>
                                                    </motion.div>
                                                </div>
                                            ) : (
                                                <motion.h2
                                                    className="text-2xl md:text-3xl font-bold text-center max-w-3xl text-white drop-shadow-lg"
                                                    initial={{ y: 20, opacity: 0 }}
                                                    whileInView={{ y: 0, opacity: 1 }}
                                                    transition={{ delay: 0.1 }}
                                                >
                                                    {question.question_text || `Question ${questionIndex + 1}`}
                                                </motion.h2>
                                            )}
                                        </div>

                                        {/* Image Attribution */}
                                        {backgroundImage && (
                                            <motion.div
                                                className="absolute bottom-2 right-2"
                                                whileHover={{ scale: 1.1 }}
                                            >
                                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full bg-black/30 hover:bg-black/40 text-white">
                                                    <Image className="h-4 w-4" />
                                                </Button>
                                            </motion.div>
                                        )}
                                    </motion.div>

                                    {/* Options Grid */}
                                    <div className={cn(
                                        "grid gap-4 p-6 bg-card z-10",
                                        question.options.length <= 4 ? "grid-cols-2" : "grid-cols-3",
                                        viewMode === "mobile" && "grid-cols-1"
                                    )}>
                                        {question.options.map((option, optionIndex) => (
                                            <OptionItem
                                                key={optionIndex}
                                                option={option}
                                                index={optionIndex}
                                                previewMode={previewMode}
                                                onOptionChange={(index, field, value) =>
                                                    onOptionChange(questionIndex, index, field, value)
                                                }
                                                questionType={question.question_type}
                                            />
                                        ))}
                                    </div>

                                    {/* Next question indicator */}
                                    {questionIndex < questions.length - 1 && (
                                        <div className="flex justify-center py-4">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-muted-foreground hover:text-foreground"
                                                onClick={() => scrollToQuestion(questionIndex + 1)}
                                            >
                                                Next Question <ChevronDown className="ml-1 h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </motion.div>
    );
}

interface OptionItemProps {
    option: QuizOption;
    index: number;
    previewMode: boolean;
    questionType: string;
    onOptionChange: (index: number, field: string, value: any) => void;
}

function OptionItem({ option, index, previewMode, questionType, onOptionChange }: OptionItemProps) {
    const optionLetter = ['A', 'B', 'C', 'D', 'E', 'F'][index];

    const getOptionStyle = () => {
        const styles = [
            { bg: "bg-gradient-to-r from-pink-500 to-rose-500", hover: "hover:from-pink-600 hover:to-rose-600" },
            { bg: "bg-gradient-to-r from-blue-500 to-indigo-500", hover: "hover:from-blue-600 hover:to-indigo-600" },
            { bg: "bg-gradient-to-r from-green-500 to-emerald-500", hover: "hover:from-green-600 hover:to-emerald-600" },
            { bg: "bg-gradient-to-r from-yellow-500 to-amber-500", hover: "hover:from-yellow-600 hover:to-amber-600" },
            { bg: "bg-gradient-to-r from-purple-500 to-violet-500", hover: "hover:from-purple-600 hover:to-violet-600" },
            { bg: "bg-gradient-to-r from-red-500 to-orange-500", hover: "hover:from-red-600 hover:to-orange-600" },
        ];
        return styles[index % styles.length];
    };

    const optionStyle = getOptionStyle();

    return (
        <motion.div
            className={cn(
                "group rounded-xl transition-all duration-200 overflow-hidden shadow-md",
                previewMode && "cursor-pointer hover:shadow-lg",
                previewMode && option.is_correct && "ring-4 ring-green-400/30"
            )}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            layout
        >
            <div className={cn(
                "p-4 h-full bg-white/95 dark:bg-gray-800/95 backdrop-blur-md border border-gray-200/50 dark:border-gray-700/50 flex items-center",
                previewMode && option.is_correct && "bg-green-100/95 dark:bg-green-900/50"
            )}>
                <div
                    className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center mr-4 flex-shrink-0 text-white font-semibold shadow-md",
                        optionStyle.bg
                    )}
                >
                    {optionLetter}
                </div>

                {!previewMode ? (
                    <div className="flex-1 flex items-center min-w-0 gap-3">
                        <Input
                            value={option.option_text}
                            onChange={(e) => onOptionChange(index, 'option_text', e.target.value)}
                            placeholder={`Option ${optionLetter}`}
                            className="border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-0 py-1 text-base font-medium"
                        />
                        <Checkbox
                            checked={option.is_correct}
                            onCheckedChange={(checked) =>
                                onOptionChange(index, 'is_correct', checked === true)
                            }
                            className="h-5 w-5 rounded-md border-2 data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500"
                        />
                    </div>
                ) : (
                    <span className="flex-1 truncate text-base font-medium text-gray-800 dark:text-gray-200">
                        {option.option_text || `Option ${optionLetter}`}
                    </span>
                )}
            </div>
        </motion.div>
    );
}
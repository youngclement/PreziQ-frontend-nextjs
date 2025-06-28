"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Radio,
    CheckSquare,
    CheckCircle,
    XCircle,
    Type,
    MoveVertical,
    MapPin,
    Link2,
    FileText,
    Clock,
    Zap,
    Monitor,
    Tablet,
    Smartphone
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import TranslatedText from "@/components/ui/translated-text";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Demo quiz data types
interface RegularOption {
    text: string;
    isCorrect: boolean;
}

interface ReorderOption {
    text: string;
    order: number;
}

interface MatchingPair {
    left: string;
    right: string;
}

interface QuizDemo {
    id: string;
    type: string;
    title: string;
    description: string;
    icon: React.ReactNode;
    color: string;
    bgColor: string;
    questionText: string;
    options?: RegularOption[] | ReorderOption[];
    correctAnswer?: string;
    location?: string;
    pairs?: MatchingPair[];
    content?: string;
}

const quizDemos: QuizDemo[] = [
    {
        id: 'multiple-choice',
        type: 'QUIZ_BUTTONS',
        title: 'Multiple Choice Quiz',
        description: 'Students select one correct answer from multiple options',
        icon: <Radio className="h-5 w-5" />,
        color: 'from-blue-500 to-blue-600',
        bgColor: 'bg-blue-500',
        questionText: 'What is the capital of France?',
        options: [
            { text: 'London', isCorrect: false },
            { text: 'Paris', isCorrect: true },
            { text: 'Berlin', isCorrect: false },
            { text: 'Madrid', isCorrect: false }
        ] as RegularOption[]
    },
    {
        id: 'multiple-response',
        type: 'QUIZ_CHECKBOXES',
        title: 'Multiple Response Quiz',
        description: 'Students can select multiple correct answers',
        icon: <CheckSquare className="h-5 w-5" />,
        color: 'from-green-500 to-green-600',
        bgColor: 'bg-green-500',
        questionText: 'Which of these are programming languages?',
        options: [
            { text: 'JavaScript', isCorrect: true },
            { text: 'Python', isCorrect: true },
            { text: 'HTML', isCorrect: false },
            { text: 'TypeScript', isCorrect: true }
        ] as RegularOption[]
    },
    {
        id: 'true-false',
        type: 'QUIZ_TRUE_OR_FALSE',
        title: 'True or False Quiz',
        description: 'Simple binary choice questions',
        icon: <CheckCircle className="h-5 w-5" />,
        color: 'from-purple-500 to-purple-600',
        bgColor: 'bg-purple-500',
        questionText: 'The Earth is the third planet from the Sun.',
        options: [
            { text: 'True', isCorrect: true },
            { text: 'False', isCorrect: false }
        ] as RegularOption[]
    },
    {
        id: 'type-answer',
        type: 'QUIZ_TYPE_ANSWER',
        title: 'Type Answer Quiz',
        description: 'Students type their answer in a text field',
        icon: <Type className="h-5 w-5" />,
        color: 'from-orange-500 to-orange-600',
        bgColor: 'bg-orange-500',
        questionText: 'What is 15 + 27?',
        correctAnswer: '42'
    },
    {
        id: 'reorder',
        type: 'QUIZ_REORDER',
        title: 'Reorder Quiz',
        description: 'Students arrange items in the correct order',
        icon: <MoveVertical className="h-5 w-5" />,
        color: 'from-red-500 to-red-600',
        bgColor: 'bg-red-500',
        questionText: 'Arrange these events in chronological order:',
        options: [
            { text: 'World War I', order: 1 },
            { text: 'World War II', order: 2 },
            { text: 'Cold War', order: 3 },
            { text: 'Fall of Berlin Wall', order: 4 }
        ] as ReorderOption[]
    },
    {
        id: 'location',
        type: 'QUIZ_LOCATION',
        title: 'Location Quiz',
        description: 'Students identify locations on an interactive map',
        icon: <MapPin className="h-5 w-5" />,
        color: 'from-teal-500 to-teal-600',
        bgColor: 'bg-teal-500',
        questionText: 'Where is the Eiffel Tower located?',
        location: 'Paris, France'
    },
    {
        id: 'matching-pairs',
        type: 'QUIZ_MATCHING_PAIRS',
        title: 'Matching Pairs Quiz',
        description: 'Students connect related items from two columns',
        icon: <Link2 className="h-5 w-5" />,
        color: 'from-indigo-500 to-indigo-600',
        bgColor: 'bg-indigo-500',
        questionText: 'Match the countries with their capitals:',
        pairs: [
            { left: 'France', right: 'Paris' },
            { left: 'Germany', right: 'Berlin' },
            { left: 'Italy', right: 'Rome' }
        ]
    },
    {
        id: 'info-slide',
        type: 'INFO_SLIDE',
        title: 'Info Slide',
        description: 'Present information without quiz interaction',
        icon: <FileText className="h-5 w-5" />,
        color: 'from-gray-500 to-gray-600',
        bgColor: 'bg-gray-500',
        questionText: 'Introduction to Web Development',
        content: 'Web development is the process of building websites and web applications...'
    }
];

interface QuizDemoCardProps {
    demo: QuizDemo;
    viewMode: 'desktop' | 'tablet' | 'mobile';
    isActive: boolean;
    onClick: () => void;
}

function QuizDemoCard({ demo, viewMode, isActive, onClick }: QuizDemoCardProps) {
    const { t } = useLanguage();

    const renderQuizContent = () => {
        switch (demo.type) {
            case 'QUIZ_BUTTONS':
            case 'QUIZ_CHECKBOXES':
                const regularOptions = demo.options as RegularOption[] | undefined;
                return (
                    <div className="space-y-1.5">
                        {regularOptions?.map((option, index) => (
                            <motion.div
                                key={index}
                                className={cn(
                                    'flex items-center gap-1.5 p-1.5 rounded-md border-2 transition-all duration-300',
                                    option.isCorrect
                                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                                )}
                                whileHover={{ scale: 1.01 }}
                            >
                                <div className={cn(
                                    'w-5 h-5 rounded-full flex items-center justify-center text-white font-medium text-xs',
                                    `bg-gradient-to-r ${demo.color}`
                                )}>
                                    {String.fromCharCode(65 + index)}
                                </div>
                                <span className="flex-1 text-xs font-medium">{option.text}</span>
                                {option.isCorrect && (
                                    <CheckCircle className="h-2.5 w-2.5 text-green-500" />
                                )}
                            </motion.div>
                        ))}
                    </div>
                );

            case 'QUIZ_TRUE_OR_FALSE':
                const trueFalseOptions = demo.options as RegularOption[] | undefined;
                return (
                    <div className="grid grid-cols-2 gap-2">
                        {trueFalseOptions?.map((option, index) => {
                            const isTrue = option.text.toLowerCase() === 'true';
                            return (
                                <motion.div
                                    key={index}
                                    className={cn(
                                        'p-2 rounded-md border-2 flex items-center gap-1.5 transition-all duration-300',
                                        option.isCorrect
                                            ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                            : isTrue
                                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700'
                                                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700'
                                    )}
                                    whileHover={{ scale: 1.01 }}
                                >
                                    <div className={cn(
                                        'w-5 h-5 rounded-full flex items-center justify-center text-white',
                                        isTrue ? 'bg-blue-500' : 'bg-red-500'
                                    )}>
                                        {isTrue ? <CheckCircle className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
                                    </div>
                                    <span className="font-medium text-xs">{option.text}</span>
                                    {option.isCorrect && (
                                        <CheckCircle className="h-2.5 w-2.5 text-green-500 ml-auto" />
                                    )}
                                </motion.div>
                            );
                        })}
                    </div>
                );

            case 'QUIZ_TYPE_ANSWER':
                return (
                    <div className="space-y-2">
                        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md p-2">
                            <div className="h-6 border border-gray-200 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 px-2 flex items-center text-gray-500 dark:text-gray-400 text-xs">
                                <TranslatedText text="Type your answer here..." translationKey="quiz.typeAnswer" />
                            </div>
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400 flex items-center">
                            <span className="font-medium mr-2">
                                <TranslatedText text="Correct answer:" translationKey="quiz.correctAnswer" />
                            </span>
                            <span className="bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-700">
                                {demo.correctAnswer}
                            </span>
                        </div>
                    </div>
                );

            case 'QUIZ_REORDER':
                const reorderOptions = demo.options as ReorderOption[] | undefined;
                return (
                    <div className="space-y-1">
                        <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 flex items-center">
                            <MoveVertical className="h-2.5 w-2.5 mr-1" />
                            <TranslatedText text="Drag to reorder the items" translationKey="quiz.dragToReorder" />
                        </div>
                        {reorderOptions?.map((option, index) => (
                            <motion.div
                                key={index}
                                className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-600 hover:shadow-sm transition-all"
                                whileHover={{ scale: 1.005 }}
                            >
                                <div className="w-4 h-4 rounded-full bg-gray-800 dark:bg-gray-600 flex items-center justify-center text-white text-xs font-semibold">
                                    {option.order}
                                </div>
                                <span className="flex-1 text-xs font-medium">{option.text}</span>
                                <div className="text-gray-400">
                                    <MoveVertical className="h-2.5 w-2.5" />
                                </div>
                            </motion.div>
                        ))}
                    </div>
                );

            case 'QUIZ_LOCATION':
                return (
                    <div className="space-y-2">
                        <div className="bg-gray-100 dark:bg-gray-700 rounded-md p-3 flex items-center justify-center min-h-[60px]">
                            <div className="text-center">
                                <MapPin className="h-6 w-6 text-teal-500 mx-auto mb-1" />
                                <p className="text-xs font-medium">
                                    <TranslatedText text="Interactive Map" translationKey="quiz.interactiveMap" />
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                    <TranslatedText text="Click to identify:" translationKey="quiz.clickToIdentify" /> {demo.location}
                                </p>
                            </div>
                        </div>
                    </div>
                );

            case 'QUIZ_MATCHING_PAIRS':
                return (
                    <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    <TranslatedText text="Countries" translationKey="quiz.countries" />
                                </h4>
                                {demo.pairs?.map((pair, index) => (
                                    <div key={index} className="p-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md text-xs font-medium">
                                        {pair.left}
                                    </div>
                                ))}
                            </div>
                            <div className="space-y-1">
                                <h4 className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                                    <TranslatedText text="Capitals" translationKey="quiz.capitals" />
                                </h4>
                                {demo.pairs?.map((pair, index) => (
                                    <div key={index} className="p-1 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-md text-xs font-medium">
                                        {pair.right}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex items-center justify-center">
                            <Link2 className="h-2.5 w-2.5 text-gray-400" />
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                <TranslatedText text="Drag to connect" translationKey="quiz.dragToConnect" />
                            </span>
                        </div>
                    </div>
                );

            case 'INFO_SLIDE':
                return (
                    <div className="space-y-2">
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-md p-3 min-h-[60px] flex flex-col items-center justify-center">
                            <img src="https://www.saokim.com.vn/blog/wp-content/uploads/2020/03/download-mien-phi-slide-1.jpg.webp" alt="slide demo" className="w-full max-w-xs rounded-md mb-2" />

                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <motion.div
            className={cn(
                'cursor-pointer transition-all duration-300',
                isActive ? 'scale-105' : 'hover:scale-102'
            )}
            onClick={onClick}
            whileHover={{ y: -2 }}
        >
            <Card className={cn(
                'border-none rounded-lg shadow-md overflow-hidden transition-all duration-300',
                isActive ? 'ring-2 ring-primary/20 shadow-lg' : 'hover:shadow-lg',
                viewMode === 'desktop' && 'max-w-md',
                viewMode === 'tablet' && 'max-w-sm',
                viewMode === 'mobile' && 'max-w-xs'
            )}>
                {/* Header */}
                <div className={cn(
                    'aspect-[16/7] rounded-t-lg flex flex-col shadow-sm relative overflow-hidden bg-gradient-to-br',
                    demo.color
                )} style={{
                    backgroundImage: `url('https://cdn-ikpkein.nitrocdn.com/INKfFkcZaxYxVZdBkWNQHypzuEwJDgiD/assets/images/optimized/rev-8fef668/www.proofreading.co.uk/wordpress/wp-content/uploads/2024/06/icaruseducation_converting_assertive_to_interrogative_sentenc_3c043580-ef81-4376-9ecf-979c300756f2_1.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}>
                    <div className="absolute inset-0 bg-black/20" />

                    {/* Status Bar */}
                    <div className="absolute top-0 left-0 right-0 h-6 bg-black/40 flex items-center justify-between px-2 text-white z-10">
                        <div className="flex items-center gap-1.5">
                            <div className={cn(
                                'h-4 w-4 rounded-full flex items-center justify-center shadow-sm text-white',
                                demo.bgColor
                            )}>
                                {React.cloneElement(demo.icon as React.ReactElement, { className: 'h-2.5 w-2.5' })}
                            </div>
                            <div>
                                <div className="text-xs font-medium">
                                    {demo.title}
                                </div>
                            </div>
                        </div>                            <div className="flex items-center gap-1">
                            <div className="flex items-center gap-0.5 bg-black/60 px-1 py-0.5 rounded-full text-xs font-medium">
                                <TranslatedText text="Demo" translationKey="quiz.demo" />
                            </div>
                            <div className="flex items-center gap-0.5 bg-primary dark:bg-white/20 px-1 py-0.5 rounded-full text-xs font-medium">
                                <Clock className="h-2 w-2" />
                                <span>30s</span>
                            </div>
                        </div>
                    </div>

                    {/* Question Text */}
                    <div className="flex-1 flex flex-col items-center justify-center z-10 py-2 px-2">
                        <h3 className="text-xs md:text-sm font-bold text-center text-white drop-shadow-sm px-1">
                            <TranslatedText
                                text={demo.questionText}
                                translationKey={`quiz.question.${demo.id}`}
                            />
                        </h3>
                    </div>
                </div>

                {/* Content */}
                <CardContent className="p-2 bg-white dark:bg-black">
                    {renderQuizContent()}

                    {/* Description */}
                    <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                <TranslatedText
                                    text={demo.description}
                                    translationKey={`quiz.description.${demo.id}`}
                                />
                            </p>
                            <Badge variant="outline" className="text-xs">
                                <TranslatedText
                                    text={demo.type.replace('QUIZ_', '').replace('_', ' ').toLowerCase()}
                                    translationKey={`quiz.type.${demo.type.toLowerCase()}`}
                                />
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    );
}

export function QuizDemoSection() {
    const { t } = useLanguage();
    const [viewMode, setViewMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

    return (
        <section className="py-12 md:py-16 relative overflow-hidden bg-white/50 dark:bg-black">
            {/* Background with animated elements */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className="absolute top-1/4 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20 bg-blue-300 dark:bg-blue-600"
                    animate={{
                        y: [0, -20, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
                <motion.div
                    className="absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20 bg-purple-300 dark:bg-purple-600"
                    animate={{
                        y: [0, -20, 0],
                    }}
                    transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 2
                    }}
                />
                <motion.div
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10 bg-indigo-300 dark:bg-indigo-600"
                    animate={{
                        y: [0, -30, 0],
                        x: [0, 20, 0],
                    }}
                    transition={{
                        duration: 10,
                        repeat: Infinity,
                        ease: "easeInOut",
                        delay: 1
                    }}
                />
            </div>

            <div className="container mx-auto px-4 relative max-w-6xl">
                {/* Header */}
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                    viewport={{ once: true }}
                >
                    <Badge variant="outline" className="mb-4 px-3 py-1.5 text-xs font-medium border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
                        <Zap className="h-3 w-3 mr-1.5 text-blue-600 dark:text-blue-400" />
                        <TranslatedText text="Interactive Quiz Gallery" translationKey="quizTypes" />
                    </Badge>

                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent">
                        <TranslatedText
                            text="Khám phá "
                            translationKey="quiz.exploreTitle"
                        />
                        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent">
                            <TranslatedText
                                text="Các Định Dạng Quiz"
                                translationKey="quiz.quizFormats"
                            />
                        </span>
                    </h2>

                    <p className="text-base text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
                        <TranslatedText
                            text="Từ trắc nghiệm đến câu hỏi vị trí, tạo nên trải nghiệm học tập tương tác phong phú với PreziQ"
                            translationKey="quiz.mainDescription"
                        />
                    </p>
                </motion.div>

                {/* Quiz Demos with Alternating Layout */}
                <div className="space-y-16 md:space-y-20">
                    {quizDemos.map((demo, index) => {
                        const isReversed = index % 2 === 1;
                        return (
                            <motion.div
                                key={demo.id}
                                className="relative"
                                initial={{ opacity: 0, y: 60 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.8, delay: index * 0.1 }}
                                viewport={{ once: true, margin: "-100px" }}
                            >
                                <div className={cn(
                                    "grid lg:grid-cols-2 gap-4 lg:gap-6 items-center max-w-5xl mx-auto",
                                    "grid-cols-1 justify-items-center lg:justify-items-stretch",
                                    isReversed && "lg:grid-flow-col-dense"
                                )}>
                                    {/* Text Content */}
                                    <div className={cn(
                                        "space-y-4 text-center lg:text-left",
                                        isReversed && "lg:col-start-2"
                                    )}>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 justify-center lg:justify-start">
                                                <div className={cn(
                                                    'w-6 h-6 rounded-lg flex items-center justify-center shadow-md text-white',
                                                    demo.bgColor
                                                )}>
                                                    {React.cloneElement(demo.icon as React.ReactElement, { className: 'h-3.5 w-3.5' })}
                                                </div>
                                                <Badge variant="secondary" className="px-1.5 py-0.5 text-xs font-medium">
                                                    {demo.type.replace('QUIZ_', '').replace('_', ' ')}
                                                </Badge>
                                            </div>

                                            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
                                                <TranslatedText
                                                    text={demo.title}
                                                    translationKey={`quiz.title.${demo.id}`}
                                                />
                                            </h3>

                                            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                                                <TranslatedText
                                                    text={demo.description}
                                                    translationKey={`quiz.description.${demo.id}`}
                                                />
                                            </p>
                                        </div>

                                        {/* Features List */}
                                        <div className="space-y-1.5">
                                            {demo.type === 'QUIZ_BUTTONS' && (
                                                <>
                                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                        <span>
                                                            <TranslatedText text="Chọn một đáp án đúng duy nhất" translationKey="quiz.features.singleChoice" />
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                        <span>
                                                            <TranslatedText text="Giao diện trực quan, dễ sử dụng" translationKey="quiz.features.intuitive" />
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                        <span>
                                                            <TranslatedText text="Phù hợp cho kiểm tra kiến thức cơ bản" translationKey="quiz.features.basicKnowledge" />
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                            {demo.type === 'QUIZ_CHECKBOXES' && (
                                                <>
                                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                        <span>
                                                            <TranslatedText text="Chọn nhiều đáp án đúng" translationKey="quiz.features.multipleChoice" />
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                        <span>
                                                            <TranslatedText text="Đánh giá hiểu biết toàn diện" translationKey="quiz.features.comprehensive" />
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                        <span>
                                                            <TranslatedText text="Linh hoạt trong chấm điểm" translationKey="quiz.features.flexibleScoring" />
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                            {demo.type === 'QUIZ_LOCATION' && (
                                                <>
                                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                        <span>
                                                            <TranslatedText text="Tương tác với bản đồ thực tế" translationKey="quiz.features.interactiveMap" />
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                        <span>
                                                            <TranslatedText text="Học địa lý một cách sinh động" translationKey="quiz.features.geographyLearning" />
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 text-xs">
                                                        <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                                                        <span>
                                                            <TranslatedText text="Hỗ trợ nhiều điểm đánh dấu" translationKey="quiz.features.multipleMarkers" />
                                                        </span>
                                                    </div>
                                                </>
                                            )}
                                            {/* Add more feature lists for other types as needed */}
                                        </div>

                                        <Button
                                            size="sm"
                                            className={cn(
                                                "mt-3 px-4 py-1.5 text-white shadow-md hover:shadow-lg transition-all duration-300 text-xs",
                                                demo.bgColor,
                                                "hover:scale-105"
                                            )}
                                        >
                                            <TranslatedText
                                                text={`Thử ngay ${demo.title}`}
                                                translationKey={`quiz.tryNow.${demo.id}`}
                                            />
                                        </Button>
                                    </div>

                                    {/* Demo Preview */}
                                    <div className={cn(
                                        "relative",
                                        isReversed && "lg:col-start-1"
                                    )}>
                                        <motion.div
                                            className="relative"
                                            whileHover={{ scale: 1.01 }}
                                            transition={{ duration: 0.3 }}
                                        >
                                            <QuizDemoCard
                                                demo={demo}
                                                viewMode={viewMode}
                                                isActive={false}
                                                onClick={() => { }}
                                            />
                                        </motion.div>
                                    </div>
                                </div>


                            </motion.div>
                        );
                    })}
                </div>

                {/* Call to Action */}
                {/* <motion.div
                    className="text-center mt-12 pt-8 border-t border-gray-200 dark:border-gray-700"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    viewport={{ once: true }}
                >
                    <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-8 text-white relative overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.1),transparent_50%)]"></div>
                        <div className="relative z-10">
                            <h3 className="text-xl md:text-2xl font-bold mb-3">
                                <TranslatedText
                                    text="Sẵn sàng tạo Quiz của bạn?"
                                    translationKey="quiz.readyToCreate"
                                />
                            </h3>
                            <p className="text-base text-blue-100 mb-6 max-w-xl mx-auto">
                                <TranslatedText
                                    text="Bắt đầu tạo những bài quiz tương tác hấp dẫn với PreziQ ngay hôm nay"
                                    translationKey="quiz.ctaDescription"
                                />
                            </p>
                            <Button
                                size="default"
                                className="bg-white text-blue-600 hover:bg-gray-50 px-6 py-2 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            >
                                <TranslatedText text="Bắt đầu tạo Quiz" translationKey="quiz.startCreating" />
                            </Button>
                        </div>
                    </div>
                </motion.div> */}
            </div>
        </section>
    );
}

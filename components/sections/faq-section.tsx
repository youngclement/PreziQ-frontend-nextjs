"use client";

import { useState, useEffect } from "react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import { Bot, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/language-context";
import TranslatedText from "@/components/ui/translated-text";

type FaqItem = {
    questionKey: string;
    answerKey: string;
};

const faqs: FaqItem[] = [
    {
        questionKey: "faq1Question",
        answerKey: "faq1Answer",
    },
    {
        questionKey: "faq2Question",
        answerKey: "faq2Answer",
    },
    {
        questionKey: "faq3Question",
        answerKey: "faq3Answer",
    },
    {
        questionKey: "faq4Question",
        answerKey: "faq4Answer",
    },
    {
        questionKey: "faq5Question",
        answerKey: "faq5Answer",
    },
];

export default function Faq02() {
    const [activeTab, setActiveTab] = useState<string>("general");
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const { t } = useLanguage();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setMounted(true);
        setIsClient(true);
    }, []);

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

    if (!mounted) {
        return <section className="py-16" />;
    }

    return (
        <section
            className={cn(
                "py-24 relative overflow-hidden",
                isDark ? "bg-black" : "bg-white"
            )}
            id="faq"
        >
            {/* Background pattern elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                    className={cn(
                        "absolute -top-1/3 right-0 w-2/3 h-full opacity-10 transform rotate-12",
                        "bg-gradient-radial from-transparent to-accent/20"
                    )}
                />
                <div
                    className={cn(
                        "absolute left-0 bottom-0 w-full h-40 opacity-20",
                        "bg-gradient-to-t from-accent/20 to-transparent"
                    )}
                />
            </div>

            <div className="container px-4 md:px-6 relative z-10">
                <div className="flex flex-col items-center text-center mb-10 max-w-3xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-4xl font-bold tracking-tight mb-3"
                    >
                        <TranslatedText text="Frequently Asked Questions" translationKey="faqTitle" />
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="text-muted-foreground text-lg"
                    >
                        <TranslatedText
                            text="Find answers to common questions about our platform"
                            translationKey="faqDesc"
                        />
                    </motion.p>
                </div>

                <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto">
                    <div className="w-full md:w-2/3">
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4, delay: 0.1 * index }}
                                >
                                    <AccordionItem
                                        value={`item-${index}`}
                                        className={cn(
                                            "border-b border-b-border/40 transition-colors hover:border-b-primary/20",
                                            isDark ? "bg-black" : "bg-white"
                                        )}
                                    >
                                        <AccordionTrigger className="py-5 text-left hover:no-underline focus:no-underline font-medium">
                                            <span suppressHydrationWarning>
                                                {isClient ? t(faq.questionKey) : ''}
                                            </span>
                                        </AccordionTrigger>
                                        <AccordionContent className="text-muted-foreground pb-5 leading-relaxed">
                                            <span suppressHydrationWarning>
                                                {isClient ? t(faq.answerKey) : ''}
                                            </span>
                                        </AccordionContent>
                                    </AccordionItem>
                                </motion.div>
                            ))}
                        </Accordion>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                        >
                            <div className="mt-8 text-center">
                                <Button variant="outline" size="lg" className="rounded-full">
                                    <TranslatedText text="View all FAQs" translationKey="viewAllFaqs" />
                                </Button>
                            </div>
                        </motion.div>
                    </div>

                    <div className="w-full md:w-1/3">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.3 }}
                            className={cn(
                                "rounded-lg p-6 h-full",
                                isDark
                                    ? "bg-accent/10 border border-border/40"
                                    : "bg-accent/5 border border-border/40"
                            )}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="font-medium text-lg">
                                    <TranslatedText text="Still have questions?" translationKey="stillHaveQuestions" />
                                </h3>
                            </div>
                            <p className="text-muted-foreground mb-6">
                                <TranslatedText
                                    text="Can't find the answer you're looking for? Please chat with our friendly team."
                                    translationKey="cantFindAnswer"
                                />
                            </p>
                            <Button className="w-full gap-2 rounded-full">
                                <Bot className="w-4 h-4" />
                                <TranslatedText text="Chat with Support" translationKey="chatWithSupport" />
                            </Button>
                        </motion.div>
                    </div>
                </div>
            </div>
        </section>
    );
}
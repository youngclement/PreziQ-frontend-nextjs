"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Mail, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FAQItemProps {
    question: string;
    answer: string;
    index: number;
}

function FAQItem({ question, answer, index }: FAQItemProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
                duration: 0.3,
                delay: index * 0.15,
                ease: "easeOut",
            }}
            className={cn(
                "group rounded-xl border border-gray-200/80 dark:border-white/10",
                "transition-all duration-200 ease-in-out",
                isOpen
                    ? "bg-white dark:bg-black shadow-md dark:shadow-[0_4px_20px_rgba(255,255,255,0.05)]"
                    : "hover:bg-white/80 dark:hover:bg-white/[0.03]"
            )}
        >
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-6 py-5 flex items-center justify-between gap-4"
            >
                <h3
                    className={cn(
                        "text-base font-medium transition-colors duration-200 text-left",
                        "text-gray-700 dark:text-gray-300",
                        isOpen && "text-highlight dark:text-highlight font-semibold"
                    )}
                >
                    {question}
                </h3>
                <motion.div
                    animate={{
                        rotate: isOpen ? 180 : 0,
                        scale: isOpen ? 1.1 : 1,
                    }}
                    transition={{
                        duration: 0.3,
                        ease: "easeInOut",
                    }}
                    className={cn(
                        "p-1 rounded-full shrink-0",
                        "transition-colors duration-200",
                        isOpen
                            ? "bg-highlight/20 text-highlight"
                            : "text-gray-400 dark:text-gray-500"
                    )}
                >
                    <ChevronDown className="h-4 w-4" />
                </motion.div>
            </button>
            <AnimatePresence initial={false}>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                            height: "auto",
                            opacity: 1,
                            transition: {
                                height: {
                                    duration: 0.4,
                                    ease: [0.04, 0.62, 0.23, 0.98],
                                },
                                opacity: {
                                    duration: 0.25,
                                    delay: 0.1,
                                },
                            },
                        }}
                        exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                                height: {
                                    duration: 0.3,
                                    ease: "easeInOut",
                                },
                                opacity: {
                                    duration: 0.25,
                                },
                            },
                        }}
                    >
                        <div className="px-6 pb-5 pt-0">
                            <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200 dark:via-white/10 to-transparent mb-4"></div>
                            <motion.p
                                initial={{ y: -8, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: -8, opacity: 0 }}
                                transition={{
                                    duration: 0.3,
                                    ease: "easeOut",
                                }}
                                className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed"
                            >
                                {answer}
                            </motion.p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function Faq02() {
    const faqs: Omit<FAQItemProps, "index">[] = [
        {
            question: "What is PreziQ and how can it help me?",
            answer: "PreziQ is a modern presentation platform that combines AI-powered tools with intuitive design features. Our platform helps you create professional presentations, deliver them with confidence, and analyze audience engagement to optimize your content.",
        },
        {
            question: "How does PreziQ differ from other presentation tools?",
            answer: "Unlike traditional presentation software, PreziQ focuses on creating dynamic, engaging content with modern design elements like our Bento Grid layout. We also integrate AI capabilities to help you generate content, optimize your slides, and provide real-time analytics on audience engagement.",
        },
        {
            question: "Is PreziQ suitable for both beginners and experienced presenters?",
            answer: "Absolutely! PreziQ is designed with an intuitive interface that's accessible to beginners while offering advanced features for experienced presenters. Whether you're creating your first presentation or you're a seasoned professional, our platform scales to meet your needs.",
        },
        {
            question: "Can I collaborate with my team on PreziQ presentations?",
            answer: "Yes, collaboration is a core feature of PreziQ. Multiple team members can work on the same presentation simultaneously, leave comments, suggest edits, and track changes. This makes it perfect for team projects and organizational presentations.",
        },
        {
            question: "Are there templates available to get started quickly?",
            answer: "We offer an extensive library of modern, professionally designed templates for various presentation types including business pitches, educational content, marketing proposals, and more. All templates are fully customizable to match your brand and specific needs.",
        },
    ];

    return (
        <section className="py-16 w-full bg-gradient-to-b from-white to-gray-50 dark:from-black dark:to-black dark:bg-black">

            <div className="container px-4 mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="max-w-2xl mx-auto text-center mb-12"
                >
                    <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                        Frequently Asked <span className="text-highlight">Questions</span>
                    </h2>
                    <p className="text-base text-gray-600 dark:text-gray-400">
                        Everything you need to know about <span className="text-highlight font-medium">PreziQ</span>
                    </p>
                </motion.div>

                <div className="max-w-2xl mx-auto space-y-3">
                    {faqs.map((faq, index) => (
                        <FAQItem key={index} {...faq} index={index} />
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className={cn(
                        "max-w-md mx-auto mt-12 p-8 rounded-xl border border-highlight/30 dark:border-highlight/20",
                        "bg-white dark:bg-black text-center shadow-md dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]"
                    )}
                >
                    <div className="inline-flex items-center justify-center p-2.5 rounded-full bg-gray-100 dark:bg-white/10 mb-4">
                        <HelpCircle className="h-5 w-5 text-gray-700 dark:text-gray-300" />
                    </div>
                    <p className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                        Need more <span className="text-highlight">information</span>?
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                        Our team is ready to answer any questions about PreziQ
                    </p>
                    <button
                        type="button"
                        className={cn(
                            "px-5 py-2.5 text-sm rounded-lg",
                            "bg-highlight hover:bg-highlight/90 text-white",
                            "transition-all duration-200",
                            "font-medium shadow-sm"
                        )}
                    >
                        Contact Our Team
                    </button>
                </motion.div>
            </div>
        </section>
    );
}

export default Faq02;
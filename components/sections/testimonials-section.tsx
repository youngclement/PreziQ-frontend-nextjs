"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious
} from "@/components/ui/carousel";
import { useTheme } from "next-themes";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Quote, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const testimonials = [
    {
        name: "Alex Johnson",
        role: "Marketing Director",
        image: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        content: "PreziQ transformed our pitch decks. The AI-powered insights helped us create more engaging presentations with less effort.",
        rating: 5,
        company: "TechVision Inc."
    },
    {
        name: "Sarah Chen",
        role: "Product Manager",
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        content: "The real-time feedback feature is a game-changer. I now feel confident presenting to executives and clients.",
        rating: 5,
        company: "Innovate Labs"
    },
    {
        name: "Michael Rodriguez",
        role: "Sales Lead",
        image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        content: "Our team's presentation quality improved dramatically since using PreziQ. The design suggestions are particularly helpful.",
        rating: 4,
        company: "Global Solutions"
    },
    {
        name: "Emily Wong",
        role: "University Professor",
        image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
        content: "PreziQ helps me create engaging lecture materials in half the time. My students are more engaged than ever.",
        rating: 5,
        company: "State University"
    }
];

// Animation variants
const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.4, 0.25, 1] } }
};

const quoteVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, delay: 0.2 } }
};

const starVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: (i: any) => ({
        opacity: 1,
        scale: 1,
        transition: {
            duration: 0.3,
            delay: 0.3 + i * 0.1
        }
    })
};

const backgroundWaveVariants = {
    animate: {
        y: [0, -20, 0],
        transition: {
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

export function TestimonialsSection() {
    const { theme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = mounted && (resolvedTheme === "dark" || theme === "dark");

    if (!mounted) {
        return <section className="py-16" />;
    }

    return (
        <section className={cn(
            "py-24 relative overflow-hidden",
            isDark ? "bg-black" : "bg-white/50"
        )}>
            {/* Background pattern elements */}
            <div className="absolute inset-0 pointer-events-none">
                <motion.div
                    className={cn(
                        "absolute top-1/4 -left-20 w-64 h-64 rounded-full blur-3xl opacity-20",
                        isDark ? "bg-blue-600" : "bg-blue-300"
                    )}
                    variants={backgroundWaveVariants}
                    animate="animate"
                />
                <motion.div
                    className={cn(
                        "absolute bottom-1/4 -right-20 w-80 h-80 rounded-full blur-3xl opacity-20",
                        isDark ? "bg-purple-600" : "bg-purple-300"
                    )}
                    variants={backgroundWaveVariants}
                    animate="animate"
                    style={{ animationDelay: "2s" }}
                />
            </div>

            <div className="container px-4 md:px-6 relative z-10">
                <div className="text-center mb-14" data-aos="fade-up">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        {/* <Badge
                            variant="outline"
                            className={cn(
                                "mb-4 px-4 py-1.5 text-sm font-medium rounded-full border-highlight",
                                isDark ? "bg-white/5" : "bg-black/5"
                            )}
                        >
                            <Star className="w-4 h-4 mr-2 text-highlight random-highlight" />
                            <span className="text-highlight">Success Stories</span>
                        </Badge> */}
                    </motion.div>

                    <motion.h2
                        className="text-4xl md:text-5xl font-bold tracking-tight mb-3"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.2 }}
                    >
                        Trusted by <span className="text-highlight">presentation professionals</span>
                    </motion.h2>

                    <motion.p
                        className="text-muted-foreground text-lg max-w-2xl mx-auto"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                    >
                        See how PreziQ is revolutionizing the way people create and deliver impactful presentations
                    </motion.p>
                </div>

                <Carousel
                    opts={{
                        align: "start",
                        loop: true,
                    }}
                    className="w-full max-w-6xl mx-auto"
                >
                    <CarouselContent className="-ml-2 md:-ml-4">
                        {testimonials.map((testimonial, index) => (
                            <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3 py-6">
                                <motion.div
                                    variants={cardVariants}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: true }}
                                    className="h-full"
                                >
                                    <Card className={cn(
                                        "h-full group hover:border-highlight transition-all duration-300 overflow-hidden",
                                        "hover:shadow-lg hover:-translate-y-1",
                                        isDark ? "bg-white/5 backdrop-blur-sm" : "bg-white backdrop-blur-sm"
                                    )}>
                                        <CardContent className="p-6 flex flex-col h-full relative">
                                            {/* Quote icon */}
                                            <motion.div
                                                variants={quoteVariants}
                                                initial="hidden"
                                                whileInView="visible"
                                                viewport={{ once: true }}
                                                className="absolute -top-1 -right-1 opacity-10 transform rotate-12"
                                            >
                                                <Quote className="w-16 h-16 text-highlight" strokeWidth={1} />
                                            </motion.div>

                                            {/* Company badge */}
                                            <div className="mb-3">
                                                <span className={cn(
                                                    "inline-block text-xs font-medium py-1 px-2.5 rounded-full",
                                                    isDark ? "bg-white/10" : "bg-black/5"
                                                )}>
                                                    {testimonial.company}
                                                </span>
                                            </div>

                                            {/* Rating stars */}
                                            <div className="flex mb-4">
                                                {[...Array(5)].map((_, i) => (
                                                    <motion.div
                                                        key={i}
                                                        custom={i}
                                                        variants={starVariants}
                                                        initial="hidden"
                                                        whileInView="visible"
                                                        viewport={{ once: true }}
                                                    >
                                                        <Star
                                                            className={cn(
                                                                "w-4 h-4 mr-0.5",
                                                                i < testimonial.rating
                                                                    ? "text-yellow-500 fill-yellow-500"
                                                                    : "text-gray-300"
                                                            )}
                                                        />
                                                    </motion.div>
                                                ))}
                                            </div>

                                            <blockquote className="text-foreground flex-1 mb-6 text-base italic leading-relaxed">
                                                "{testimonial.content}"
                                            </blockquote>

                                            <div className="flex items-center">
                                                <Avatar className="h-12 w-12 mr-4 border-2 border-highlight">
                                                    <AvatarImage src={testimonial.image} alt={testimonial.name} />
                                                    <AvatarFallback className="bg-highlight-hover text-white">
                                                        {testimonial.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="font-bold text-base">{testimonial.name}</p>
                                                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <div className="flex justify-center mt-8 gap-2">
                        <CarouselPrevious className={cn(
                            "relative inset-0 translate-y-0 rounded-full border-highlight",
                            "hover:bg-highlight-hover transition-all duration-300"
                        )} />
                        <CarouselNext className={cn(
                            "relative inset-0 translate-y-0 rounded-full border-highlight",
                            "hover:bg-highlight-hover transition-all duration-300"
                        )} />
                    </div>
                </Carousel>

                {/* Trust indicators */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    viewport={{ once: true }}
                >
                    <p className="text-sm text-muted-foreground mb-6">TRUSTED BY TEAMS AT</p>
                    <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-8">
                        {["Google", "Microsoft", "Amazon", "IBM", "Adobe"].map((company, idx) => (
                            <div
                                key={idx}
                                className={cn(
                                    "text-xl md:text-2xl font-semibold tracking-tighter opacity-60 hover:opacity-100 transition-opacity",
                                    idx % 2 === 0 ? "text-highlight" : "text-foreground"
                                )}
                            >
                                {company}
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
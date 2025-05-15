"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Logo from "./common/logo";
import { useLanguage } from "@/contexts/language-context";
import TranslatedText from "./ui/translated-text";
// import Logo from "@/components/logo";

const Footer = () => {
    const { t } = useLanguage();
    const currentYear = new Date().getFullYear();

    const navItems = [
        { key: "home", label: "Home" },
        { key: "about", label: "About" },
        { key: "services", label: "Services" },
        { key: "projects", label: "Projects" },
        { key: "blog", label: "Blog" },
        { key: "contact", label: "Contact" }
    ];

    const socialItems = [
        { key: "linkedin", label: "LinkedIn", url: "https://www.linkedin.com" },
        { key: "twitter", label: "Twitter", url: "https://www.twitter.com" },
        { key: "instagram", label: "Instagram", url: "https://www.instagram.com" },
        { key: "github", label: "GitHub", url: "https://www.github.com" }
    ];

    return (
        <footer className=" py-16">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
                    <div className="space-y-6">
                        <motion.h2
                            className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <Logo />
                        </motion.h2>
                        <p className="">
                            <TranslatedText
                                text="Shaping the future of web development"
                                translationKey="footerDesc"
                            />
                        </p>
                        <div className="relative">
                            <input
                                type="email"
                                placeholder={t("emailPlaceholder")}
                                className="w-full border-2 rounded-full py-2 px-4 outline-none transition-all duration-300"
                            />
                            <button className="absolute right-1 top-2 rounded-full p-1 transition-colors duration-300">
                                <ArrowUpRight className="size-4 " />
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-4">
                            <TranslatedText
                                text="Navigation"
                                translationKey="footerNavigation"
                            />
                        </h3>
                        <ul className="space-y-2">
                            {navItems.map((item) => (
                                <motion.li
                                    key={item.key}
                                    whileHover={{ x: 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <a
                                        href={`#${item.key.toLowerCase()}`}
                                        className="text-black dark:text-white transition-colors duration-300"
                                    >
                                        <TranslatedText
                                            text={item.label}
                                            translationKey={`footer${item.label}`}
                                        />
                                    </a>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h3 className="text-xl font-semibold mb-4">
                            <TranslatedText
                                text="Connect"
                                translationKey="footerConnect"
                            />
                        </h3>
                        <ul className="space-y-2">
                            {socialItems.map((item) => (
                                <motion.li
                                    key={item.key}
                                    whileHover={{ x: 5 }}
                                    transition={{ type: "spring", stiffness: 300 }}
                                >
                                    <a
                                        href={item.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className=" dark:text-white text-black transition-colors duration-300 flex items-center"
                                    >
                                        <TranslatedText
                                            text={item.label}
                                            translationKey={`footer${item.key}`}
                                        />
                                        <ArrowUpRight className="w-4 h-4 ml-1" />
                                    </a>
                                </motion.li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-semibold">
                            <TranslatedText
                                text="Our Vision"
                                translationKey="footerVision"
                            />
                        </h3>
                        <p className="">
                            <TranslatedText
                                text="Pioneering the next generation of web experiences through innovative code and cutting-edge design."
                                translationKey="footerVisionDesc"
                            />
                        </p>
                        <div className="flex space-x-4">
                            <motion.div
                                className="w-2 h-2 bg-blue-500 rounded-full"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                            />
                            <motion.div
                                className="w-2 h-2 bg-purple-500 rounded-full"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                            />
                            <motion.div
                                className="w-2 h-2 bg-pink-500 rounded-full"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ repeat: Infinity, duration: 2, delay: 1 }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center">
                    <p className=" text-sm">
                        &copy; {currentYear}.
                        <TranslatedText
                            text="All rights reserved."
                            translationKey="copyright"
                        />
                    </p>
                    <div className="flex space-x-4 mt-4 md:mt-0">
                        <a
                            href="#"
                            className=" hover:text-white transition-colors duration-300 text-sm"
                        >
                            <TranslatedText
                                text="Privacy Policy"
                                translationKey="privacy"
                            />
                        </a>
                        <a
                            href="#"
                            className=" hover:text-white transition-colors duration-300 text-sm"
                        >
                            <TranslatedText
                                text="Terms of Service"
                                translationKey="terms"
                            />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

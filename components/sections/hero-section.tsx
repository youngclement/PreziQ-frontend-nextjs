"use client";

import HeroGeometric from "@/components/clement-kit-ui/hero-geometric";
import { useLanguage } from "@/contexts/language-context";
import { Dancing_Script } from 'next/font/google';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { TypingAnimation } from "@/components/magicui/typing-animation";

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['700'],
});

export function HeroSection() {
  const { t } = useLanguage();
  const { theme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Wait until mounted to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Use mounted check to avoid hydration issues
  const isDark = mounted && (resolvedTheme === 'dark' || theme === 'dark');

  // Create styled version of title2 with cursive font
  const title2 = t("presentationTitle");

  return (
    <section>
      <HeroGeometric
        badge="PreziQ"
        title1={t("heroTitle")}
        title2={
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: 1.5,
              duration: 0.5,
              ease: [0.25, 0.4, 0.25, 1]
            }}
            className="relative w-full min-h-[80px] sm:min-h-[100px] md:min-h-[120px] flex items-center justify-center mt-0"
          >
            <TypingAnimation
              className={cn(
                dancingScript.className,
                "relative inline-block text-5xl sm:text-7xl md:text-8xl bg-clip-text text-transparent w-full",
                "tracking-wide leading-[1.1] mx-auto px-4 py-0 mb-0 pb-8",
                "whitespace-normal max-w-full overflow-visible",
                isDark
                  ? "bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300"
                  : "bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500",
                "drop-shadow-[0_1px_1px_rgba(0,0,0,0.1)]"
              )}
              delay={1700}
              duration={70}
            >
              {title2}
            </TypingAnimation>
          </motion.div>
        }
        description={t("heroSubtitle")}
      />
    </section>
  );
}
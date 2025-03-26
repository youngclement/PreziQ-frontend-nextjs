"use client";
import Image from "next/image";
import React from "react";
import { useTheme } from "next-themes";
import { WobbleCard } from "../ui/wobble-card";
import Img1 from "./img/img-features-section-1.jpeg"

export function WobbleCardSection() {
    const { theme, systemTheme } = useTheme();
    const currentTheme = theme === "system" ? systemTheme : theme;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
            <WobbleCard
                containerClassName={`col-span-1 lg:col-span-2 h-full ${currentTheme === "dark" ? "bg-indigo-800" : "bg-indigo-200"} min-h-[500px] lg:min-h-[300px]`}
                className=""
                variant="auto"
            >
                <div className="max-w-xs">
                    <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] dark:text-white text-black">
                        Engage Your Audience with Interactive Slides
                    </h2>
                    <p className="mt-4 text-left text-base/6 dark:text-neutral-200 text-neutral-700">
                        Create dynamic presentations that captivate your audience with interactive elements, polls, and real-time feedback.
                    </p>
                </div>
                <Image
                    src={Img1}
                    width={500}
                    height={500}
                    alt="Interactive presentation demo"
                    className="absolute -right-4 lg:-right-[40%] -bottom-10 object-contain rounded-2xl"
                />
            </WobbleCard>
            <WobbleCard
                containerClassName="col-span-1 min-h-[300px]"
                variant="auto"
            >
                <h2 className="max-w-80 text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] dark:text-white text-black">
                    Game-Based Learning Made Simple
                </h2>
                <p className="mt-4 max-w-[26rem] text-left text-base/6 dark:text-neutral-200 text-neutral-700">
                    Turn any presentation into an engaging quiz game similar to Kahoot, with leaderboards and team competitions.
                </p>
            </WobbleCard>
            <WobbleCard
                containerClassName={`col-span-1 lg:col-span-3 ${currentTheme === "dark" ? "bg-purple-900" : "bg-purple-200"} min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]`}
                variant="auto"
            >
                <div className="max-w-sm">
                    <h2 className="max-w-sm md:max-w-lg text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] dark:text-white text-black">
                        Elevate Your Presentations with PreziQ's Game-Based Learning Tools
                    </h2>
                    <p className="mt-4 max-w-[26rem] text-left text-base/6 dark:text-neutral-200 text-neutral-700">
                        Join thousands of educators and presenters who have transformed their content using our interactive presentation and game-based learning platform.
                    </p>
                </div>
                <Image
                    src={Img1}
                    width={500}
                    height={500}
                    alt="Game-based learning example"
                    className="absolute -right-10 md:-right-[40%] lg:-right-[20%] -bottom-10 object-contain rounded-2xl"
                />
            </WobbleCard>
        </div>
    );
}
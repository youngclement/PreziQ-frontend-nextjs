"use client";
import React from "react";

import Image from "next/image";
import { ContainerScroll } from "../clement-kit-ui/container-scroll-animation";
import { useLanguage } from "@/contexts/language-context";
import TranslatedText from "@/components/ui/translated-text";

export function DemoUISection() {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col overflow-hidden">
            <ContainerScroll
                titleComponent={
                    <>
                        <h1 className="text-4xl font-semibold text-black dark:text-white">
                            <TranslatedText
                                text="Transform your presentations with "
                                translationKey="demoTitle"
                            />
                            <br />
                            <span className="text-4xl text-highlight md:text-[6rem] font-bold mt-1 leading-none">
                                PreziQ
                            </span>
                        </h1>
                    </>
                }
            >
                <Image
                    src={`/presentation-demo.webp`}
                    alt={t("demoImageAlt")}
                    height={720}
                    width={1400}
                    className="mx-auto rounded-2xl object-cover h-full object-center"
                    draggable={false}
                />
            </ContainerScroll>
        </div>
    );
}
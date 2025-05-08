"use client";

import HeroGeometric from "@/components/clement-kit-ui/hero-geometric";
import { useLanguage } from "@/contexts/language-context";

export function HeroSection() {
  const { t } = useLanguage();

  // Add translations for all text in the hero section
  const title2 = t("presentationTitle");

  return (
    <section>
      <HeroGeometric
        badge="PreziQ"
        title1={t("heroTitle")}
        title2={title2}
        description={t("heroSubtitle")}
      />
    </section>
  );
}
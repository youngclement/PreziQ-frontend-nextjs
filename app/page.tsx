"use client";

import { HeroSection } from "@/components/sections/hero-section";
import BentoGrid from "@/components/kokonutui/bento-grid";
import Footer from "@/components/footer";
import { WobbleCardSection } from "@/components/sections/features-section";
import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import Faq02 from "@/components/sections/faq-section";
import SplashCursor from "@/components/clement-kit-ui/splash-cursor";
import Newsletter from "@/components/sections/newsletter-section";
import { TestimonialsSection } from "@/components/sections/testimonials-section";
import TextMarqueeSection from "@/components/sections/text-marquee-section";
import { DemoUISection } from "@/components/sections/demo-ui-section";
import { QuizDemoSection } from "@/components/sections/quiz-demo-section";
import HomeLayout from './home-layout';

export default function HomePage() {
  useEffect(() => {
    // Initialize AOS
    AOS.init({
      duration: 800,
      once: true,
      mirror: false,
      easing: 'ease-out-cubic',
      offset: 50,
      disableMutationObserver: false,
    });


  }, []);

  return (
    <HomeLayout>
      <main className="min-h-screen">
        {/* to hon */}
        {/* <SplashCursor
          SIM_RESOLUTION={128}
          DYE_RESOLUTION={768}
          DENSITY_DISSIPATION={6}
          VELOCITY_DISSIPATION={3.5}
          PRESSURE={0.4}
          PRESSURE_ITERATIONS={20}
          CURL={15}
          SPLAT_RADIUS={0.15}
          SPLAT_FORCE={4000}
          SHADING={true}
          COLOR_UPDATE_SPEED={8}
          BACK_COLOR={{ r: 0, g: 0, b: 0 }}
          TRANSPARENT={true}
        /> */}
        <SplashCursor
          SIM_RESOLUTION={128}
          DYE_RESOLUTION={512}
          DENSITY_DISSIPATION={9}
          VELOCITY_DISSIPATION={5}
          PRESSURE={0.25}
          PRESSURE_ITERATIONS={15}
          CURL={8}
          SPLAT_RADIUS={0.1}
          SPLAT_FORCE={2500}
          SHADING={true}
          COLOR_UPDATE_SPEED={6}
          BACK_COLOR={{ r: 0, g: 0, b: 0 }}
          TRANSPARENT={true}
        />
        <HeroSection />
        <WobbleCardSection />
        {/* <BentoGrid /> */}
        <QuizDemoSection />
        <TestimonialsSection />
        <TextMarqueeSection />
        {/* <Newsletter /> */}
        {/* <DemoUISection /> */}
        <Faq02 />
        <Footer />
      </main>
    </HomeLayout>
  );
}
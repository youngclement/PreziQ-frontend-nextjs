"use client";

import { HeroSection } from "@/components/sections/hero-section";
import { FeaturesSection } from "@/components/sections/features-section";
import ActionSearchBar from "@/components/clement-kit-ui/action-search-bar";



export default function HomePage() {


  return (
    <main>
      {/* Hero Section */}
      <HeroSection />

      {/* Features Bento Grid */}
      <FeaturesSection />


      {/* You can add the ActionSearchBar component where needed */}
      {/* <ActionSearchBar actions={customActions} /> */}
    </main>
  );
}
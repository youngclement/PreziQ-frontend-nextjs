/**
 * Extending Window interface to include our custom properties
 */
declare global {
  interface Window {
    updateQuestionTimer: ReturnType<typeof setTimeout>;
    updateCorrectAnswerTimer: ReturnType<typeof setTimeout>;
    scrollSyncTimer: NodeJS.Timeout | undefined;
    lastQuestionClick?: number;
    lastActivityClick?: number;
    updateActivityBackground?: (activityId: string, properties: { backgroundImage?: string, backgroundColor?: string }) => void;
  }
}

"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Dynamically import the QuestionsPageContent component with SSR disabled
const QuestionsPageContent = dynamic(
  () => import('./components/questions-page-content'),
  { ssr: false, loading: () => <div className="w-full h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={32} /></div> }
);

export default function QuestionsPage() {
  return (
    <Suspense fallback={<div className="w-full h-screen flex items-center justify-center"><Loader2 className="animate-spin" size={32} /></div>}>
      <QuestionsPageContent />
    </Suspense>
  );
}
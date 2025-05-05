'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2 } from 'lucide-react';
import { SessionWebSocket } from '@/websocket/sessionWebSocket';
import SlideShow from '@/app/collection/components/slide/slide-show';
import { QuestionPreview } from '@/app/collection/components/question-editor/question-preview';

interface Activity {
  activityId: string;
  activityType: 'slide' | 'quiz';
  backgroundColor: string;
  backgroundImage: string | null;
  slide?: {
    slideId: string;
    transitionEffect: string | null;
    transitionDuration: number;
    autoAdvanceSeconds: number;
    slideElements: any[];
  };
  quiz?: {
    questionId: string;
    questionType:
      | 'multiple_choice'
      | 'multiple_response'
      | 'true_false'
      | 'text_answer'
      | 'reorder';
    questionText: string;
    options: any[];
    timeLimit: number;
  };
}

export default function SessionShowPage() {
  const searchParams = useSearchParams();
  const sessionCode = searchParams.get('code');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [activities, setActivities] = useState<Activity[]>([]);
  const sessionWsRef = useRef<SessionWebSocket | null>(null);

  useEffect(() => {
    if (!sessionCode) {
      setError('Session code is required');
      setIsLoading(false);
      return;
    }

    const sessionWs = new SessionWebSocket(sessionCode);
    sessionWsRef.current = sessionWs;

    sessionWs.onSessionStartHandler((session) => {
      console.log('Session started:', session);
      // TODO: Load activities from session data
    });

    sessionWs.onNextActivityHandler((activity) => {
      console.log('Next activity:', activity);
      // TODO: Update current activity
    });

    sessionWs.onSessionEndHandler((session) => {
      console.log('Session ended:', session);
      // TODO: Handle session end
    });

    sessionWs
      .connect()
      .then(() => {
        setIsConnected(true);
        setIsLoading(false);
      })
      .catch((err) => {
        setError('Failed to connect to WebSocket');
        console.error('WebSocket connection error:', err);
        setIsLoading(false);
      });

    return () => {
      if (sessionWsRef.current) {
        sessionWsRef.current.disconnect();
      }
    };
  }, [sessionCode]);

  if (isLoading) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-2xl mx-auto text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
          <p className='text-lg'>Loading session...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <Alert variant='destructive'>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const currentActivity = activities[currentActivityIndex];

  return (
    <div className='min-h-screen bg-gray-100'>
      <div className='container mx-auto px-4 py-8'>
        <div className='max-w-6xl mx-auto'>
          {currentActivity && (
            <Card className='overflow-hidden'>
              {currentActivity.activityType === 'slide' &&
                currentActivity.slide && (
                  <SlideShow
                    collection={{
                      collectionId: 'current-session',
                      title: 'Current Session',
                      description: '',
                      coverImage: '',
                      activities: [
                        {
                          activityId: currentActivity.activityId,
                          backgroundColor: currentActivity.backgroundColor,
                          backgroundImage: currentActivity.backgroundImage,
                          slide: currentActivity.slide,
                        },
                      ],
                    }}
                  />
                )}

              {currentActivity.activityType === 'quiz' &&
                currentActivity.quiz && (
                  <QuestionPreview
                    questions={[
                      {
                        activity_id: currentActivity.activityId,
                        question_text: currentActivity.quiz.questionText,
                        question_type: currentActivity.quiz.questionType,
                        correct_answer_text: '',
                        options: currentActivity.quiz.options,
                        time_limit_seconds: currentActivity.quiz.timeLimit,
                      },
                    ]}
                    activeQuestionIndex={0}
                    timeLimit={currentActivity.quiz.timeLimit}
                    backgroundImage={currentActivity.backgroundImage || ''}
                    previewMode={true}
                    onQuestionTextChange={() => {}}
                    onOptionChange={() => {}}
                    onChangeQuestion={() => {}}
                  />
                )}
            </Card>
          )}

          <div className='mt-4 flex justify-between items-center'>
            <Button
              variant='outline'
              onClick={() =>
                setCurrentActivityIndex((prev) => Math.max(0, prev - 1))
              }
              disabled={currentActivityIndex === 0}
            >
              Previous
            </Button>
            <span className='text-sm text-gray-500'>
              Activity {currentActivityIndex + 1} of {activities.length}
            </span>
            <Button
              variant='outline'
              onClick={() =>
                setCurrentActivityIndex((prev) =>
                  Math.min(activities.length - 1, prev + 1)
                )
              }
              disabled={currentActivityIndex === activities.length - 1}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

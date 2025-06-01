import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle } from 'lucide-react';

interface MatchingPair {
  id: string;
  leftText: string;
  rightText: string;
  isCorrect?: boolean;
}

interface QuizMatchingPairViewerProps {
  question: {
    question_text: string;
    options: MatchingPair[];
  };
  onAnswer: (selectedPairs: { leftId: string; rightId: string }[]) => void;
  isAnswered?: boolean;
  showCorrectAnswer?: boolean;
}

export function QuizMatchingPairViewer({
  question,
  onAnswer,
  isAnswered = false,
  showCorrectAnswer = false,
}: QuizMatchingPairViewerProps) {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [matchedPairs, setMatchedPairs] = useState<
    { leftId: string; rightId: string }[]
  >([]);

  const handleLeftSelect = (leftId: string) => {
    if (isAnswered) return;
    setSelectedLeft(leftId);
    if (selectedRight) {
      // Check if this pair is already matched
      const isAlreadyMatched = matchedPairs.some(
        (pair) => pair.leftId === leftId || pair.rightId === selectedRight
      );

      if (!isAlreadyMatched) {
        const newPair = { leftId, rightId: selectedRight };
        setMatchedPairs([...matchedPairs, newPair]);
        setSelectedLeft(null);
        setSelectedRight(null);

        // If all pairs are matched, submit the answer
        if (matchedPairs.length + 1 === question.options.length) {
          onAnswer([...matchedPairs, newPair]);
        }
      }
    }
  };

  const handleRightSelect = (rightId: string) => {
    if (isAnswered) return;
    setSelectedRight(rightId);
    if (selectedLeft) {
      // Check if this pair is already matched
      const isAlreadyMatched = matchedPairs.some(
        (pair) => pair.leftId === selectedLeft || pair.rightId === rightId
      );

      if (!isAlreadyMatched) {
        const newPair = { leftId: selectedLeft, rightId };
        setMatchedPairs([...matchedPairs, newPair]);
        setSelectedLeft(null);
        setSelectedRight(null);

        // If all pairs are matched, submit the answer
        if (matchedPairs.length + 1 === question.options.length) {
          onAnswer([...matchedPairs, newPair]);
        }
      }
    }
  };

  const isLeftMatched = (leftId: string) =>
    matchedPairs.some((pair) => pair.leftId === leftId);
  const isRightMatched = (rightId: string) =>
    matchedPairs.some((pair) => pair.rightId === rightId);
  const getMatchedPair = (id: string, isLeft: boolean) => {
    return matchedPairs.find(
      (pair) => (isLeft ? pair.leftId : pair.rightId) === id
    );
  };

  return (
    <div className="space-y-6">
      {/* Question Text */}
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          {question.question_text}
        </h2>
      </div>

      {/* Matching Pairs Grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Column A
          </div>
          {question.options.map((pair) => (
            <div
              key={pair.id}
              onClick={() =>
                !isLeftMatched(pair.id) && handleLeftSelect(pair.id)
              }
              className={cn(
                'p-4 rounded-lg border transition-all cursor-pointer',
                selectedLeft === pair.id
                  ? 'border-primary bg-primary/5'
                  : isLeftMatched(pair.id)
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                isAnswered && 'cursor-default'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white">
                  {pair.leftText}
                </span>
                {isAnswered && isLeftMatched(pair.id) && (
                  <div className="flex-shrink-0">
                    {showCorrectAnswer && (
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center',
                          getMatchedPair(pair.id, true)?.rightId === pair.id
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        )}
                      >
                        {getMatchedPair(pair.id, true)?.rightId === pair.id ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Right Column */}
        <div className="space-y-3">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
            Column B
          </div>
          {question.options.map((pair) => (
            <div
              key={pair.id}
              onClick={() =>
                !isRightMatched(pair.id) && handleRightSelect(pair.id)
              }
              className={cn(
                'p-4 rounded-lg border transition-all cursor-pointer',
                selectedRight === pair.id
                  ? 'border-primary bg-primary/5'
                  : isRightMatched(pair.id)
                  ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
                isAnswered && 'cursor-default'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-gray-900 dark:text-white">
                  {pair.rightText}
                </span>
                {isAnswered && isRightMatched(pair.id) && (
                  <div className="flex-shrink-0">
                    {showCorrectAnswer && (
                      <div
                        className={cn(
                          'w-5 h-5 rounded-full flex items-center justify-center',
                          getMatchedPair(pair.id, false)?.leftId === pair.id
                            ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        )}
                      >
                        {getMatchedPair(pair.id, false)?.leftId === pair.id ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          <XCircle className="h-4 w-4" />
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Instructions */}
      {!isAnswered && (
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          Click on an item from each column to create a matching pair
        </div>
      )}
    </div>
  );
}

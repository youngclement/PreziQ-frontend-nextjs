// 'use client';

// import QuizMatchingPairViewer from '../../sessions/components/QuizMatchingPairViewer';
// import { motion } from 'framer-motion';
// import { Link, Clock, Users } from 'lucide-react';
// import { useState, useEffect, useMemo } from 'react';

// // Mock WebSocket implementation for demo
// class MockSessionWebSocket {
//   private participants = 10;
//   private answeredParticipants = 0;
//   private listeners: { [key: string]: Function[] } = {};
//   private updateInterval: NodeJS.Timeout | null = null;

//   constructor() {
//     // Chỉ tăng số người tham gia một lần mỗi 2 giây
//     this.updateInterval = setInterval(() => {
//       if (this.answeredParticipants < this.participants) {
//         this.answeredParticipants++;
//         this.notifyListeners('participantsUpdate');
//       } else {
//         // Dừng interval khi đã đạt số người tham gia tối đa
//         if (this.updateInterval) {
//           clearInterval(this.updateInterval);
//           this.updateInterval = null;
//         }
//       }
//     }, 2000);
//   }

//   // Thêm cleanup method
//   cleanup() {
//     if (this.updateInterval) {
//       clearInterval(this.updateInterval);
//       this.updateInterval = null;
//     }
//   }

//   onParticipantsUpdateHandler(callback: Function) {
//     if (!this.listeners['participantsUpdate']) {
//       this.listeners['participantsUpdate'] = [];
//     }
//     this.listeners['participantsUpdate'].push(callback);
//   }

//   private notifyListeners(event: string) {
//     if (this.listeners[event]) {
//       this.listeners[event].forEach((callback) => callback());
//     }
//   }

//   getParticipantsEventRatio() {
//     return {
//       count: this.answeredParticipants,
//       total: this.participants,
//       percentage: Math.round(
//         (this.answeredParticipants / this.participants) * 100
//       ),
//     };
//   }

//   async submitActivity(data: any) {
//     console.log('Submitting activity:', data);
//     // Simulate network delay and answer validation
//     await new Promise((resolve) => setTimeout(resolve, 1000));

//     // Parse the submitted answers
//     const submittedAnswers = JSON.parse(data.answerContent);

//     // Validate answers against correct pairs
//     const correctAnswers = demoActivity.quiz.options
//       .filter((opt) => opt.type === 'left')
//       .map((leftOpt) => ({
//         columnA: leftOpt.id,
//         columnB: demoActivity.quiz.options.find(
//           (rightOpt) =>
//             rightOpt.pair_id === leftOpt.pair_id && rightOpt.type === 'right'
//         )?.id,
//       }));

//     // Check if all answers are correct
//     const isCorrect = submittedAnswers.every((answer: any) =>
//       correctAnswers.some(
//         (correct) =>
//           correct.columnA === answer.columnA &&
//           correct.columnB === answer.columnB
//       )
//     );

//     return {
//       success: true,
//       isCorrect,
//       correctAnswers,
//     };
//   }
// }

// // Sample activity data with correct pairs
// const demoActivity = {
//   activityId: 'demo-1',
//   title: 'Demo Matching Pairs',
//   description: 'Match the countries with their capitals',
//   backgroundColor: '#0e2838',
//   quiz: {
//     questionText: 'Match each country with its capital city',
//     timeLimitSeconds: 60,
//     options: [
//       {
//         id: '1',
//         option_text: 'France',
//         type: 'left',
//         pair_id: 'pair1',
//         display_order: 1,
//       },
//       {
//         id: '2',
//         option_text: 'Germany',
//         type: 'left',
//         pair_id: 'pair2',
//         display_order: 2,
//       },
//       {
//         id: '3',
//         option_text: 'Italy',
//         type: 'left',
//         pair_id: 'pair3',
//         display_order: 3,
//       },
//       {
//         id: '4',
//         option_text: 'Spain',
//         type: 'left',
//         pair_id: 'pair4',
//         display_order: 4,
//       },
//       {
//         id: '5',
//         option_text: 'Paris',
//         type: 'right',
//         pair_id: 'pair1',
//         display_order: 1,
//       },
//       {
//         id: '6',
//         option_text: 'Berlin',
//         type: 'right',
//         pair_id: 'pair2',
//         display_order: 2,
//       },
//       {
//         id: '7',
//         option_text: 'Rome',
//         type: 'right',
//         pair_id: 'pair3',
//         display_order: 3,
//       },
//       {
//         id: '8',
//         option_text: 'Madrid',
//         type: 'right',
//         pair_id: 'pair4',
//         display_order: 4,
//       },
//     ],
//   },
// };

// export default function DemoPage() {
//   const mockWebSocket = useMemo(() => new MockSessionWebSocket(), []);
//   const [answeredCount, setAnsweredCount] = useState(0);
//   const [totalParticipants, setTotalParticipants] = useState(5);
//   const [timeLeft, setTimeLeft] = useState(demoActivity.quiz.timeLimitSeconds);
//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [error, setError] = useState<string | null>(null);
//   const [isQuizEnded, setIsQuizEnded] = useState(false);

//   // Timer effect
//   useEffect(() => {
//     if (timeLeft <= 0 || isSubmitted || isQuizEnded) return;

//     const timer = setInterval(() => {
//       setTimeLeft((prev) => Math.max(0, prev - 1));
//     }, 1000);

//     return () => clearInterval(timer);
//   }, [timeLeft, isSubmitted, isQuizEnded]);

//   // WebSocket participants update effect
//   useEffect(() => {
//     const updateResponseRatio = () => {
//       const participantsRatio = mockWebSocket.getParticipantsEventRatio();
//       setAnsweredCount(participantsRatio.count);
//       setTotalParticipants(participantsRatio.total);
//     };

//     // Chỉ cập nhật một lần khi component mount
//     updateResponseRatio();
//     mockWebSocket.onParticipantsUpdateHandler(updateResponseRatio);

//     return () => {
//       mockWebSocket.cleanup();
//     };
//   }, [mockWebSocket]);

//   // Format time helper
//   const formatTime = (seconds: number) => {
//     const mins = Math.floor(seconds / 60);
//     const secs = seconds % 60;
//     return `${mins}:${secs.toString().padStart(2, '0')}`;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
//       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
//         {/* Activity Content */}
//         <div className="p-6">
//           <QuizMatchingPairViewer
//             activity={demoActivity}
//             sessionId="demo-session"
//             sessionWebSocket={mockWebSocket}
//             isParticipating={true}
//           />
//         </div>
//       </div>
//     </div>
//   );
// }

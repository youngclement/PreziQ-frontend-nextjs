"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { sessionsApi } from "@/api-client/sessions-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, Clock, X, Activity, Trophy, Users, Calendar, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

// Add a more specific type for participantHistoryResponses
export interface ParticipantHistoryResponse {
    sessionParticipantId: string;
    displayName: string;
    displayAvatar: string;
    finalScore: number;
    finalRanking: number;
    finalCorrectCount: number;
    finalIncorrectCount: number;
    activitySubmissions: Array<{
        activitySubmissionId: string;
        answerContent: string;
        isCorrect: boolean;
        responseScore: number;
    }>;
}

// Update the SessionHistoryResponse interface to match the API
export interface SessionHistoryResponseItem {
    sessionId: string;
    sessionCode: string;
    startTime: string;
    endTime: string;
    sessionStatus: string;
    collection: {
        collectionId: string;
        title: string;
        description: string;
        coverImage: string;
    };
    hostUser: {
        userId: string;
        email: string;
        firstName: string;
        lastName: string;
        displayName?: string; // For UI compatibility
        profilePictureUrl?: string; // For UI compatibility
    };
    participantHistoryResponses: ParticipantHistoryResponse[];
}

export interface SessionHistoryResponse {
    success: boolean;
    message: string;
    data: SessionHistoryResponseItem[];
    meta: {
        timestamp: string;
        instance: string;
    };
}

export interface SessionHistoryDetailResponse {
    success: boolean;
    message: string;
    data: SessionHistoryResponseItem;
    meta: {
        timestamp: string;
        instance: string;
    };
}

// Mock data with the correct structure
const mockSessionHistory: SessionHistoryResponse = {
    success: true,
    message: "Session history retrieved successfully",
    data: [{
        sessionId: "63503157-b94d-401f-b1ee-bc8e1a4ff9db",
        sessionCode: "7XP9ZT",
        startTime: "2023-11-15 14:30:25 PM",
        endTime: "2023-11-15 15:45:18 PM",
        sessionStatus: "ENDED",
        collection: {
            collectionId: "9a5c4b83-7d6e-4c0e-a64b-3f2e558f5c3d",
            title: "JavaScript Fundamentals",
            description: "A comprehensive collection covering JavaScript core concepts and best practices",
            coverImage: "https://storage.googleapis.com/priziq-thumbnails/js-basics.jpg",
        },
        hostUser: {
            userId: "85d7816a-c385-4f30-8760-31c0f3d9511b",
            email: "john.educator@example.com",
            firstName: "John",
            lastName: "Educator",
            displayName: "John Educator",
            profilePictureUrl: "https://storage.googleapis.com/priziq-avatars/john_educator.jpg"
        },
        participantHistoryResponses: [
            {
                sessionParticipantId: "1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p",
                displayName: "Alice Johnson",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/alice_avatar.jpg",
                finalScore: 950,
                finalRanking: 1,
                finalCorrectCount: 10,
                finalIncorrectCount: 0,
                activitySubmissions: [
                    {
                        activitySubmissionId: "s1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "s2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "s3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"C"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "s4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"let x = 10;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "s5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["A","C"]}',
                        isCorrect: true,
                        responseScore: 100
                    }
                ]
            },
            {
                sessionParticipantId: "2b3c4d5e-6f7g-8h9i-0j1k-2l3m4n5o6p7",
                displayName: "Bob Smith",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/bob_avatar.png",
                finalScore: 850,
                finalRanking: 2,
                finalCorrectCount: 9,
                finalIncorrectCount: 1,
                activitySubmissions: [
                    {
                        activitySubmissionId: "t1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "t2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "t3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"D"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "t4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"var x = 10;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "t5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["A","C"]}',
                        isCorrect: true,
                        responseScore: 100
                    }
                ]
            },
            {
                sessionParticipantId: "3c4d5e6f-7g8h-9i0j-1k2l-3m4n5o6p7q8",
                displayName: "Charlie Davis",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/charlie_avatar.jpg",
                finalScore: 800,
                finalRanking: 3,
                finalCorrectCount: 8,
                finalIncorrectCount: 2,
                activitySubmissions: [
                    {
                        activitySubmissionId: "u1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "u2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "u3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "u4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"const x = 10;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "u5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["B","D"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "4d5e6f7g-8h9i-0j1k-2l3m-4n5o6p7q8r9",
                displayName: "Diana Edwards",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/diana_avatar.jpg",
                finalScore: 750,
                finalRanking: 4,
                finalCorrectCount: 8,
                finalIncorrectCount: 2,
                activitySubmissions: [
                    {
                        activitySubmissionId: "v1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "v2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "v3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"C"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "v4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"let myValue = 20;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "v5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["A","B"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "5e6f7g8h-9i0j-1k2l-3m4n-5o6p7q8r9s0",
                displayName: "Ethan Foster",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/ethan_avatar.png",
                finalScore: 700,
                finalRanking: 5,
                finalCorrectCount: 7,
                finalIncorrectCount: 3,
                activitySubmissions: [
                    {
                        activitySubmissionId: "w1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"C"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "w2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "w3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "w4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"const result = 30;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "w5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["C","D"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "6f7g8h9i-0j1k-2l3m-4n5o-6p7q8r9s0t1",
                displayName: "Fiona Garcia",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/fiona_avatar.jpg",
                finalScore: 650,
                finalRanking: 6,
                finalCorrectCount: 7,
                finalIncorrectCount: 3,
                activitySubmissions: [
                    {
                        activitySubmissionId: "x1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "x2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"D"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "x3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "x4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"let counter = 5;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "x5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["B","C"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "7g8h9i0j-1k2l-3m4n-5o6p-7q8r9s0t1u2",
                displayName: "George Harris",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/george_avatar.png",
                finalScore: 600,
                finalRanking: 7,
                finalCorrectCount: 6,
                finalIncorrectCount: 4,
                activitySubmissions: [
                    {
                        activitySubmissionId: "y1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "y2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "y3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"D"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "y4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"var status = true;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "y5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["A","C"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "8h9i0j1k-2l3m-4n5o-6p7q-8r9s0t1u2v3",
                displayName: "Hannah Irwin",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/hannah_avatar.jpg",
                finalScore: 550,
                finalRanking: 8,
                finalCorrectCount: 6,
                finalIncorrectCount: 4,
                activitySubmissions: [
                    {
                        activitySubmissionId: "z1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "z2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"C"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "z3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "z4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"let isActive = false;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "z5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["B","D"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "9i0j1k2l-3m4n-5o6p-7q8r-9s0t1u2v3w4",
                displayName: "Ian Jones",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/ian_avatar.png",
                finalScore: 500,
                finalRanking: 9,
                finalCorrectCount: 5,
                finalIncorrectCount: 5,
                activitySubmissions: [
                    {
                        activitySubmissionId: "a1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"C"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "a2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "a3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"D"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "a4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"var isEnabled = true;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "a5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["A","D"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "0j1k2l3m-4n5o-6p7q-8r9s-0t1u2v3w4x5",
                displayName: "Julia Kim",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/julia_avatar.jpg",
                finalScore: 450,
                finalRanking: 10,
                finalCorrectCount: 5,
                finalIncorrectCount: 5,
                activitySubmissions: [
                    {
                        activitySubmissionId: "b1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "b2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"D"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "b3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "b4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"const flag = false;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "b5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["C","D"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "1k2l3m4n-5o6p-7q8r-9s0t-1u2v3w4x5y6",
                displayName: "Kevin Lee",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/kevin_avatar.png",
                finalScore: 400,
                finalRanking: 11,
                finalCorrectCount: 4,
                finalIncorrectCount: 6,
                activitySubmissions: [
                    {
                        activitySubmissionId: "c1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"D"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "c2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "c3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"C"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "c4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"var temp = 100;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "c5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["D","E"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "2l3m4n5o-6p7q-8r9s-0t1u-2v3w4x5y6z7",
                displayName: "Laura Martin",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/laura_avatar.jpg",
                finalScore: 350,
                finalRanking: 12,
                finalCorrectCount: 4,
                finalIncorrectCount: 6,
                activitySubmissions: [
                    {
                        activitySubmissionId: "d1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "d2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"E"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "d3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"F"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "d4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"let count = 1;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "d5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["E","F"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "3m4n5o6p-7q8r-9s0t-1u2v-3w4x5y6z7a8",
                displayName: "Michael Nelson",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/michael_avatar.png",
                finalScore: 300,
                finalRanking: 13,
                finalCorrectCount: 3,
                finalIncorrectCount: 7,
                activitySubmissions: [
                    {
                        activitySubmissionId: "e1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"C"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "e2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"D"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "e3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "e4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"let valid = false;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "e5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["F","G"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "4n5o6p7q-8r9s-0t1u-2v3w-4x5y6z7a8b9",
                displayName: "Natalie Ortiz",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/natalie_avatar.jpg",
                finalScore: 250,
                finalRanking: 14,
                finalCorrectCount: 3,
                finalIncorrectCount: 7,
                activitySubmissions: [
                    {
                        activitySubmissionId: "f1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "f2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"F"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "f3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"G"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "f4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"var data = null;"}',
                        isCorrect: true,
                        responseScore: 150
                    },
                    {
                        activitySubmissionId: "f5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["G","H"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            },
            {
                sessionParticipantId: "5o6p7q8r-9s0t-1u2v-3w4x-5y6z7a8b9c0",
                displayName: "Oliver Parker",
                displayAvatar: "https://storage.googleapis.com/priziq-avatars/oliver_avatar.png",
                finalScore: 200,
                finalRanking: 15,
                finalCorrectCount: 2,
                finalIncorrectCount: 8,
                activitySubmissions: [
                    {
                        activitySubmissionId: "g1a2b3c4-d5e6-f7g8-h9i0-j1k2l3m4n5o6",
                        answerContent: '{"selectedOption":"A"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "g2b3c4d5-e6f7-g8h9-i0j1-k2l3m4n5o6p7",
                        answerContent: '{"selectedOption":"H"}',
                        isCorrect: false,
                        responseScore: 0
                    },
                    {
                        activitySubmissionId: "g3c4d5e6-f7g8-h9i0-j1k2-l3m4n5o6p7q8",
                        answerContent: '{"selectedOption":"B"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "g4d5e6f7-g8h9-i0j1-k2l3-m4n5o6p7q8r9",
                        answerContent: '{"textAnswer":"const ready = true;"}',
                        isCorrect: true,
                        responseScore: 100
                    },
                    {
                        activitySubmissionId: "g5e6f7g8-h9i0-j1k2-l3m4-n5o6p7q8r9s0",
                        answerContent: '{"selectedOptions":["H","I"]}',
                        isCorrect: false,
                        responseScore: 0
                    }
                ]
            }
        ]
    }],
    meta: {
        timestamp: new Date().toISOString(),
        instance: "mock-instance",
    },
};

export default function SessionHistoryPage() {
    const { id } = useParams();
    const [sessionHistory, setSessionHistory] = useState<SessionHistoryDetailResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    useEffect(() => {
        const fetchSessionHistory = async () => {
            try {
                setLoading(true);
                const sessionId = Array.isArray(id) ? id[0] : id;
                // Cast the response to our defined interface
                const response = await sessionsApi.getSessionHistory(sessionId) as unknown as SessionHistoryResponse;

                // Assume API response contains a single session data
                setSessionHistory({
                    success: response.success,
                    message: response.message,
                    data: response.data[0], // Get first item from array
                    meta: response.meta
                });
            } catch (err) {
                console.error("Failed to fetch session history:", err);
                setError("Failed to load session history data");
                toast({
                    title: "Error loading session history",
                    description: "Using mock data instead. Please try again later.",
                    variant: "destructive",
                });
                // Convert mock data to correct format
                setSessionHistory({
                    success: mockSessionHistory.success,
                    message: mockSessionHistory.message,
                    data: mockSessionHistory.data[0],
                    meta: mockSessionHistory.meta
                });
            } finally {
                setLoading(false);
            }
        };

        fetchSessionHistory();
    }, [id, toast]);

    // Format date string to a more readable format
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "PPp"); // Format: 'Apr 29, 2023, 1:30 PM'
        } catch (e) {
            return dateString; // Return the original string if parsing fails
        }
    };
    const InfoItem = ({
        icon,
        title,
        subtitle,
    }: {
        icon: React.ReactNode;
        title: React.ReactNode;
        subtitle: string;
    }) => (
        <div className="flex items-start gap-3 p-3 bg-muted/30 border border-border rounded-lg">
            <div className="flex items-center justify-center w-10 h-10 rounded-md bg-muted text-muted-foreground">
                {icon}
            </div>
            <div className="flex-1">
                <p className="text-base font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
        </div>
    );


    // Calculate session duration in minutes
    const calculateSessionDuration = (startTime: string, endTime: string) => {
        try {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const durationMs = end.getTime() - start.getTime();
            const durationMinutes = Math.round(durationMs / (1000 * 60));
            return durationMinutes;
        } catch (e) {
            return "N/A";
        }
    };

    if (loading) {
        return <SessionHistorySkeleton />;
    }

    if (error && !sessionHistory) {
        return (
            <div className="container mx-auto py-8">
                <Card className="mb-6">
                    <CardContent className="pt-6 text-center">
                        <h2 className="text-lg font-medium">Error Loading Session History</h2>
                        <p className="text-muted-foreground mt-2">{error}</p>
                        <Button variant="default" className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            <Link href="/dashboard">Return to Dashboard</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const session = sessionHistory!.data;
    const { participantHistoryResponses } = session;
    const sessionDuration = calculateSessionDuration(session.startTime, session.endTime);

    return (
        <div className="container mx-auto py-8 px-4">
            {/* Back button */}
            <div className="mb-6">
                <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to Dashboard
                    </Button>
                </Link>
            </div>

            {/* Session Info Card - Modernized Design */}
            <Card className="mb-6 border bg-white dark:bg-neutral-900 rounded-lg">
                <CardHeader className="pb-3">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-2">
                        <div>
                            <CardTitle className="text-lg font-semibold">
                                {session.collection.title}
                            </CardTitle>

                            {/* Highlight Session ID */}
                            <div className="mt-1 px-2 py-1 inline-block bg-muted text-sm font-mono rounded border border-muted-foreground">
                                Session ID: <span className="font-semibold text-primary">{session.sessionCode}</span>
                            </div>
                        </div>

                        <Badge
                            variant={session.sessionStatus === "ENDED" ? "outline" : "default"}
                            className="text-xs px-2 py-0.5 rounded-full uppercase"
                        >
                            {session.sessionStatus}
                        </Badge>
                    </div>
                </CardHeader>

                <CardContent className="pt-0">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <InfoItem
                            icon={
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={session.hostUser.profilePictureUrl} alt="Host" />
                                    <AvatarFallback>
                                        {session.hostUser.displayName?.charAt(0).toUpperCase() || ''}
                                    </AvatarFallback>
                                </Avatar>
                            }
                            title={session.hostUser.displayName || ''}
                            subtitle="Host"
                        />

                        <InfoItem
                            icon={<Calendar className="h-4 w-4 text-muted-foreground" />}
                            title={formatDate(session.startTime)}
                            subtitle="Date"
                        />

                        <InfoItem
                            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
                            title={`${sessionDuration} mins`}
                            subtitle="Duration"
                        />

                        <InfoItem
                            icon={<Users className="h-4 w-4 text-muted-foreground" />}
                            title={participantHistoryResponses.length}
                            subtitle="Participants"
                        />
                    </div>
                </CardContent>
            </Card>





            {/* Main Content Tabs */}
            <Tabs defaultValue="overview" className="w-full">
                <TabsList className="mb-4 grid w-full grid-cols-2 md:w-[400px]">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="participants">Participants</TabsTrigger>
                </TabsList>

                {/* Overview Tab Content */}
                <TabsContent value="overview" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Session Performance</CardTitle>
                            <CardDescription>Overall performance metrics for this session</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Top Performers Card - Simplified and Modern */}
                                <Card className="col-span-1">
                                    <CardHeader>
                                        <CardTitle className="text-md flex items-center">
                                            <Trophy className="h-4 w-4 mr-2 text-yellow-500" />
                                            Top Performers
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pb-4 space-y-3">
                                        {participantHistoryResponses
                                            .sort((a, b) => a.finalRanking - b.finalRanking)
                                            .slice(0, 3)
                                            .map((participant, index) => (
                                                <div key={participant.sessionParticipantId} className="flex items-center">
                                                    <div className="w-6 text-center mr-3">
                                                        {index === 0 && "🥇"}
                                                        {index === 1 && "🥈"}
                                                        {index === 2 && "🥉"}
                                                    </div>
                                                    <Avatar className="h-8 w-8 mr-3">
                                                        <AvatarImage src={participant.displayAvatar} alt={participant.displayName} />
                                                        <AvatarFallback>
                                                            {participant.displayName.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium truncate">{participant.displayName}</p>
                                                        <p className="text-xs text-muted-foreground">{participant.finalScore} points</p>
                                                    </div>
                                                </div>
                                            ))}
                                    </CardContent>
                                </Card>

                                {/* Correct vs Incorrect Answers - Enhanced */}
                                <Card className="col-span-1 md:col-span-2 border-0 shadow-md">
                                    <CardHeader>
                                        <CardTitle className="text-md flex items-center">

                                            Answer Distribution
                                        </CardTitle>
                                        <CardDescription>Average correct vs incorrect answers</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {/* Calculate averages */}
                                        {(() => {
                                            const totalCorrect = participantHistoryResponses.reduce(
                                                (sum, p) => sum + p.finalCorrectCount, 0
                                            );
                                            const totalIncorrect = participantHistoryResponses.reduce(
                                                (sum, p) => sum + p.finalIncorrectCount, 0
                                            );
                                            const totalAnswers = totalCorrect + totalIncorrect;
                                            const correctPercentage = totalAnswers > 0
                                                ? Math.round((totalCorrect / totalAnswers) * 100)
                                                : 0;

                                            return (
                                                <div className="space-y-5 pt-2">
                                                    <div className="flex justify-between items-center">
                                                        <span className="flex items-center text-sm font-medium">
                                                            <div className="h-7 w-7 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mr-2">
                                                                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                                            </div>
                                                            Correct
                                                        </span>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                                                {correctPercentage}%
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                ({totalCorrect} answers)
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Progress value={correctPercentage} className="h-2 bg-slate-200" />

                                                    <div className="flex justify-between items-center mt-6">
                                                        <span className="flex items-center text-sm font-medium">
                                                            <div className="h-7 w-7 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center mr-2">
                                                                <X className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                                                            </div>
                                                            Incorrect
                                                        </span>
                                                        <div className="flex items-baseline gap-1.5">
                                                            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                                                                {100 - correctPercentage}%
                                                            </span>
                                                            <span className="text-xs text-slate-500">
                                                                ({totalIncorrect} answers)
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <Progress value={100 - correctPercentage} className="h-2 bg-slate-200">
                                                        <div className="h-full bg-rose-500 dark:bg-rose-600 rounded-full"
                                                            style={{ width: `${100 - correctPercentage}%` }} />
                                                    </Progress>
                                                </div>
                                            );
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Participants Tab Content - Simplified but Elegant */}
                <TabsContent value="participants">
                    <Card className="border border-muted bg-background rounded-lg">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-semibold">Participant Results</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">
                                Detailed results for each participant
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="pt-0">
                            <div className="grid gap-3">
                                {participantHistoryResponses
                                    .sort((a, b) => a.finalRanking - b.finalRanking)
                                    .map((participant) => {
                                        const total = participant.finalCorrectCount + participant.finalIncorrectCount;
                                        const accuracy = total > 0
                                            ? Math.round((participant.finalCorrectCount / total) * 100)
                                            : 0;

                                        const accentColor =
                                            accuracy >= 80 ? "text-emerald-600 dark:text-emerald-300" :
                                                accuracy >= 60 ? "text-blue-600 dark:text-blue-300" :
                                                    accuracy >= 40 ? "text-amber-600 dark:text-amber-300" :
                                                        "text-rose-600 dark:text-rose-300";

                                        return (
                                            <div
                                                key={participant.sessionParticipantId}
                                                className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-lg border border-muted bg-muted/20"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className="w-7 h-7 flex items-center justify-center text-sm font-medium rounded-full bg-muted text-muted-foreground border border-border">
                                                        {participant.finalRanking}
                                                    </div>
                                                    <Avatar className="h-9 w-9 ring-1 ring-muted-foreground/20">
                                                        <AvatarImage src={participant.displayAvatar} alt={participant.displayName} />
                                                        <AvatarFallback className="bg-muted text-white font-semibold">
                                                            {participant.displayName.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="text-sm font-medium">{participant.displayName}</p>
                                                        <p className="text-xs text-muted-foreground">{participant.finalScore} pts</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 md:justify-end text-sm">
                                                    <div className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background">
                                                        <Check className="w-4 h-4 text-emerald-500" />
                                                        {participant.finalCorrectCount}
                                                    </div>
                                                    <div className="flex items-center gap-1 px-2 py-1 rounded-md border border-border bg-background">
                                                        <X className="w-4 h-4 text-rose-500" />
                                                        {participant.finalIncorrectCount}
                                                    </div>
                                                    <div className={`px-2 py-1 rounded-md font-medium border ${accentColor} border-border`}>
                                                        {accuracy}% accuracy
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>


            </Tabs>
        </div>
    );
}

// Skeleton loading component
function SessionHistorySkeleton() {
    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-6">
                <Skeleton className="h-9 w-32" />
            </div>

            <Skeleton className="h-52 w-full mb-8" />

            <div className="mb-4">
                <Skeleton className="h-10 w-[400px]" />
            </div>

            <Skeleton className="h-[500px] w-full" />
        </div>
    );
}
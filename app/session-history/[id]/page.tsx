"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { sessionsApi, SessionParticipantsResponse, ParticipantSubmissionsResponse } from "@/app/api-client/sessions-api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, Clock, X, Activity, Trophy, Users, Calendar, ArrowLeft, BarChart as LucideBarChart, PieChart as LucidePieChart, FileText, Medal, Target } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, RadialBarChart, RadialBar, AreaChart, Area } from 'recharts';
import SimpleHeader from "@/components/simple-header";

export default function SessionHistoryPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [session, setSession] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [participantSubmissions, setParticipantSubmissions] = useState<Map<string, any[]>>(new Map());
    const [selectedParticipant, setSelectedParticipant] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);
    const [activityStats, setActivityStats] = useState<any[]>([]);
    const [currentTab, setCurrentTab] = useState('leaderboard');
    const sessionId = params.id as string;

    useEffect(() => {
        if (!sessionId) return;
        fetchSession();
    }, [sessionId]);

    useEffect(() => {
        if (sessionId && !loadingParticipants) {
            fetchParticipants();
        }
    }, [sessionId]);

    useEffect(() => {
        if (selectedParticipant && !participantSubmissions.has(selectedParticipant)) {
            fetchParticipantSubmissions(selectedParticipant);
        }
    }, [selectedParticipant]);

    useEffect(() => {
        // Generate activity stats from all participant submissions
        if (participants.length > 0 && participantSubmissions.size > 0) {
            generateActivityStats();
        }
    }, [participants, participantSubmissions]);

    const fetchSession = async () => {
        try {
            setLoading(true);
            const response = await sessionsApi.getMySessionsHistory();

            // Find the session in the returned list
            const foundSession = response.data.content.find(s => s.sessionId === sessionId);
            if (foundSession) {
                setSession(foundSession);
            } else {
                toast({
                    title: "Error",
                    description: "Session not found",
                    variant: "destructive",
                });
                router.push('/session-history');
            }
        } catch (error) {
            console.error("Error fetching session:", error);
            toast({
                title: "Error",
                description: "Failed to fetch session details. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchParticipants = async () => {
        try {
            setLoadingParticipants(true);
            const response = await sessionsApi.getSessionParticipants(sessionId);

            if (response.success && response.data.content.length > 0) {
                setParticipants(response.data.content);

                // Auto-select the first participant
                setSelectedParticipant(response.data.content[0].sessionParticipantId);
            }
        } catch (error) {
            console.error("Error fetching participants:", error);
            toast({
                title: "Error",
                description: "Failed to fetch participants. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setLoadingParticipants(false);
        }
    };

    const fetchParticipantSubmissions = async (participantId: string) => {
        if (participantSubmissions.has(participantId)) return;

        try {
            setLoadingSubmissions(true);
            const response = await sessionsApi.getParticipantSubmissions(sessionId, participantId);

            if (response.success) {
                setParticipantSubmissions(prev => {
                    const newMap = new Map(prev);
                    newMap.set(participantId, response.data.content);
                    return newMap;
                });
            }
        } catch (error) {
            console.error("Error fetching participant submissions:", error);
            toast({
                title: "Error",
                description: "Failed to fetch participant answers. Please try again later.",
                variant: "destructive",
            });
        } finally {
            setLoadingSubmissions(false);
        }
    };

    const generateActivityStats = () => {
        // Create a map of activity stats
        const activityMap = new Map();

        // Iterate through all submissions to gather statistics
        participants.forEach(participant => {
            const submissions = participantSubmissions.get(participant.sessionParticipantId);
            if (!submissions) return;

            submissions.forEach(submission => {
                const activityId = submission.activity.activityId;
                const activityTitle = submission.activity.title;

                if (!activityMap.has(activityId)) {
                    activityMap.set(activityId, {
                        activityId,
                        title: activityTitle,
                        totalAnswers: 0,
                        correctAnswers: 0,
                        incorrectAnswers: 0,
                        responses: []
                    });
                }

                const activityStat = activityMap.get(activityId);
                activityStat.totalAnswers++;

                if (submission.isCorrect) {
                    activityStat.correctAnswers++;
                } else {
                    activityStat.incorrectAnswers++;
                }

                // Store individual responses for this activity
                activityStat.responses.push({
                    participantId: participant.sessionParticipantId,
                    participantName: participant.displayName,
                    answer: submission.answerContent,
                    isCorrect: submission.isCorrect,
                    score: submission.responseScore
                });
            });
        });

        // Convert map to array and calculate percentages
        const statsArray = Array.from(activityMap.values()).map(stat => ({
            ...stat,
            correctRate: stat.totalAnswers > 0 ? (stat.correctAnswers / stat.totalAnswers) * 100 : 0
        }));

        setActivityStats(statsArray);
    };

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "MMMM dd, yyyy - h:mm a");
        } catch (error) {
            return dateString;
        }
    };

    const calculateDuration = (startTime: string, endTime?: string) => {
        if (!endTime) return "In progress";
        try {
            const start = new Date(startTime);
            const end = new Date(endTime);
            const diffMs = end.getTime() - start.getTime();
            const diffMins = Math.floor(diffMs / 60000);

            if (diffMins < 1) {
                return "< 1 min";
            } else if (diffMins < 60) {
                return `${diffMins} min${diffMins > 1 ? 's' : ''}`;
            } else {
                const hours = Math.floor(diffMins / 60);
                const mins = diffMins % 60;
                return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
            }
        } catch (error) {
            return "Unknown";
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status.toUpperCase()) {
            case "ACTIVE":
                return <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>;
            case "ENDED":
                return <Badge className="bg-blue-500 hover:bg-blue-600">Ended</Badge>;
            case "PENDING":
                return <Badge className="bg-yellow-500 hover:bg-yellow-600">Pending</Badge>;
            case "CANCELLED":
                return <Badge className="bg-red-500 hover:bg-red-600">Cancelled</Badge>;
            default:
                return <Badge className="bg-gray-500 hover:bg-gray-600">{status}</Badge>;
        }
    };

    const getOverallStatsData = () => {
        // Get overall correct/incorrect distribution
        const totalCorrect = participants.reduce((sum, p) => sum + p.finalCorrectCount, 0);
        const totalIncorrect = participants.reduce((sum, p) => sum + p.finalIncorrectCount, 0);

        return [
            { name: 'Correct', value: totalCorrect, color: COLORS.correct },
            { name: 'Incorrect', value: totalIncorrect, color: COLORS.incorrect }
        ];
    };

    const getQuestionPerformanceData = () => {
        return activityStats.map(stat => ({
            name: stat.title.length > 20 ? stat.title.substring(0, 20) + '...' : stat.title,
            correct: stat.correctAnswers,
            incorrect: stat.incorrectAnswers,
            correctRate: stat.correctRate,
            fullMark: 100
        }));
    };

    const getParticipantPerformanceData = () => {
        return participants
            .sort((a, b) => b.finalScore - a.finalScore)
            .slice(0, 10)
            .map(p => ({
                name: p.displayName.length > 10 ? p.displayName.substring(0, 10) + '...' : p.displayName,
                score: p.finalScore,
                correctRate: (p.finalCorrectCount + p.finalIncorrectCount) > 0
                    ? Math.round((p.finalCorrectCount / (p.finalCorrectCount + p.finalIncorrectCount)) * 100)
                    : 0,
                correct: p.finalCorrectCount,
                incorrect: p.finalIncorrectCount
            }));
    };

    // Solid colors palette
    const COLORS = {
        correct: '#22c55e',        // green
        incorrect: '#ef4444',      // red
        blue: '#3b82f6',          // blue
        purple: '#a855f7',        // purple
        yellow: '#eab308',        // yellow
        orange: '#f97316',        // orange
        cyan: '#06b6d4',          // cyan
        pink: '#ec4899',          // pink
        indigo: '#6366f1'         // indigo
    };

    // Enhanced tooltip with custom styling
    const CustomTooltip = ({ active, payload, label, formatter }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-lg shadow-lg border border-gray-100">
                    <p className="font-medium text-gray-900 mb-1">{label}</p>
                    {payload.map((entry: any, index: number) => {
                        const formattedValue = formatter ?
                            formatter(entry.value, entry.name) :
                            entry.value;

                        return (
                            <div key={`item-${index}`} className="flex items-center mb-1 last:mb-0">
                                <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color || entry.fill || entry.stroke }}></div>
                                <span className="text-gray-700">{entry.name}: </span>
                                <span className="font-semibold ml-1">{formattedValue}</span>
                            </div>
                        );
                    })}
                </div>
            );
        }

        return null;
    };

    // Get session title for header
    const getSessionTitle = () => {
        if (!session) return "Session Details";
        return `Session: ${session.collection.title}`;
    };

    if (loading) {
        return (
            <>
                <SimpleHeader showBackButton title="Session Details" />
                <div className="pt-[52px]">
                    <SessionHistorySkeleton />
                </div>
            </>
        );
    }

    if (!session) {
        return (
            <>
                <SimpleHeader showBackButton title="Session Not Found" />
                <div className="pt-[52px] container mx-auto py-8">
                    <div className="text-center py-12">
                        <h2 className="text-2xl font-bold mb-4">Session not found</h2>
                        <p className="text-muted-foreground mb-8">The session details you're looking for could not be found.</p>
                        <Link href="/session-history">
                            <Button>
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to session history
                            </Button>
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <SimpleHeader showBackButton title={getSessionTitle()} />
            <div className="pt-[52px] bg-slate-50 dark:bg-slate-950 min-h-screen">
                <div className="container mx-auto py-8">
                    <div className="mb-6">
                        <Link href="/session-history">
                            <Button variant="outline" className="mb-4">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to session history
                            </Button>
                        </Link>

                        {/* Session Details Card */}
                        <Card className="mb-6 shadow-sm">
                            <CardHeader className="pb-3">
                                <div className="flex justify-between items-start flex-wrap gap-4">
                                    <div>
                                        <Badge className="mb-2">{session.sessionCode}</Badge>
                                        <CardTitle className="text-2xl font-bold mb-1">
                                            {session.collection.title}
                                        </CardTitle>
                                        <CardDescription className="max-w-2xl">
                                            {session.collection.description}
                                        </CardDescription>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        {getStatusBadge(session.sessionStatus)}
                                        <div className="text-sm text-muted-foreground mt-1">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 mr-1" />
                                                {formatDate(session.startTime)}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>

                            <CardContent>
                                <div className="grid gap-4 sm:grid-cols-3 mb-6">
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <div className="h-9 w-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300">
                                            <Clock className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{calculateDuration(session.startTime, session.endTime)}</div>
                                            <div className="text-sm text-muted-foreground">Duration</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <div className="h-9 w-9 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-purple-600 dark:text-purple-300">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{participants.length}</div>
                                            <div className="text-sm text-muted-foreground">Participants</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                        <div className="h-9 w-9 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-300">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <div className="font-semibold">{session.hostUser.firstName} {session.hostUser.lastName}</div>
                                            <div className="text-sm text-muted-foreground">Host</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Participants Section */}
                                {loadingParticipants ? (
                                    <div className="text-center py-8">
                                        <Skeleton className="h-8 w-32 mx-auto mb-4" />
                                        <Skeleton className="h-4 w-48 mx-auto" />
                                    </div>
                                ) : participants.length > 0 ? (
                                    <div>
                                        <h3 className="text-lg font-bold mb-4 flex items-center">
                                            <Target className="h-5 w-5 mr-2 text-slate-500" />
                                            Session Report
                                        </h3>
                                        <Tabs defaultValue="summary" value={currentTab} onValueChange={setCurrentTab} className="bg-white dark:bg-slate-900 rounded-lg p-1 shadow-sm border border-slate-200 dark:border-slate-800">
                                            <TabsList className="mb-4 grid grid-cols-3 bg-slate-100 dark:bg-slate-800">
                                                <TabsTrigger value="summary" className="flex items-center justify-center gap-2">
                                                    <Activity className="h-4 w-4" />
                                                    <span>Summary</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="players" className="flex items-center justify-center gap-2">
                                                    <Medal className="h-4 w-4" />
                                                    <span>Players</span>
                                                </TabsTrigger>
                                                <TabsTrigger value="questions" className="flex items-center justify-center gap-2">
                                                    <LucideBarChart className="h-4 w-4" />
                                                    <span>Questions</span>
                                                </TabsTrigger>
                                            </TabsList>

                                            {/* Summary Tab */}
                                            <TabsContent value="summary" className="mt-4 space-y-6">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                    {/* Overall Correct/Incorrect Distribution */}
                                                    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-lg">Overall Answer Distribution</CardTitle>
                                                            <CardDescription>Correct vs. Incorrect answers across all participants</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="h-64">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={getOverallStatsData()}
                                                                        cx="50%"
                                                                        cy="50%"
                                                                        labelLine={false}
                                                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                                                        outerRadius={80}
                                                                        innerRadius={50}
                                                                        fill="#8884d8"
                                                                        dataKey="value"
                                                                        paddingAngle={5}
                                                                    >
                                                                        <Cell key="cell-0" fill={COLORS.correct} />
                                                                        <Cell key="cell-1" fill={COLORS.incorrect} />
                                                                    </Pie>
                                                                    <Tooltip content={<CustomTooltip />} />
                                                                    <Legend verticalAlign="bottom" height={36} />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        </CardContent>
                                                    </Card>

                                                    {/* Session Summary Card */}
                                                    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-lg">Session Summary</CardTitle>
                                                            <CardDescription>Key performance indicators</CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="space-y-4">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Total Questions:</span>
                                                                    <span className="font-bold">{activityStats.length}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Total Participants:</span>
                                                                    <span className="font-bold">{participants.length}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Average Success Rate:</span>
                                                                    <span className="font-bold">
                                                                        {activityStats.length > 0
                                                                            ? Math.round(
                                                                                activityStats.reduce((acc, stat) => acc + stat.correctRate, 0) /
                                                                                activityStats.length
                                                                            )
                                                                            : 0}%
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Session Duration:</span>
                                                                    <span className="font-bold">{calculateDuration(session.startTime, session.endTime)}</span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Top Scorer:</span>
                                                                    <span className="font-bold">
                                                                        {participants.length > 0
                                                                            ? participants.sort((a, b) => b.finalScore - a.finalScore)[0].displayName
                                                                            : "N/A"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex justify-between items-center">
                                                                    <span className="font-medium">Hardest Question:</span>
                                                                    <span className="font-bold">
                                                                        {activityStats.length > 0
                                                                            ? activityStats.sort((a, b) => a.correctRate - b.correctRate)[0].title.substring(0, 15) + "..."
                                                                            : "N/A"}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </Card>

                                                    {/* Participant Performance Radar Chart */}
                                                    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-lg">Top Performers Score Analysis</CardTitle>
                                                            <CardDescription>Comparing scores and success rates</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="h-64">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <RadarChart outerRadius={70} data={getParticipantPerformanceData().slice(0, 5)}>
                                                                    <PolarGrid />
                                                                    <PolarAngleAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
                                                                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                                                                    <Radar name="Score" dataKey="score" stroke={COLORS.blue} fill={COLORS.blue} fillOpacity={0.4} />
                                                                    <Radar name="Success Rate (%)" dataKey="correctRate" stroke={COLORS.cyan} fill={COLORS.cyan} fillOpacity={0.4} />
                                                                    <Legend />
                                                                    <Tooltip content={<CustomTooltip />} />
                                                                </RadarChart>
                                                            </ResponsiveContainer>
                                                        </CardContent>
                                                    </Card>

                                                    {/* Question Difficulty Area Chart */}
                                                    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-lg">Question Difficulty Analysis</CardTitle>
                                                            <CardDescription>Success rates across questions</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="h-64">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart
                                                                    data={getQuestionPerformanceData()}
                                                                    margin={{ top: 10, right: 20, left: 0, bottom: 40 }}
                                                                >
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} tick={{ fill: '#64748b', fontSize: 10 }} />
                                                                    <YAxis
                                                                        domain={[0, 100]}
                                                                        label={{
                                                                            value: 'Success %',
                                                                            angle: -90,
                                                                            position: 'insideLeft',
                                                                            style: { textAnchor: 'middle', fill: '#64748b', fontSize: 11 }
                                                                        }}
                                                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                                                    />
                                                                    <Tooltip
                                                                        content={<CustomTooltip formatter={(value: number) => `${value}%`} />}
                                                                    />
                                                                    <Area
                                                                        type="monotone"
                                                                        dataKey="correctRate"
                                                                        stroke={COLORS.purple}
                                                                        fill={COLORS.purple}
                                                                        fillOpacity={0.4}
                                                                    />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        </CardContent>
                                                    </Card>

                                                    {/* Top Performers */}
                                                    <Card className="md:col-span-2 shadow-sm border border-slate-200 dark:border-slate-800">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-lg">Top Performers</CardTitle>
                                                            <CardDescription>Highest scoring participants</CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                                {participants.sort((a, b) => b.finalScore - a.finalScore).slice(0, 3).map((participant, index) => (
                                                                    <div key={participant.sessionParticipantId}
                                                                        className={`flex flex-col items-center rounded-lg p-6 ${index === 0 ? 'bg-yellow-50 border border-yellow-200' :
                                                                            index === 1 ? 'bg-slate-50 border border-gray-200' :
                                                                                'bg-orange-50 border border-amber-200'
                                                                            }`}>
                                                                        <div className="relative mb-4">
                                                                            <Avatar className={`h-20 w-20 border-4 ${index === 0 ? 'border-yellow-400' :
                                                                                index === 1 ? 'border-gray-400' :
                                                                                    'border-amber-600'
                                                                                }`}>
                                                                                <AvatarImage src={participant.displayAvatar} alt={participant.displayName} />
                                                                                <AvatarFallback>{participant.displayName?.charAt(0) || '?'}</AvatarFallback>
                                                                            </Avatar>
                                                                            <div className={`absolute -top-3 -right-3 h-10 w-10 flex items-center justify-center rounded-full shadow-md 
                                                                                ${index === 0 ? 'bg-yellow-400 text-yellow-900' :
                                                                                    index === 1 ? 'bg-gray-400 text-gray-900' :
                                                                                        'bg-amber-600 text-amber-50'}`}>
                                                                                {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                                                                            </div>
                                                                        </div>
                                                                        <span className="font-bold text-center mt-2 text-lg">{participant.displayName}</span>
                                                                        <span className="text-2xl font-black mt-1 mb-3">{participant.finalScore} pts</span>

                                                                        <div className="w-full bg-gray-100 h-2 rounded-full mb-3">
                                                                            <div
                                                                                className={`h-2 rounded-full ${(participant.finalCorrectCount / (participant.finalCorrectCount + participant.finalIncorrectCount)) * 100 >= 75
                                                                                    ? "bg-green-500"
                                                                                    : (participant.finalCorrectCount / (participant.finalCorrectCount + participant.finalIncorrectCount)) * 100 >= 50
                                                                                        ? "bg-yellow-500"
                                                                                        : "bg-red-500"
                                                                                    }`}
                                                                                style={{
                                                                                    width: `${(participant.finalCorrectCount / (participant.finalCorrectCount + participant.finalIncorrectCount)) * 100}%`
                                                                                }}
                                                                            ></div>
                                                                        </div>

                                                                        <div className="flex justify-between w-full text-sm">
                                                                            <div className="flex items-center">
                                                                                <Check className="h-4 w-4 text-green-500 mr-1" />
                                                                                <span>{participant.finalCorrectCount}</span>
                                                                            </div>
                                                                            <div>
                                                                                {(participant.finalCorrectCount + participant.finalIncorrectCount) > 0 ?
                                                                                    Math.round((participant.finalCorrectCount / (participant.finalCorrectCount + participant.finalIncorrectCount)) * 100) : 0}%
                                                                            </div>
                                                                            <div className="flex items-center">
                                                                                <X className="h-4 w-4 text-red-500 mr-1" />
                                                                                <span>{participant.finalIncorrectCount}</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </CardContent>
                                                    </Card>
                                                </div>
                                            </TabsContent>

                                            {/* Players Tab */}
                                            <TabsContent value="players" className="mt-4 space-y-6">
                                                {/* Participant Score Distribution */}
                                                <Card className="mb-6 shadow-sm border border-slate-200 dark:border-slate-800">
                                                    <CardHeader className="pb-2">
                                                        <CardTitle className="text-lg">Score Distribution</CardTitle>
                                                        <CardDescription>Overall participant performance chart</CardDescription>
                                                    </CardHeader>
                                                    <CardContent className="h-64">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart
                                                                data={getParticipantPerformanceData()}
                                                                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                                            >
                                                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                                                <XAxis dataKey="name" angle={-30} textAnchor="end" height={40} tick={{ fill: '#64748b', fontSize: 10 }} />
                                                                <YAxis yAxisId="left" orientation="left" tick={{ fill: '#64748b', fontSize: 10 }} />
                                                                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} />
                                                                <Tooltip content={<CustomTooltip formatter={(value: number, name: string) =>
                                                                    name === "Success Rate (%)" ? `${value}%` : value
                                                                } />} />
                                                                <Legend wrapperStyle={{ fontSize: 12 }} />
                                                                <Bar yAxisId="left" dataKey="score" name="Score" fill={COLORS.blue} radius={[4, 4, 0, 0]} />
                                                                <Bar yAxisId="right" dataKey="correctRate" name="Success Rate (%)" fill={COLORS.purple} radius={[4, 4, 0, 0]} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    </CardContent>
                                                </Card>

                                                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                                                    <Table>
                                                        <TableHeader className="bg-slate-50 dark:bg-slate-800">
                                                            <TableRow>
                                                                <TableHead className="w-12">Rank</TableHead>
                                                                <TableHead>Participant</TableHead>
                                                                <TableHead className="text-right">Score</TableHead>
                                                                <TableHead className="text-center">Correct</TableHead>
                                                                <TableHead className="text-center">Incorrect</TableHead>
                                                                <TableHead className="text-center">Success Rate</TableHead>
                                                                <TableHead></TableHead>
                                                            </TableRow>
                                                        </TableHeader>
                                                        <TableBody>
                                                            {participants
                                                                .sort((a, b) => a.finalRanking - b.finalRanking)
                                                                .map((participant) => (
                                                                    <TableRow key={participant.sessionParticipantId}>
                                                                        <TableCell className="font-medium">
                                                                            {participant.finalRanking === 1 ? (
                                                                                <div className="flex justify-center items-center w-8 h-8 rounded-full bg-yellow-100 text-yellow-600">
                                                                                    <Trophy className="h-4 w-4" />
                                                                                </div>
                                                                            ) : (
                                                                                <div className="flex justify-center items-center w-8 h-8 rounded-full bg-gray-100">
                                                                                    {participant.finalRanking}
                                                                                </div>
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <div className="flex items-center">
                                                                                <Avatar className="h-8 w-8 mr-2">
                                                                                    <AvatarImage src={participant.displayAvatar} alt={participant.displayName} />
                                                                                    <AvatarFallback>{participant.displayName?.charAt(0) || '?'}</AvatarFallback>
                                                                                </Avatar>
                                                                                <div className="font-medium">{participant.displayName}</div>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-right">
                                                                            <div className="font-bold text-lg">{participant.finalScore}</div>
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            <div className="flex items-center justify-center">
                                                                                <Check className="h-4 w-4 text-green-500 mr-1" />
                                                                                {participant.finalCorrectCount}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            <div className="flex items-center justify-center">
                                                                                <X className="h-4 w-4 text-red-500 mr-1" />
                                                                                {participant.finalIncorrectCount}
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell className="text-center">
                                                                            <div className="flex items-center justify-center">
                                                                                <span className="mr-2">
                                                                                    {participant.finalCorrectCount + participant.finalIncorrectCount > 0
                                                                                        ? Math.round((participant.finalCorrectCount / (participant.finalCorrectCount + participant.finalIncorrectCount)) * 100)
                                                                                        : 0}%
                                                                                </span>
                                                                                <div className="relative h-10 w-10">
                                                                                    <svg className="w-10 h-10">
                                                                                        <circle
                                                                                            className="text-gray-200"
                                                                                            strokeWidth="4"
                                                                                            stroke="currentColor"
                                                                                            fill="transparent"
                                                                                            r="16"
                                                                                            cx="20"
                                                                                            cy="20"
                                                                                        />
                                                                                        <circle
                                                                                            className="text-green-500"
                                                                                            strokeWidth="4"
                                                                                            strokeDasharray={100.48}
                                                                                            strokeDashoffset={100.48 - ((participant.finalCorrectCount + participant.finalIncorrectCount > 0
                                                                                                ? Math.round((participant.finalCorrectCount / (participant.finalCorrectCount + participant.finalIncorrectCount)) * 100)
                                                                                                : 0) / 100 * 100.48)}
                                                                                            strokeLinecap="round"
                                                                                            stroke="currentColor"
                                                                                            fill="transparent"
                                                                                            r="16"
                                                                                            cx="20"
                                                                                            cy="20"
                                                                                            transform="rotate(-90 20 20)"
                                                                                        />
                                                                                    </svg>
                                                                                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-medium">
                                                                                        {participant.finalCorrectCount + participant.finalIncorrectCount > 0
                                                                                            ? Math.round((participant.finalCorrectCount / (participant.finalCorrectCount + participant.finalIncorrectCount)) * 100)
                                                                                            : 0}%
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            <Button
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() => {
                                                                                    setSelectedParticipant(participant.sessionParticipantId);
                                                                                    setCurrentTab('submissions');
                                                                                }}
                                                                            >
                                                                                View Answers
                                                                            </Button>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                ))}
                                                        </TableBody>
                                                    </Table>
                                                </div>
                                            </TabsContent>

                                            {/* Questions Tab */}
                                            <TabsContent value="questions" className="mt-4">
                                                <div className="space-y-6">
                                                    {/* Question Performance Chart */}


                                                    {/* Table of Questions */}
                                                    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-lg">Question Details</CardTitle>
                                                            <CardDescription>Performance statistics for all questions</CardDescription>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead className="w-8">#</TableHead>
                                                                        <TableHead>Question</TableHead>
                                                                        <TableHead className="text-center w-24">Type</TableHead>
                                                                        <TableHead className="text-center w-20">Correct</TableHead>
                                                                        <TableHead className="text-center w-20">Incorrect</TableHead>
                                                                        <TableHead className="text-center w-24">Success Rate</TableHead>
                                                                        <TableHead className="text-center w-24">Difficulty</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {activityStats.map((stat, index) => (
                                                                        <TableRow key={stat.activityId}>
                                                                            <TableCell className="font-medium">{index + 1}</TableCell>
                                                                            <TableCell>
                                                                                <div className="font-medium truncate max-w-[250px]" title={stat.title}>
                                                                                    {stat.title}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-center text-sm">
                                                                                {stat.responses[0]?.activity?.activityType?.replace('_', ' ') || 'Unknown'}
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <div className="flex items-center justify-center">
                                                                                    <Check className="h-4 w-4 text-green-500 mr-1" />
                                                                                    {stat.correctAnswers}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <div className="flex items-center justify-center">
                                                                                    <X className="h-4 w-4 text-red-500 mr-1" />
                                                                                    {stat.incorrectAnswers}
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <div className="relative h-8 w-8 mx-auto">
                                                                                    <svg className="w-8 h-8">
                                                                                        <circle
                                                                                            className="text-gray-200"
                                                                                            strokeWidth="3"
                                                                                            stroke="currentColor"
                                                                                            fill="transparent"
                                                                                            r="14"
                                                                                            cx="16"
                                                                                            cy="16"
                                                                                        />
                                                                                        <circle
                                                                                            className={
                                                                                                stat.correctRate >= 75 ? "text-green-500" :
                                                                                                    stat.correctRate >= 50 ? "text-yellow-500" :
                                                                                                        "text-red-500"
                                                                                            }
                                                                                            strokeWidth="3"
                                                                                            strokeDasharray={87.96}
                                                                                            strokeDashoffset={87.96 - (stat.correctRate / 100 * 87.96)}
                                                                                            strokeLinecap="round"
                                                                                            stroke="currentColor"
                                                                                            fill="transparent"
                                                                                            r="14"
                                                                                            cx="16"
                                                                                            cy="16"
                                                                                            transform="rotate(-90 16 16)"
                                                                                        />
                                                                                    </svg>
                                                                                    <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center text-xs font-medium">
                                                                                        {stat.correctRate.toFixed(0)}%
                                                                                    </div>
                                                                                </div>
                                                                            </TableCell>
                                                                            <TableCell className="text-center">
                                                                                <Badge className={
                                                                                    stat.correctRate >= 75 ? "bg-green-500" :
                                                                                        stat.correctRate >= 50 ? "bg-yellow-500" :
                                                                                            "bg-red-500"
                                                                                }>
                                                                                    {stat.correctRate >= 75 ? 'Easy' :
                                                                                        stat.correctRate >= 50 ? 'Medium' :
                                                                                            'Hard'}
                                                                                </Badge>
                                                                            </TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </CardContent>
                                                    </Card>

                                                    <Card className="shadow-sm border border-slate-200 dark:border-slate-800">
                                                        <CardHeader className="pb-2">
                                                            <CardTitle className="text-lg">Question Performance</CardTitle>
                                                            <CardDescription>Number of correct and incorrect answers per question</CardDescription>
                                                        </CardHeader>
                                                        <CardContent className="h-64">
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <BarChart
                                                                    data={getQuestionPerformanceData()}
                                                                    margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
                                                                >
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.7} />
                                                                    <XAxis dataKey="name" angle={-30} textAnchor="end" height={60} tick={{ fill: '#64748b', fontSize: 10 }} />
                                                                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                                                                    <Tooltip
                                                                        content={<CustomTooltip />}
                                                                    />
                                                                    <Legend wrapperStyle={{ fontSize: 12 }} />
                                                                    <Bar dataKey="correct" stackId="a" fill={COLORS.correct} name="Correct" radius={[4, 4, 0, 0]} />
                                                                    <Bar dataKey="incorrect" stackId="a" fill={COLORS.incorrect} name="Incorrect" radius={[4, 4, 0, 0]} />
                                                                </BarChart>
                                                            </ResponsiveContainer>
                                                        </CardContent>
                                                    </Card>


                                                </div>
                                            </TabsContent>

                                            {/* Submissions/Answers Tab */}
                                            <TabsContent value="submissions" className="mt-4">
                                                {selectedParticipant ? (
                                                    <div>
                                                        <div className="mb-4">
                                                            <div className="flex justify-between items-center">
                                                                <h3 className="text-lg font-bold">
                                                                    {participants.find(p => p.sessionParticipantId === selectedParticipant)?.displayName}'s Submissions
                                                                </h3>
                                                                <Button variant="outline" size="sm" onClick={() => setCurrentTab('players')}>
                                                                    Back to Players
                                                                </Button>
                                                            </div>
                                                        </div>
                                                        {loadingSubmissions ? (
                                                            <div className="text-center py-8">
                                                                <Skeleton className="h-8 w-32 mx-auto mb-4" />
                                                                <Skeleton className="h-4 w-48 mx-auto" />
                                                            </div>
                                                        ) : (() => {
                                                            // Get the submissions array safely
                                                            const submissions = participantSubmissions.get(selectedParticipant) || [];

                                                            return submissions.length > 0 ? (
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Question</TableHead>
                                                                            <TableHead>Answer</TableHead>
                                                                            <TableHead className="text-center">Result</TableHead>
                                                                            <TableHead className="text-right">Score</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {submissions.map((submission) => (
                                                                            <TableRow key={submission.activitySubmissionId}>
                                                                                <TableCell>
                                                                                    <div className="font-medium">{submission.activity.title}</div>
                                                                                    <div className="text-xs text-muted-foreground">{submission.activity.quiz?.questionText || ''}</div>
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    <div className="font-medium">{submission.answerContent}</div>
                                                                                </TableCell>
                                                                                <TableCell className="text-center">
                                                                                    {submission.isCorrect ? (
                                                                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                            <Check className="h-3 w-3 mr-1" />
                                                                                            Correct
                                                                                        </div>
                                                                                    ) : (
                                                                                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                                            <X className="h-3 w-3 mr-1" />
                                                                                            Incorrect
                                                                                        </div>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell className="text-right font-bold">
                                                                                    {submission.responseScore}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            ) : (
                                                                <div className="text-center py-8 text-muted-foreground">
                                                                    No submissions found for this participant.
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-8 text-muted-foreground">
                                                        Select a participant to view their submissions.
                                                    </div>
                                                )}
                                            </TabsContent>
                                        </Tabs>
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <div className="rounded-full h-12 w-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 mx-auto mb-4">
                                            <Users className="h-6 w-6 text-slate-500" />
                                        </div>
                                        <h3 className="text-lg font-medium mb-2">No participants found</h3>
                                        <p>There are no participants for this session yet.</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </>
    );
}

function SessionHistorySkeleton() {
    return (
        <div className="container mx-auto py-8">
            <div className="mb-6">
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                            <div className="space-y-2">
                                <Skeleton className="h-6 w-20" />
                                <Skeleton className="h-8 w-72" />
                                <Skeleton className="h-4 w-96" />
                            </div>
                            <div>
                                <Skeleton className="h-6 w-24" />
                                <Skeleton className="h-4 w-32 mt-1" />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-3 mb-6">
                            {Array(3).fill(0).map((_, i) => (
                                <Skeleton key={i} className="h-20" />
                            ))}
                        </div>

                        <Skeleton className="h-10 w-32 mb-4" />
                        <Skeleton className="h-8 w-full mb-4" />
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
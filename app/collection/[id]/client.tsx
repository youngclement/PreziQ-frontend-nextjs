"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Search, Edit, Eye, ArrowLeft, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { MOCK_ACTIVITIES, MOCK_COLLECTIONS } from "../components/mock-data";

export default function CollectionActivitiesClient({ params }: { params: { id: string } }) {
    const router = useRouter();
    const collectionId = params.id;
    const [searchQuery, setSearchQuery] = useState("");

    // Get collection data
    const collection = MOCK_COLLECTIONS.find(c => c.id === collectionId);

    // Get all activities for this collection
    const activities = MOCK_ACTIVITIES.filter(activity => activity.collection_id === collectionId);

    // Filter activities based on search query
    const filteredActivities = activities.filter(activity =>
        activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleAddActivity = () => {
        router.push(`/collection/${collectionId}/activity/create`);
    };

    const handleEditActivity = (id: string) => {
        router.push(`/collection/${collectionId}/activity/edit/${id}`);
    };

    const handleViewQuestions = (id: string) => {
        router.push(`/collection/${id}`);
    };

    const activityVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: (i: number) => ({
            opacity: 1,
            y: 0,
            transition: {
                delay: i * 0.05,
                duration: 0.3
            }
        })
    };

    if (!collection) {
        return (
            <div className="container mx-10 py-20">
                <div className="flex flex-col items-center justify-center py-12 px-4">
                    <h3 className="text-lg font-semibold">Collection not found</h3>
                    <p className="text-muted-foreground text-center mt-1 mb-6">
                        The collection you're looking for doesn't exist or has been removed.
                    </p>
                    <Button onClick={() => router.push("/collections")}>
                        Back to Collections
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex items-center mb-6">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => router.push("/collections")}
                    className="mr-4"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">{collection.title}</h1>
                    <p className="text-muted-foreground">{collection.description}</p>
                </div>
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div className="relative w-full md:w-80">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Search activities..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button onClick={handleAddActivity} className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    New Activity
                </Button>
            </div>

            {filteredActivities.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed rounded-lg">
                    <h3 className="text-lg font-semibold">No activities found</h3>
                    <p className="text-muted-foreground text-center mt-1 mb-6">
                        {searchQuery ? "Try a different search term" : "Add your first activity to get started"}
                    </p>
                    {!searchQuery && (
                        <Button onClick={handleAddActivity}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Create Activity
                        </Button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredActivities.map((activity, i) => (
                        <motion.div
                            key={activity.id}
                            variants={activityVariants}
                            initial="hidden"
                            animate="visible"
                            custom={i}
                        >
                            <Card className="h-full overflow-hidden hover:shadow-lg transition-all border border-gray-100 dark:border-gray-800">
                                <CardHeader className="p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className={activity.is_published ? "bg-green-500" : "bg-amber-500"}>
                                                    {activity.is_published ? "Published" : "Draft"}
                                                </Badge>
                                                <Badge variant="outline">{activity.activity_type_id === "quiz" ? "Quiz" : "Activity"}</Badge>
                                            </div>
                                            <CardTitle className="text-xl mb-2">{activity.title}</CardTitle>
                                            <p className="text-sm text-muted-foreground line-clamp-2">{activity.description}</p>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditActivity(activity.id)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-5 pt-0">
                                    <div className="flex justify-between items-center mt-4">
                                        <Button
                                            variant="default"
                                            className="w-full"
                                            onClick={() => handleViewQuestions(activity.id)}
                                        >
                                            <Eye className="mr-2 h-4 w-4" />
                                            View Questions
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collectionsApi } from "@/api-client";
import { MOCK_ACTIVITIES } from "../components/mock-data";
import { Collection, Activity } from "@/app/collections/components/types";
import { ArrowLeft, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import Link from "next/link";
import DefaultLayout from "@/app/default-layout";

export default function CollectionDetailPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const { toast } = useToast();
    const collectionId = params.id;

    const [isLoading, setIsLoading] = useState(true);
    const [collection, setCollection] = useState<Collection | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCollectionData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                // Fetch collection details
                const response = await collectionsApi.getCollectionById(collectionId);

                console.log("Collection API Response:", response);

                let processedData;
                if (typeof response.data === "string") {
                    try {
                        const cleanedData = response.data.trim();
                        processedData = JSON.parse(cleanedData);
                    } catch (parseError) {
                        console.error("JSON Parse Error:", parseError);
                        throw new Error("Dữ liệu JSON không hợp lệ từ API");
                    }
                } else {
                    processedData = response.data;
                }

                if (processedData?.success && processedData?.data) {
                    setCollection(processedData.data);

                    // For now, we'll use mock activities, but you should replace this with API call
                    // to get activities for this collection
                    const collectionActivities = MOCK_ACTIVITIES.filter(
                        (activity) => activity.collection_id === collectionId
                    );

                    setActivities(collectionActivities);
                } else {
                    throw new Error("Collection data structure is invalid");
                }
            } catch (err) {
                console.error("Error fetching collection:", err);
                setError("Could not load collection details. Please try again later.");
                toast({
                    title: "Error",
                    description:
                        typeof err === "object" && err !== null && "message" in err
                            ? String((err as Error).message)
                            : "Failed to load collection",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };

        if (collectionId) {
            fetchCollectionData();
        }
    }, [collectionId, toast]);

    const formatDateToLocale = (dateString?: string) => {
        if (!dateString) return "Unknown date";
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return "Invalid date";
            return date.toLocaleDateString();
        } catch (e) {
            return "Invalid date";
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <DefaultLayout showBackButton={true} title="Collection Details">
                <div className="container max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                </div>
            </DefaultLayout>
        );
    }

    // Error state
    if (error || !collection) {
        return (
            <DefaultLayout showBackButton={true} title="Error">
                <div className="container max-w-7xl mx-auto px-4 py-16 text-center">
                    <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong</h1>
                    <p className="text-muted-foreground mb-6">{error || "Collection not found"}</p>
                </div>
            </DefaultLayout>
        );
    }

    return (
        <DefaultLayout showBackButton={true} title={collection.title}>
            <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Collection cover image */}
                    <div className="w-full md:w-1/3 aspect-video rounded-lg overflow-hidden relative shadow-lg">
                        <Image
                            src={collection.coverImage || "/placeholder-collection.jpg"}
                            alt={collection.title}
                            className="object-cover"
                            fill
                            sizes="(max-width: 768px) 100vw, 33vw"
                            priority
                        />
                    </div>

                    {/* Collection info */}
                    <div className="w-full md:w-2/3">
                        <h1 className="text-3xl font-bold mb-3">{collection.title}</h1>
                        <p className="text-lg text-muted-foreground mb-6">{collection.description}</p>

                        <div className="flex flex-wrap gap-4 mb-6">
                            <div className="flex items-center text-sm text-muted-foreground">
                                <Clock className="mr-2 h-4 w-4" />
                                Created: {formatDateToLocale(collection.createdAt)}
                            </div>
                            {collection.createdBy && (
                                <div className="flex items-center text-sm text-muted-foreground">
                                    <User className="mr-2 h-4 w-4" />
                                    Author: {collection.createdBy}
                                </div>
                            )}
                        </div>

                        {/* Activity count */}
                        <div className="bg-muted p-4 rounded-lg">
                            <h3 className="text-lg font-medium mb-2">Collection Contents</h3>
                            <p>{activities.length} activities in this collection</p>
                        </div>
                    </div>
                </div>

                <Separator className="my-8" />

                {/* Activities list */}
                <div>
                    <h2 className="text-2xl font-bold mb-6">Activities</h2>

                    {activities.length === 0 ? (
                        <div className="text-center py-12 bg-muted rounded-lg">
                            <p className="text-muted-foreground mb-4">
                                This collection doesn't have any activities yet.
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    <div className="p-6">
                                        <h3 className="text-xl font-medium mb-2">{activity.title}</h3>
                                        <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                                            {activity.description}
                                        </p>

                                        <div className="mt-4 flex justify-end">
                                            <Button
                                                onClick={() => router.push(`/activity/${activity.id}`)}
                                                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white"
                                            >
                                                Start Activity
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </DefaultLayout>
    );
}
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Mock data for activity types
const MOCK_ACTIVITY_TYPES = [
    {
        id: "quiz",
        name: "Quiz",
        description: "Multiple choice quiz with various question types",
        category: "assessment",
        icon: "brain"
    },
    {
        id: "poll",
        name: "Poll",
        description: "Quick opinion polls for gathering feedback",
        category: "engagement",
        icon: "bar-chart"
    },
    {
        id: "flashcards",
        name: "Flashcards",
        description: "Study cards with question and answer sides",
        category: "learning",
        icon: "layers"
    }
];

// Mock data for activities
const MOCK_ACTIVITIES = [
    {
        id: "act1",
        collection_id: "1",
        activity_type_id: "quiz",
        title: "Basic Arithmetic Quiz",
        description: "Test your knowledge of addition, subtraction, multiplication, and division",
        is_published: true,
        display_order: 0
    },
    {
        id: "act2",
        collection_id: "1",
        activity_type_id: "quiz",
        title: "Algebra Concepts",
        description: "Introduction to algebraic expressions and equations",
        is_published: false,
        display_order: 1
    },
    {
        id: "act3",
        collection_id: "2",
        activity_type_id: "poll",
        title: "Science Interest Survey",
        description: "Tell us your favorite science topics",
        is_published: true,
        display_order: 0
    }
];

interface ActivityType {
    id: string;
    name: string;
    description: string;
    category: string;
    icon: string;
}

interface ActivityFormProps {
    params: {
        id: string;
        action: string;
    };
    searchParams: {
        activityId?: string;
    };
}

export default function ActivityForm({ params, searchParams }: ActivityFormProps) {
    const router = useRouter();
    const collectionId = params.id;
    const isEdit = params.action === "edit";
    const activityId = searchParams.activityId;

    const [activityTypes, setActivityTypes] = useState<ActivityType[]>([]);
    const [formData, setFormData] = useState({
        collection_id: collectionId,
        activity_type_id: "",
        title: "",
        description: "",
        is_published: false,
        display_order: 0
    });

    useEffect(() => {
        // Use mock data for activity types
        setActivityTypes(MOCK_ACTIVITY_TYPES);

        // Set default activity type if available
        if (MOCK_ACTIVITY_TYPES.length > 0 && !formData.activity_type_id) {
            setFormData(prev => ({ ...prev, activity_type_id: MOCK_ACTIVITY_TYPES[0].id }));
        }

        // Use mock data for activity if editing
        if (isEdit && activityId) {
            const activity = MOCK_ACTIVITIES.find(a => a.id === activityId);

            if (activity) {
                setFormData(activity);
            } else {
                console.error(`Activity with ID ${activityId} not found in mock data`);
            }
        }
    }, [isEdit, activityId, collectionId, formData.activity_type_id]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, is_published: checked }));
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({ ...prev, activity_type_id: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mock API response instead of actual API call
        try {
            // For development, just log the form data
            console.log("Activity form submitted with data:", formData);

            if (isEdit) {
                console.log(`Mock updating activity ${activityId}`);
                // In a real app, you'd update the activity in your state/store
                setTimeout(() => {
                    router.push(`/collections/${collectionId}`);
                }, 500);
            } else {
                console.log("Mock creating new activity");
                // In a real app, you'd add the new activity with an ID
                // For mock purposes, generate a random ID
                const newActivityId = `act${Math.floor(Math.random() * 1000)}`;

                // Redirect to questions page with the new activity ID
                setTimeout(() => {
                    router.push(`/activities/${newActivityId}/questions`);
                }, 500);
            }
        } catch (error) {
            console.error('Error in mock save activity:', error);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>{isEdit ? 'Edit Activity' : 'Create New Activity'}</CardTitle>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title</Label>
                            <Input
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={4}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="activity_type">Activity Type</Label>
                            <Select
                                value={formData.activity_type_id}
                                onValueChange={handleSelectChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select activity type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {activityTypes.map(type => (
                                        <SelectItem key={type.id} value={type.id}>
                                            {type.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="display_order">Display Order</Label>
                            <Input
                                id="display_order"
                                name="display_order"
                                type="number"
                                value={formData.display_order.toString()}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_published"
                                checked={formData.is_published}
                                onCheckedChange={handleSwitchChange}
                            />
                            <Label htmlFor="is_published">Publish activity</Label>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push(`/collections/${collectionId}`)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">{isEdit ? 'Update Activity' : 'Create Activity'}</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
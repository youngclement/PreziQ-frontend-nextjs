"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

// Mock data for collections
const MOCK_COLLECTIONS = [
    {
        id: "1",
        title: "Math Quizzes",
        description: "A collection of mathematics quizzes for various grade levels",
        is_published: true,
        theme: "blue",
        image: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: "2",
        title: "Science Trivia",
        description: "Fun science facts and quizzes for students",
        is_published: false,
        theme: "green",
        image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    },
    {
        id: "3",
        title: "History Challenge",
        description: "Test your knowledge of world history with these quizzes",
        is_published: true,
        theme: "sepia",
        image: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?ixlib=rb-1.2.1&auto=format&fit=crop&w=500&q=60"
    }
];

interface CollectionFormProps {
    params: {
        action: string;
    };
    searchParams: {
        id?: string;
    };
}

export default function CollectionForm({ params, searchParams }: CollectionFormProps) {
    const router = useRouter();
    const isEdit = params.action === "edit";
    const collectionId = searchParams.id;

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        is_published: false,
        theme: "default",
        image: ""
    });

    useEffect(() => {
        if (isEdit && collectionId) {
            // Use mock data instead of fetching from API
            const collection = MOCK_COLLECTIONS.find(c => c.id === collectionId);

            if (collection) {
                setFormData(collection);
            } else {
                console.error(`Collection with ID ${collectionId} not found in mock data`);
            }
        }
    }, [isEdit, collectionId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSwitchChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, is_published: checked }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Mock API response instead of actual API call
        try {
            // For development, just log the form data
            console.log("Form submitted with data:", formData);

            if (isEdit) {
                console.log(`Mock updating collection ${collectionId}`);
                // In a real app, you'd update the collection in your state/store
            } else {
                console.log("Mock creating new collection");
                // In a real app, you'd add the new collection to your state/store
            }

            // Simulate successful response
            setTimeout(() => {
                router.push('/collections');
            }, 500);
        } catch (error) {
            console.error('Error in mock save collection:', error);
        }
    };

    return (
        <div className="container mx-auto py-8">
            <Card className="max-w-2xl mx-auto">
                <CardHeader>
                    <CardTitle>{isEdit ? 'Edit Collection' : 'Create New Collection'}</CardTitle>
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
                            <Label htmlFor="image">Image URL</Label>
                            <Input
                                id="image"
                                name="image"
                                value={formData.image}
                                onChange={handleChange}
                            />
                            {formData.image && (
                                <div className="mt-2">
                                    <p className="text-sm text-muted-foreground mb-1">Preview:</p>
                                    <img
                                        src={formData.image}
                                        alt="Collection preview"
                                        className="max-h-40 rounded-md object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = "https://via.placeholder.com/300x200?text=Invalid+Image+URL";
                                        }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="theme">Theme</Label>
                            <Input
                                id="theme"
                                name="theme"
                                value={formData.theme}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="flex items-center space-x-2">
                            <Switch
                                id="is_published"
                                checked={formData.is_published}
                                onCheckedChange={handleSwitchChange}
                            />
                            <Label htmlFor="is_published">Publish collection</Label>
                        </div>
                    </CardContent>
                    <CardFooter className="flex justify-between">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/collections')}
                        >
                            Cancel
                        </Button>
                        <Button type="submit">Save Collection</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    PlusCircle, Search, FolderOpen, Edit, Eye, Trash2,
    MoreHorizontal, BookOpen, Check, CalendarIcon, Users2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { MOCK_COLLECTIONS, MOCK_ACTIVITIES } from "../collection/components/mock-data";

export default function CollectionsPage() {
    const router = useRouter();
    const { toast } = useToast();
    const [collections, setCollections] = useState(MOCK_COLLECTIONS);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCollection, setSelectedCollection] = useState<any>(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [viewMode, setViewMode] = useState("grid");

    // Filter collections based on search query
    const filteredCollections = collections?.filter(collection =>
        collection.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        collection.description.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Get activities for a specific collection
    const getCollectionActivities = (collectionId: string) => {
        return MOCK_ACTIVITIES.filter(activity => activity.collection_id === collectionId);
    };

    const handleCreateCollection = () => {
        router.push("/collection/create");
    };

    const handleEditCollection = (id: string) => {
        router.push(`/collection/edit/${id}`);
    };

    const handleViewActivities = (id: string) => {
        router.push(`/collection/${id}`);
    };

    const handleDeleteCollection = (id: string) => {
        // In a real app, you would make an API call here
        setCollections(collections.filter(collection => collection.id !== id));
        toast({
            title: "Collection deleted",
            description: "The collection has been successfully deleted.",
            variant: "default",
        });
    };

    const handlePreviewCollection = (collection: any) => {
        setSelectedCollection(collection);
        setPreviewOpen(true);
    };

    const handlePreviewActivity = (activityId: string) => {
        router.push(`/collection/${activityId}`);
    };

    const collectionVariants = {
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

    return (
        <div className="flex justify-center">
            <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
                    <div>
                        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">My Collections</h1>
                        <p className="text-muted-foreground mt-2 text-lg">
                            Create and manage your interactive learning collections
                        </p>
                    </div>
                    <Button
                        onClick={handleCreateCollection}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white shadow-md hover:shadow-lg transition-all rounded-none"
                        size="lg"
                    >
                        <PlusCircle className="mr-2 h-5 w-5" />
                        New Collection
                    </Button>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search collections..."
                            className="pl-10 border-zinc-300 dark:border-zinc-700 h-11 rounded-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <Tabs value={viewMode} onValueChange={setViewMode} className="w-auto">
                        <TabsList className="grid w-[180px] grid-cols-2 rounded-none p-0.5 bg-zinc-100 dark:bg-zinc-800">
                            <TabsTrigger value="grid" className="flex items-center rounded-none">
                                <div className="grid grid-cols-2 gap-0.5 mr-2">
                                    <div className="w-2 h-2 bg-current"></div>
                                    <div className="w-2 h-2 bg-current"></div>
                                    <div className="w-2 h-2 bg-current"></div>
                                    <div className="w-2 h-2 bg-current"></div>
                                </div>
                                Grid
                            </TabsTrigger>
                            <TabsTrigger value="list" className="flex items-center rounded-none">
                                <div className="flex flex-col gap-0.5 mr-2">
                                    <div className="w-4 h-1 bg-current"></div>
                                    <div className="w-4 h-1 bg-current"></div>
                                    <div className="w-4 h-1 bg-current"></div>
                                </div>
                                List
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>

                {filteredCollections?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                        <FolderOpen className="h-16 w-16 text-zinc-300 dark:text-zinc-700 mb-6" />
                        <h3 className="text-xl font-semibold">No collections found</h3>
                        <p className="text-muted-foreground text-center mt-2 mb-8 max-w-lg">
                            {searchQuery ? "Try a different search term or clear your search to see all collections." : "Create your first collection to start building interactive learning experiences."}
                        </p>
                        {!searchQuery && (
                            <Button
                                onClick={handleCreateCollection}
                                className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-none"
                                size="lg"
                            >
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Collection
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {viewMode === "grid" ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredCollections.map((collection, i) => (
                                    <motion.div
                                        key={collection.id}
                                        variants={collectionVariants}
                                        initial="hidden"
                                        animate="visible"
                                        custom={i}
                                        className="group"
                                    >
                                        <Card className="h-full overflow-hidden hover:shadow-lg transition-all border border-zinc-200 dark:border-zinc-800 rounded-none">
                                            <div
                                                className="aspect-video w-full bg-cover bg-center relative overflow-hidden cursor-pointer"
                                                style={{ backgroundImage: `url(${collection.coverImage})` }}
                                                onClick={() => handlePreviewCollection(collection)}
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                                    <Button variant="ghost" size="sm" className="text-white hover:bg-white/20 rounded-none">
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        Preview
                                                    </Button>
                                                </div>
                                                {collection.is_published && (
                                                    <Badge className="absolute top-3 right-3 bg-emerald-500 text-white shadow-sm rounded-none">Published</Badge>
                                                )}
                                            </div>
                                            <div className="p-5">
                                                <h3 className="font-semibold text-xl mb-2 line-clamp-1">{collection.title}</h3>
                                                <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-2">{collection.description}</p>

                                                <div className="flex items-center text-xs text-zinc-500 dark:text-zinc-400 space-x-4 mb-4">
                                                    <div className="flex items-center">
                                                        <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                                                        {getCollectionActivities(collection.id).length} Activities
                                                    </div>
                                                    <div className="flex items-center">
                                                        <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                                        {new Date().toLocaleDateString('en-US')}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between">
                                                    <Button
                                                        className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 dark:text-indigo-300 rounded-none"
                                                        size="sm"
                                                        onClick={() => handleViewActivities(collection.id)}
                                                    >
                                                        <BookOpen className="mr-2 h-4 w-4" />
                                                        View Activities
                                                    </Button>
                                                    <div className="flex gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 rounded-none"
                                                            onClick={() => handleEditCollection(collection.id)}
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-zinc-500 hover:text-red-600 dark:hover:text-red-500 rounded-none"
                                                            onClick={() => handleDeleteCollection(collection.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredCollections.map((collection, i) => (
                                    <motion.div
                                        key={collection.id}
                                        variants={collectionVariants}
                                        initial="hidden"
                                        animate="visible"
                                        custom={i}
                                    >
                                        <Card className="overflow-hidden hover:shadow-md transition-all border border-zinc-200 dark:border-zinc-800 rounded-none">
                                            <div className="flex flex-col sm:flex-row">
                                                <div
                                                    className="sm:w-64 h-40 sm:h-auto bg-cover bg-center cursor-pointer relative"
                                                    style={{ backgroundImage: `url(${collection.coverImage})` }}
                                                    onClick={() => handlePreviewCollection(collection)}
                                                >
                                                    {collection.is_published && (
                                                        <Badge className="absolute top-3 right-3 bg-emerald-500 text-white shadow-sm rounded-none">
                                                            Published
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex-1 p-5">
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                                                        <h3 className="font-semibold text-xl">{collection.title}</h3>
                                                        <div className="flex items-center space-x-2 text-xs text-zinc-500 dark:text-zinc-400">
                                                            <div className="flex items-center">
                                                                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                                                                {getCollectionActivities(collection.id).length} Activities
                                                            </div>
                                                            <div className="flex items-center">
                                                                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                                                                {new Date().toLocaleDateString()}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">{collection.description}</p>
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:hover:bg-indigo-950/60 dark:text-indigo-300 rounded-none"
                                                                size="sm"
                                                                onClick={() => handleViewActivities(collection.id)}
                                                            >
                                                                <BookOpen className="mr-2 h-4 w-4" />
                                                                View Activities
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="rounded-none"
                                                                onClick={() => handlePreviewCollection(collection)}
                                                            >
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                Preview
                                                            </Button>
                                                        </div>
                                                        <div className="flex gap-1">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300 rounded-none"
                                                                onClick={() => handleEditCollection(collection.id)}
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-8 w-8 text-zinc-500 hover:text-red-600 dark:hover:text-red-500 rounded-none"
                                                                onClick={() => handleDeleteCollection(collection.id)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Collection Preview Dialog - Enhanced UI with Angular Design */}
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                    <DialogContent className="sm:max-w-5xl p-0 overflow-hidden rounded-none">
                        <div className="flex flex-col md:flex-row h-full">
                            {/* Left Side - Collection Image */}
                            <div
                                className="md:w-2/5 h-60 md:h-auto bg-cover bg-center relative"
                                style={{
                                    backgroundImage: selectedCollection ? `url(${selectedCollection.coverImage})` : 'none',
                                }}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-transparent md:bg-gradient-to-b flex flex-col justify-end p-6 text-white">
                                    {selectedCollection && (
                                        <>
                                            <Badge className={cn(
                                                "w-fit mb-3 rounded-none",
                                                selectedCollection.is_published
                                                    ? "bg-emerald-500/90 hover:bg-emerald-500"
                                                    : "bg-amber-500/90 hover:bg-amber-500"
                                            )}>
                                                {selectedCollection.is_published ? "Published" : "Draft"}
                                            </Badge>
                                            <h2 className="text-2xl font-bold mb-1 hidden md:block">
                                                {selectedCollection.title}
                                            </h2>
                                            <p className="text-white/80 text-sm line-clamp-2 hidden md:block">
                                                {selectedCollection.description}
                                            </p>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Right Side - Details and Activities */}
                            <div className="flex-1 p-6 max-h-[80vh] overflow-y-auto">
                                <DialogHeader className="md:hidden mb-4">
                                    <DialogTitle className="text-2xl">
                                        {selectedCollection?.title}
                                    </DialogTitle>
                                    <DialogDescription>
                                        {selectedCollection?.description}
                                    </DialogDescription>
                                </DialogHeader>

                                <DialogHeader className="hidden md:block">
                                    <DialogTitle className="text-xl">Collection Details</DialogTitle>
                                </DialogHeader>

                                {selectedCollection && (
                                    <div className="space-y-6">
                                        {/* Stats Section */}
                                        <div className="grid grid-cols-3 gap-4 py-4">
                                            <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-900">
                                                <BookOpen className="h-5 w-5 text-indigo-500 mb-2" />
                                                <span className="text-lg font-semibold">
                                                    {getCollectionActivities(selectedCollection.id).length}
                                                </span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">Activities</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-900">
                                                <Users2 className="h-5 w-5 text-indigo-500 mb-2" />
                                                <span className="text-lg font-semibold">0</span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">Participants</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-3 bg-zinc-50 dark:bg-zinc-900">
                                                <Clock className="h-5 w-5 text-indigo-500 mb-2" />
                                                <span className="text-lg font-semibold">--:--</span>
                                                <span className="text-xs text-zinc-500 dark:text-zinc-400">Avg. Time</span>
                                            </div>
                                        </div>

                                        {/* Activities List */}
                                        <div>
                                            <h3 className="text-lg font-semibold mb-3 flex items-center">
                                                <BookOpen className="mr-2 h-4 w-4 text-indigo-500" />
                                                Activities in this Collection
                                            </h3>
                                            <div className="space-y-2.5 max-h-[40vh] overflow-y-auto pr-1">
                                                {getCollectionActivities(selectedCollection.id).map((activity) => (
                                                    <div
                                                        key={activity.id}
                                                        className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex justify-between items-center hover:shadow-sm transition-all"
                                                    >
                                                        <div>
                                                            <div className="flex items-center">
                                                                <p className="font-medium">{activity.title}</p>
                                                                {activity.is_published && (
                                                                    <Badge className="ml-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 hover:bg-emerald-100 rounded-none">
                                                                        <Check className="h-3 w-3 mr-1" />
                                                                        Published
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                                                {activity.description}
                                                            </p>
                                                        </div>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            className="shrink-0 ml-2 rounded-none"
                                                            onClick={() => {
                                                                setPreviewOpen(false);
                                                                router.push(`/collection/${activity.id}`);
                                                            }}
                                                        >
                                                            <Eye className="h-3.5 w-3.5 mr-1.5" />
                                                            Preview
                                                        </Button>
                                                    </div>
                                                ))}

                                                {getCollectionActivities(selectedCollection.id).length === 0 && (
                                                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                                                        <BookOpen className="h-10 w-10 text-zinc-300 dark:text-zinc-700 mb-3" />
                                                        <p className="text-zinc-500 dark:text-zinc-400 mb-2">
                                                            No activities in this collection yet
                                                        </p>
                                                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                                                            Add activities to build your interactive learning experience
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                            <Button
                                                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-none"
                                                onClick={() => {
                                                    setPreviewOpen(false);
                                                    handleViewActivities(selectedCollection.id);
                                                }}
                                            >
                                                <BookOpen className="mr-2 h-4 w-4" />
                                                View Activities
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="flex-1 rounded-none"
                                                onClick={() => {
                                                    setPreviewOpen(false);
                                                    handleEditCollection(selectedCollection.id);
                                                }}
                                            >
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Collection
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );

}
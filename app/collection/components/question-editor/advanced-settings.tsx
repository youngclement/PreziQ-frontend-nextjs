"use client";

import React from "react";
import { Settings, Trophy, MessageSquare, Palette, Megaphone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetFooter,
    SheetHeader,
    SheetTitle,
    SheetTrigger
} from "@/components/ui/sheet";

interface AdvancedSettingsProps {
    defaultPoints?: string;
    defaultLayout?: string;
}

export function AdvancedSettings({
    defaultPoints = "1",
    defaultLayout = "grid"
}: AdvancedSettingsProps) {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Settings className="mr-2 h-4 w-4" /> Advanced Settings
                </Button>
            </SheetTrigger>
            <SheetContent className="w-full max-w-md sm:max-w-lg max-h-[100vh] overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Advanced Question Settings</SheetTitle>
                    <SheetDescription>
                        Configure additional settings for this question to customize the experience.
                    </SheetDescription>
                </SheetHeader>
                <div className="py-6 space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center">
                            <Trophy className="h-4 w-4 mr-2 text-amber-500" />
                            <Label htmlFor="points" className="text-base font-medium">Points & Scoring</Label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="points" className="text-sm">Points</Label>
                                <Input
                                    id="points"
                                    type="number"
                                    defaultValue={defaultPoints}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="time-bonus" className="text-sm">Time Bonus</Label>
                                <div className="flex items-center space-x-2 h-10">
                                    <Switch id="time-bonus" />
                                    <Label htmlFor="time-bonus" className="text-sm text-muted-foreground">Enable</Label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center">
                            <MessageSquare className="h-4 w-4 mr-2 text-blue-500" />
                            <Label className="text-base font-medium">Feedback</Label>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-sm">Correct Answer Feedback</Label>
                                <Textarea
                                    placeholder="Great job! You got it right."
                                    rows={2}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm">Incorrect Answer Feedback</Label>
                                <Textarea
                                    placeholder="Not quite. Try again!"
                                    rows={2}
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="show-explanation" defaultChecked />
                                <Label htmlFor="show-explanation" className="text-sm">Show explanation after answering</Label>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center">
                            <Palette className="h-4 w-4 mr-2 text-purple-500" />
                            <Label className="text-base font-medium">Appearance</Label>
                        </div>
                        <div className="space-y-2">
                            <Label>Question Layout</Label>
                            <RadioGroup defaultValue={defaultLayout}>
                                <div className="flex items-center space-x-2 py-1">
                                    <RadioGroupItem value="grid" id="grid" />
                                    <Label htmlFor="grid">Grid (2x2)</Label>
                                </div>
                                <div className="flex items-center space-x-2 py-1">
                                    <RadioGroupItem value="list" id="list" />
                                    <Label htmlFor="list">List</Label>
                                </div>
                                <div className="flex items-center space-x-2 py-1">
                                    <RadioGroupItem value="cards" id="cards" />
                                    <Label htmlFor="cards">Cards</Label>
                                </div>
                            </RadioGroup>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Switch id="shuffle-options" defaultChecked />
                            <Label htmlFor="shuffle-options" className="text-sm">Shuffle answer options</Label>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                        <div className="flex items-center">
                            <Megaphone className="h-4 w-4 mr-2 text-red-500" />
                            <Label className="text-base font-medium">Media & Audio</Label>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-2">
                                <Label className="text-sm">Audio URL (played during question)</Label>
                                <Input placeholder="https://example.com/audio.mp3" />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="read-aloud" />
                                <Label htmlFor="read-aloud" className="text-sm">Read question aloud</Label>
                            </div>
                        </div>
                    </div>
                </div>
                <SheetFooter>
                    <SheetClose asChild>
                        <Button variant="outline">Cancel</Button>
                    </SheetClose>
                    <SheetClose asChild>
                        <Button>Save Settings</Button>
                    </SheetClose>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
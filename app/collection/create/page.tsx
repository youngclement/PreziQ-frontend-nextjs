"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Save, ImagePlus, Sparkles, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CollectionFormValues, collectionSchema } from "@/lib/schemas/collection-schema";

export default function CreateCollectionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const form = useForm<CollectionFormValues>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      title: "",
      description: "",
      coverImage: "",
      is_published: false,
    },
  });

  // Xử lý khi chọn file ảnh
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Kiểm tra định dạng file
      if (!file.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive",
        });
        return;
      }

      // Kiểm tra kích thước file (ví dụ: giới hạn 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setImagePreview(result);
        form.setValue("coverImage", result); // Lưu data URL vào form
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImagePreview = (url: string) => {
    if (url && url.startsWith("http")) {
      setImagePreview(url);
    } else if (!url.startsWith("data:")) {
      setImagePreview(null);
    }
  };

  const onSubmit = async (data: CollectionFormValues) => {
    try {
      toast({
        title: "Creating collection...",
        description: "Please wait while we create your collection.",
      });
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const newCollection = { id: `col-${Date.now()}`, ...data };
      console.log("Created new collection:", newCollection);
      toast({
        title: "Collection created!",
        description: "Your collection has been created successfully.",
      });
      router.push("/collections");
    } catch (error) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error creating collection",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/collections")}
            className="hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">
              Create New Collection
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Build an amazing collection for your audience
            </p>
          </div>
        </div>

        <Card className="w-full shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <div className="flex flex-col md:flex-row">
                {/* Left Column - Form Fields */}
                <div className="flex-1 p-6">
                  <div className="space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Title
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter collection title"
                              className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                            Keep it short and memorable
                          </FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your collection"
                              className="min-h-[150px] border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md resize-y"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                            What makes this collection special?
                          </FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="is_published"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-md border border-gray-200 dark:border-gray-700/50">
                          <div className="space-y-1">
                            <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              Publish Collection
                            </FormLabel>
                            <FormDescription className="text-xs text-gray-500 dark:text-gray-400">
                              Make it visible to everyone
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className="data-[state=checked]:bg-indigo-600"
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* Tips Section */}
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-md border border-indigo-200 dark:border-indigo-900/50">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                          Pro Tips
                        </h3>
                      </div>
                      <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 ml-6 list-disc">
                        <li>Choose a title that grabs attention</li>
                        <li>Keep descriptions clear and engaging</li>
                        <li>Use high-quality, relevant images</li>
                        <li>Publish only when ready for your audience</li>
                      </ul>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-between mt-8">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-md border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => router.push("/collections")}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-md bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white transition-colors"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      Create Collection
                    </Button>
                  </div>
                </div>

                {/* Right Column - Image Upload */}
                <div className="md:w-[40%] bg-gray-50 dark:bg-gray-900/30 p-6 flex flex-col">
                  <div className="flex-1">


                    <FormField
                      control={form.control}
                      name="coverImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Cover Image
                          </FormLabel>
                          <div className="space-y-4">
                            <div className="flex flex-col gap-4">
                              {/* Input URL */}
                              <FormControl>
                                <Input
                                  placeholder="Paste image URL (e.g., https://example.com/image.jpg)"
                                  className="border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 rounded-md"
                                  {...field}
                                  onChange={(e) => {
                                    field.onChange(e);
                                    handleImagePreview(e.target.value);
                                  }}
                                />
                              </FormControl>

                              {/* Upload Button */}
                              <div className="relative">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  className="hidden"
                                  id="image-upload"
                                  onChange={handleFileChange}
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  className="w-full"
                                  onClick={() => document.getElementById("image-upload")?.click()}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Image
                                </Button>
                              </div>
                            </div>

                            {/* Image Preview */}
                            <div className="relative rounded-md overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 aspect-video">
                              {imagePreview ? (
                                <img
                                  src={imagePreview}
                                  alt="Preview"
                                  className="w-full h-full object-cover transition-opacity hover:opacity-90"
                                  onError={() => setImagePreview(null)}
                                />
                              ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 p-4">
                                  <ImagePlus className="h-12 w-12 mb-3" />
                                  <span className="text-sm text-center">Image Preview</span>
                                  <span className="text-xs mt-1 text-center">Recommended: 1200x630px</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <FormDescription className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                            Use a captivating image that represents your collection (max 5MB)
                          </FormDescription>
                          <FormMessage className="text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>
            </form>
          </Form>
        </Card>
      </div>
    </div>
  );
}
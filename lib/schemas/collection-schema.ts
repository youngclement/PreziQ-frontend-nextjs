import { z } from "zod";

export const collectionSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters" })
    .max(100, { message: "Title must be less than 100 characters" }),
  description: z
    .string()
    .min(10, { message: "Description must be at least 10 characters" })
    .max(500, { message: "Description must be less than 500 characters" }),
  coverImage: z
    .string()
    .url({ message: "Please enter a valid URL" })
    .nonempty({ message: "Cover image is required" }),
  is_published: z.boolean().default(false),
});

export type CollectionFormValues = z.infer<typeof collectionSchema>;

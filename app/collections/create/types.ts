import { z } from "zod";

const VALID_TOPICS = [
  "ART",
  "SCIENCE",
  "TECHNOLOGY",
  "HISTORY",
  "LITERATURE",
  "ENTERTAINMENT",
  "SPORTS",
  "GEOGRAPHY",
  "HEALTH",
  "EDUCATION",
  "NATURE",
  "CULTURE",
  "BUSINESS",
  "PHILOSOPHY",
  "FOOD",
  "TRIVIA",
] as const;

export const collectionSchema = z.object({
  title: z
    .string()
    .min(3, { message: "Tiêu đề phải có ít nhất 3 ký tự" })
    .max(100, { message: "Tiêu đề không được vượt quá 100 ký tự" }),
  description: z
    .string()
    .min(10, { message: "Mô tả phải có ít nhất 10 ký tự" })
    .max(500, { message: "Mô tả không được vượt quá 500 ký tự" }),
  coverImage: z
    .string()
    .url({ message: "Vui lòng nhập URL hợp lệ" })
    .nonempty({ message: "Ảnh bìa là bắt buộc" }),
  isPublished: z.boolean().default(false),
  defaultBackgroundMusic: z.string().optional(),
  topic: z.enum(VALID_TOPICS, {
    errorMap: () => ({ message: "Vui lòng chọn một chủ đề hợp lệ" }),
  }),
});

export type CollectionFormValues = z.infer<typeof collectionSchema>;
export type TopicType = (typeof VALID_TOPICS)[number];

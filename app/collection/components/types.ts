export interface SlideItem {
  id: string;
  title: string;
  content: any[];
  background?: string;
  backgroundImage?: string;
}
export interface ContentItem {
  id: string;
  type: "quiz" | "slide";
  content: QuizQuestion | SlideItem;
  order: number; // for explicit ordering
}
export interface Activity {
  id: string;
  title: string;
  collection_id: string;
  description: string;
  is_published: boolean;
  activity_type_id: string;
}

export interface QuizQuestion {
  correct_answer_text: string;
  id?: string;
  activity_id: string;
  question_text: string;
  question_type: string; // Now includes "slide" type
  options: QuizOption[];
  slide_content?: string; // New field for slide content (rich text or markdown)
  slide_image?: string; // Optional image for slides
}

export interface QuizOption {
  id?: string;
  quiz_question_id?: string;
  option_text: string;
  is_correct: boolean;
  display_order: number;
}

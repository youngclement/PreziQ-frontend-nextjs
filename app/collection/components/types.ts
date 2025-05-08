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

export interface QuizOption {
  option_text: string;
  is_correct: boolean;
  display_order: number;
  explanation?: string;
}

export interface QuizQuestion {
  id: string;
  activity_id: string;
  question_text: string;
  question_type:
    | "multiple_choice"
    | "multiple_response"
    | "true_false"
    | "text_answer"
    | "slide"
    | "info_slide"
    | "location"
    | "reorder";
  correct_answer_text?: string;
  options: QuizOption[];
  explanation?: string;
  time_limit_seconds?: number;
  points?: number;
  slide_content?: string; // For slide-type questions
  slide_image?: string; // For slide images
  location_data?: {
    lat: number;
    lng: number;
    radius: number;
    hint?: string;
  };
}

// Define API responses
export interface Activity {
  id: string;
  title: string;
  collection_id: string;
  description: string;
  is_published: boolean;
  activity_type_id: string;
  backgroundColor?: string;
  backgroundImage?: string;
  customBackgroundMusic?: string;
  orderIndex?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  quiz?: any; // The original quiz data from the API
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  activities: Activity[];
}

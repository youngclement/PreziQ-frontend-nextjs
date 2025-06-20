import { QuizMatchingPairAnswer } from '@/api-client/activities-api';

export interface SlideItem {
  id: string;
  title: string;
  content: any[];
  background?: string;
  backgroundImage?: string;
}

export interface ContentItem {
  id: string;
  type: 'quiz' | 'slide';
  content: QuizQuestion | SlideItem;
  order: number; // for explicit ordering
}

// Updated QuizOption to handle both traditional quiz options and matching pair items
export interface QuizOption {
  id?: string;
  quiz_question_id?: string;
  option_text?: string; // For traditional quiz options
  content?: string; // For matching pair items
  is_correct?: boolean; // For traditional quiz options
  display_order: number;
  explanation?: string;
  isLeftColumn?: boolean; // For matching pair items
  quizMatchingPairItemId?: string; // For matching pair items
}

export interface QuizQuestion {
  id: string;
  activity_id: string;
  question_text: string;
  question_type:
    | 'multiple_choice'
    | 'multiple_response'
    | 'true_false'
    | 'text_answer'
    | 'slide'
    | 'info_slide'
    | 'location'
    | 'reorder'
    | 'matching_pair';
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
 
    pointType?: string;
    quizLocationAnswers?: Array<{
      quizLocationAnswerId?: string;
      longitude: number;
      latitude: number;
      radius: number;
    }>;
  };
  matching_data?: QuizMatchingPairAnswer;
  // Add new fields to match the API response
  quizId?: string;
  pointType?: 'STANDARD' | 'NO_POINTS' | 'DOUBLE_POINTS';
  quizAnswers?: any[];
  quizLocationAnswers?: any[];
  quizMatchingPairAnswer?: QuizMatchingPairAnswer;
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
  quiz?: any;
  slide?: any; // The original quiz data from the API
  // Add new fields to match the API response
  activityId?: string;
  activityType?: string;
  isPublished?: boolean;
}

export interface Collection {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  activities: Activity[];
}

// Add new interfaces to match the API response structure
export interface QuizMatchingPairItemResponse {
  quizMatchingPairItemId: string;
  content: string;
  isLeftColumn: boolean;
  displayOrder: number;
}

export interface QuizMatchingPairConnectionResponse {
  quizMatchingPairConnectionId: string;
  leftItem: QuizMatchingPairItemResponse;
  rightItem: QuizMatchingPairItemResponse;
}

export interface QuizMatchingPairAnswerResponse {
  quizMatchingPairAnswerId: string;
  leftColumnName: string;
  rightColumnName: string;
  items: QuizMatchingPairItemResponse[];
  connections: QuizMatchingPairConnectionResponse[];
}

export interface QuizResponse {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  quizId: string;
  questionText: string;
  timeLimitSeconds: number;
  pointType: 'STANDARD' | 'NO_POINTS' | 'DOUBLE_POINTS';
  quizAnswers: any[];
  quizLocationAnswers: any[];
  quizMatchingPairAnswer?: QuizMatchingPairAnswerResponse;
}

export interface ActivityDetailResponse {
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  activityId: string;
  activityType: string;
  title: string;
  description: string;
  isPublished: boolean;
  orderIndex: number;
  backgroundColor?: string;
  backgroundImage?: string;
  quiz?: QuizResponse;
}

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
  question_type: string;
  options: QuizOption[];
}

export interface QuizOption {
  id?: string;
  quiz_question_id?: string;
  option_text: string;
  is_correct: boolean;
  display_order: number;
}

import { Activity, QuizQuestion } from "./types";

export const MOCK_ACTIVITIES: Activity[] = [
  {
    id: "act1",
    collection_id: "1",
    title: "Basic Arithmetic Quiz",
    description:
      "Test your knowledge of addition, subtraction, multiplication, and division",
    is_published: true,
    activity_type_id: "quiz",
  },
  {
    id: "act2",
    collection_id: "1",
    title: "Algebra Concepts",
    description: "Introduction to algebraic expressions and equations",
    is_published: false,
    activity_type_id: "quiz",
  },
  {
    id: "act3",
    collection_id: "2",
    title: "Biology Basics",
    description: "Fundamentals of cell biology and genetics",
    is_published: true,
    activity_type_id: "quiz",
  },
];

export const MOCK_QUESTIONS: Record<string, QuizQuestion[]> = {
  act1: [
    {
      id: "q1",
      activity_id: "act1",
      question_text: "What is 2 + 2?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o1",
          quiz_question_id: "q1",
          option_text: "3",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o2",
          quiz_question_id: "q1",
          option_text: "4",
          is_correct: true,
          display_order: 1,
        },
        {
          id: "o3",
          quiz_question_id: "q1",
          option_text: "5",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o4",
          quiz_question_id: "q1",
          option_text: "22",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
    {
      id: "q2",
      activity_id: "act1",
      question_text: "What is 5 × 3?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o5",
          quiz_question_id: "q2",
          option_text: "8",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o6",
          quiz_question_id: "q2",
          option_text: "15",
          is_correct: true,
          display_order: 1,
        },
        {
          id: "o7",
          quiz_question_id: "q2",
          option_text: "53",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o8",
          quiz_question_id: "q2",
          option_text: "35",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],
  act2: [
    {
      id: "q3",
      activity_id: "act2",
      question_text: "Solve for x: x + 5 = 10",
      question_type: "multiple_choice",
      options: [
        {
          id: "o9",
          quiz_question_id: "q3",
          option_text: "5",
          is_correct: true,
          display_order: 0,
        },
        {
          id: "o10",
          quiz_question_id: "q3",
          option_text: "15",
          is_correct: false,
          display_order: 1,
        },
        {
          id: "o11",
          quiz_question_id: "q3",
          option_text: "10",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o12",
          quiz_question_id: "q3",
          option_text: "-5",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],
  act3: [
    {
      id: "q4",
      activity_id: "act3",
      question_text: "Which is not a part of a cell?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o13",
          quiz_question_id: "q4",
          option_text: "Nucleus",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o14",
          quiz_question_id: "q4",
          option_text: "Mitochondria",
          is_correct: false,
          display_order: 1,
        },
        {
          id: "o15",
          quiz_question_id: "q4",
          option_text: "Keyboard",
          is_correct: true,
          display_order: 2,
        },
        {
          id: "o16",
          quiz_question_id: "q4",
          option_text: "Cell membrane",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],
};

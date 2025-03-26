import { Activity, QuizQuestion } from "./types";

export const MOCK_COLLECTIONS = [
  {
    id: "1",
    title: "Mathematics Fundamentals",
    description:
      "A collection of essential math concepts and quizzes for beginners",
    is_published: true,
    coverImage:
      "https://quiz-questions.uk/wp-content/uploads/2022/02/science-quiz.png",
  },
  {
    id: "2",
    title: "Advanced Physics",
    description:
      "Explore complex physics topics with interactive quizzes and activities",
    is_published: true,
    coverImage:
      "https://quiz-questions.uk/wp-content/uploads/2022/02/science-quiz.png",
  },
  {
    id: "3",
    title: "English Grammar",
    description:
      "Improve your English grammar skills with these comprehensive exercises",
    is_published: false,
    coverImage:
      "https://quiz-questions.uk/wp-content/uploads/2022/02/science-quiz.png",
  },
  {
    id: "4",
    title: "World History",
    description:
      "Journey through time with these engaging history quizzes and activities",
    is_published: true,
    coverImage:
      "https://quiz-questions.uk/wp-content/uploads/2022/02/science-quiz.png",
  },
  {
    id: "5",
    title: "Computer Science Basics",
    description: "Learn the fundamentals of programming and computer science",
    is_published: false,
    coverImage:
      "https://quiz-questions.uk/wp-content/uploads/2022/02/science-quiz.png",
  },
  {
    id: "6",
    title: "Biology Essentials",
    description:
      "Explore the living world with these comprehensive biology activities",
    is_published: true,
    coverImage:
      "https://quiz-questions.uk/wp-content/uploads/2022/02/science-quiz.png",
  },
];

export const MOCK_ACTIVITIES: Activity[] = [
  // Mathematics activities
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
    collection_id: "1",
    title: "Geometry Basics",
    description: "Understand shapes, angles, and spatial relationships",
    is_published: true,
    activity_type_id: "quiz",
  },

  // Physics activities
  {
    id: "act4",
    collection_id: "2",
    title: "Mechanics Fundamentals",
    description: "Learn about forces, motion, and energy",
    is_published: true,
    activity_type_id: "quiz",
  },
  {
    id: "act5",
    collection_id: "2",
    title: "Quantum Physics",
    description: "Explore the fascinating world of quantum mechanics",
    is_published: true,
    activity_type_id: "quiz",
  },

  // English activities
  {
    id: "act6",
    collection_id: "3",
    title: "Parts of Speech",
    description: "Learn to identify nouns, verbs, adjectives, and more",
    is_published: true,
    activity_type_id: "quiz",
  },
  {
    id: "act7",
    collection_id: "3",
    title: "Punctuation Rules",
    description: "Master the correct use of commas, periods, and other marks",
    is_published: false,
    activity_type_id: "quiz",
  },

  // History activities
  {
    id: "act8",
    collection_id: "4",
    title: "Ancient Civilizations",
    description: "Explore the earliest human societies and their achievements",
    is_published: true,
    activity_type_id: "quiz",
  },
  {
    id: "act9",
    collection_id: "4",
    title: "World Wars",
    description:
      "Test your knowledge of the major conflicts of the 20th century",
    is_published: true,
    activity_type_id: "quiz",
  },

  // Computer Science activities
  {
    id: "act10",
    collection_id: "5",
    title: "Programming Basics",
    description: "Introduction to coding concepts and principles",
    is_published: true,
    activity_type_id: "quiz",
  },
  {
    id: "act11",
    collection_id: "5",
    title: "Data Structures",
    description: "Learn about arrays, linked lists, trees, and more",
    is_published: false,
    activity_type_id: "quiz",
  },

  // Biology activities
  {
    id: "act12",
    collection_id: "6",
    title: "Cell Biology",
    description: "Explore the structure and function of cells",
    is_published: true,
    activity_type_id: "quiz",
  },
  {
    id: "act13",
    collection_id: "6",
    title: "Genetics",
    description: "Learn about DNA, inheritance, and genetic disorders",
    is_published: true,
    activity_type_id: "quiz",
  },
];

export const MOCK_QUESTIONS: Record<string, QuizQuestion[]> = {
  // Basic Arithmetic Quiz questions
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

  // Algebra Concepts questions
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

  // Geometry Basics questions
  act3: [
    {
      id: "q4",
      activity_id: "act3",
      question_text: "What is the sum of angles in a triangle?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o13",
          quiz_question_id: "q4",
          option_text: "90 degrees",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o14",
          quiz_question_id: "q4",
          option_text: "180 degrees",
          is_correct: true,
          display_order: 1,
        },
        {
          id: "o15",
          quiz_question_id: "q4",
          option_text: "270 degrees",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o16",
          quiz_question_id: "q4",
          option_text: "360 degrees",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],

  // Mechanics Fundamentals questions
  act4: [
    {
      id: "q5",
      activity_id: "act4",
      question_text: "What is Newton's First Law about?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o17",
          quiz_question_id: "q5",
          option_text: "Gravity",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o18",
          quiz_question_id: "q5",
          option_text: "Inertia",
          is_correct: true,
          display_order: 1,
        },
        {
          id: "o19",
          quiz_question_id: "q5",
          option_text: "Acceleration",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o20",
          quiz_question_id: "q5",
          option_text: "Magnetism",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],

  // Quantum Physics questions
  act5: [
    {
      id: "q6",
      activity_id: "act5",
      question_text: "What is Heisenberg's Uncertainty Principle about?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o21",
          quiz_question_id: "q6",
          option_text:
            "You cannot know both the position and momentum of a particle with certainty",
          is_correct: true,
          display_order: 0,
        },
        {
          id: "o22",
          quiz_question_id: "q6",
          option_text: "Light behaves as both a wave and a particle",
          is_correct: false,
          display_order: 1,
        },
        {
          id: "o23",
          quiz_question_id: "q6",
          option_text: "Energy can neither be created nor destroyed",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o24",
          quiz_question_id: "q6",
          option_text: "Time slows down near massive objects",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],

  // Parts of Speech questions
  act6: [
    {
      id: "q7",
      activity_id: "act6",
      question_text: "Which of the following is a verb?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o25",
          quiz_question_id: "q7",
          option_text: "Beautiful",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o26",
          quiz_question_id: "q7",
          option_text: "Run",
          is_correct: true,
          display_order: 1,
        },
        {
          id: "o27",
          quiz_question_id: "q7",
          option_text: "Quickly",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o28",
          quiz_question_id: "q7",
          option_text: "Book",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],

  // Add at least one question for each remaining activity
  act7: [
    {
      id: "q8",
      activity_id: "act7",
      question_text:
        "Where should a comma be placed in this sentence: 'After eating the dog went for a walk'?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o29",
          quiz_question_id: "q8",
          option_text: "After 'eating'",
          is_correct: true,
          display_order: 0,
        },
        {
          id: "o30",
          quiz_question_id: "q8",
          option_text: "After 'dog'",
          is_correct: false,
          display_order: 1,
        },
        {
          id: "o31",
          quiz_question_id: "q8",
          option_text: "After 'went'",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o32",
          quiz_question_id: "q8",
          option_text: "No comma needed",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],

  act8: [
    {
      id: "q9",
      activity_id: "act8",
      question_text: "Which ancient civilization built the pyramids of Giza?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o33",
          quiz_question_id: "q9",
          option_text: "Romans",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o34",
          quiz_question_id: "q9",
          option_text: "Greeks",
          is_correct: false,
          display_order: 1,
        },
        {
          id: "o35",
          quiz_question_id: "q9",
          option_text: "Egyptians",
          is_correct: true,
          display_order: 2,
        },
        {
          id: "o36",
          quiz_question_id: "q9",
          option_text: "Mayans",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],

  act9: [
    {
      id: "q10",
      activity_id: "act9",
      question_text: "When did World War II end?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o37",
          quiz_question_id: "q10",
          option_text: "1939",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o38",
          quiz_question_id: "q10",
          option_text: "1945",
          is_correct: true,
          display_order: 1,
        },
        {
          id: "o39",
          quiz_question_id: "q10",
          option_text: "1950",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o40",
          quiz_question_id: "q10",
          option_text: "1918",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],

  act10: [
    {
      id: "q11",
      activity_id: "act10",
      question_text: "Which of the following is a programming language?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o41",
          quiz_question_id: "q11",
          option_text: "HTML",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o42",
          quiz_question_id: "q11",
          option_text: "Python",
          is_correct: true,
          display_order: 1,
        },
        {
          id: "o43",
          quiz_question_id: "q11",
          option_text: "HTTP",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o44",
          quiz_question_id: "q11",
          option_text: "FTP",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],

  act11: [
    {
      id: "q12",
      activity_id: "act11",
      question_text: "Which data structure uses LIFO (Last In First Out)?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o45",
          quiz_question_id: "q12",
          option_text: "Queue",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o46",
          quiz_question_id: "q12",
          option_text: "Stack",
          is_correct: true,
          display_order: 1,
        },
        {
          id: "o47",
          quiz_question_id: "q12",
          option_text: "Linked List",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o48",
          quiz_question_id: "q12",
          option_text: "Binary Tree",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],

  act12: [
    {
      id: "q13",
      activity_id: "act12",
      question_text: "Which is not a part of a cell?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o49",
          quiz_question_id: "q13",
          option_text: "Nucleus",
          is_correct: false,
          display_order: 0,
        },
        {
          id: "o50",
          quiz_question_id: "q13",
          option_text: "Mitochondria",
          is_correct: false,
          display_order: 1,
        },
        {
          id: "o51",
          quiz_question_id: "q13",
          option_text: "Keyboard",
          is_correct: true,
          display_order: 2,
        },
        {
          id: "o52",
          quiz_question_id: "q13",
          option_text: "Cell membrane",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],

  act13: [
    {
      id: "q14",
      activity_id: "act13",
      question_text: "What is DNA?",
      question_type: "multiple_choice",
      options: [
        {
          id: "o53",
          quiz_question_id: "q14",
          option_text: "Deoxyribonucleic acid",
          is_correct: true,
          display_order: 0,
        },
        {
          id: "o54",
          quiz_question_id: "q14",
          option_text: "Digital network access",
          is_correct: false,
          display_order: 1,
        },
        {
          id: "o55",
          quiz_question_id: "q14",
          option_text: "Dynamic network algorithm",
          is_correct: false,
          display_order: 2,
        },
        {
          id: "o56",
          quiz_question_id: "q14",
          option_text: "Dual nuclear assembly",
          is_correct: false,
          display_order: 3,
        },
      ],
      correct_answer_text: "",
    },
  ],
};

import type { QuizQuestion } from "../types";

export const MOCK_MATCHING_PAIR_QUESTION: QuizQuestion = {
  id: "1",
  activity_id: "1",
  question_type: "matching_pair",
  question_text:
    "Nối các thủ đô với quốc gia tương ứng (một thủ đô có thể thuộc nhiều quốc gia)",
  options: [
    {
      id: "a1",
      option_text: "Hà Nội",
      type: "left",
      pair_id: "1",
      is_correct: true,
      display_order: 1,
    },
    {
      id: "a2",
      option_text: "Tokyo",
      type: "left",
      pair_id: "2",
      is_correct: true,
      display_order: 2,
    },
    {
      id: "a3",
      option_text: "Seoul",
      type: "left",
      pair_id: "3",
      is_correct: true,
      display_order: 3,
    },
    {
      id: "b1",
      option_text: "Việt Nam",
      type: "right",
      pair_id: "1",
      is_correct: true,
      display_order: 1,
    },
    {
      id: "b2",
      option_text: "Nhật Bản",
      type: "right",
      pair_id: "2",
      is_correct: true,
      display_order: 2,
    },
    {
      id: "b3",
      option_text: "Hàn Quốc",
      type: "right",
      pair_id: "3",
      is_correct: true,
      display_order: 3,
    },
  ],
};

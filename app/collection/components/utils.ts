/**
 * Maps API activity types to UI question types
 * @param activityType The API activity type
 * @returns The corresponding UI question type
 */
export function mapActivityTypeToQuestionType(
  activityType: string
):
  | "multiple_choice"
  | "multiple_response"
  | "true_false"
  | "text_answer"
  | "slide"
  | "reorder" {
  switch (activityType) {
    case "QUIZ_BUTTONS":
      return "multiple_choice";
    case "QUIZ_CHECKBOXES":
      return "multiple_response";
    case "QUIZ_TRUE_OR_FALSE":
      return "true_false";
    case "QUIZ_TYPE_ANSWER":
      return "text_answer";
    case "QUIZ_REORDER":
      return "reorder";
    case "INFO_SLIDE":
      return "slide";
    default:
      return "multiple_choice"; // Default to multiple choice if unknown
  }
}

/**
 * Maps UI question types to API activity types
 * @param questionType The UI question type
 * @returns The corresponding API activity type
 */
export function mapQuestionTypeToActivityType(questionType: string): string {
  switch (questionType) {
    case "multiple_choice":
      return "QUIZ_BUTTONS";
    case "multiple_response":
      return "QUIZ_CHECKBOXES";
    case "true_false":
      return "QUIZ_TRUE_OR_FALSE";
    case "text_answer":
      return "QUIZ_TYPE_ANSWER";
    case "reorder":
      return "QUIZ_REORDER";
    case "slide":
      return "INFO_SLIDE";
    default:
      return "QUIZ_BUTTONS"; // Default to QUIZ_BUTTONS if unknown
  }
}

/**
 * Get a color for a question based on its activity type
 * @param activityType The API activity type
 * @returns A Tailwind CSS gradient class
 */
export function getActivityTypeColor(activityType: string): string {
  switch (activityType) {
    case "QUIZ_BUTTONS":
      return "from-blue-500/10 to-indigo-500/10";
    case "QUIZ_CHECKBOXES":
      return "from-purple-500/10 to-pink-500/10";
    case "QUIZ_TRUE_OR_FALSE":
      return "from-green-500/10 to-teal-500/10";
    case "QUIZ_TYPE_ANSWER":
      return "from-orange-500/10 to-yellow-500/10";
    case "QUIZ_REORDER":
      return "from-red-500/10 to-pink-500/10";
    case "INFO_SLIDE":
      return "from-teal-500/10 to-emerald-500/10";
    default:
      return "from-gray-500/10 to-slate-500/10";
  }
}

/**
 * Format activity type for display
 * @param activityType The API activity type
 * @returns A user-friendly string
 */
export function formatActivityType(activityType: string): string {
  return activityType
    .replace("QUIZ_", "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

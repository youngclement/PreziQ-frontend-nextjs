/**
 * Utility functions for mapping between UI question types and API activity types
 */

/**
 * Maps UI question types to API activity types
 */
export const mapQuestionTypeToActivityType = (questionType: string): string => {
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
      return "QUIZ_BUTTONS";
  }
};

/**
 * Maps API activity types to UI question types
 */
export const mapActivityTypeToQuestionType = (activityType: string): string => {
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
      return "multiple_choice";
  }
};

/**
 * Maps question types to their display labels
 */
export const questionTypeLabels = {
  multiple_choice: "Multiple Choice",
  multiple_response: "Multiple Response",
  true_false: "True/False",
  text_answer: "Text Answer",
  reorder: "Reorder",
  slide: "Information Slide",
};

/**
 * Maps question types to their icon names
 */
export const questionTypeIcons = {
  multiple_choice: "ButtonsIcon",
  multiple_response: "CheckboxesIcon",
  true_false: "TrueFalseIcon",
  text_answer: "TypeAnswerIcon",
  reorder: "ReorderIcon",
  slide: "SlideIcon",
};

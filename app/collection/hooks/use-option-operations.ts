/**
 * Custom hook for managing question options
 */

import React, { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { activitiesApi } from "@/api-client";
import { Activity, QuizQuestion } from "../components/types";
import { reorderOptions } from "../utils/question-helpers";
import { debounce } from "lodash";

export function useOptionOperations(
  questions: QuizQuestion[],
  setQuestions: (questions: QuizQuestion[]) => void,
  activeQuestionIndex: number,
  activity: Activity | null,
  timeLimit: number
) {
  // Thêm hàm cập nhật API với debounce
  const debouncedUpdateAPI = useCallback(
    debounce(
      async (
        activityId: string,
        activityTypeId: string,
        question: QuizQuestion
      ) => {
        try {
          const options = question.options;

          switch (activityTypeId) {
            case "QUIZ_BUTTONS":
              await activitiesApi.updateButtonsQuiz(activityId, {
                type: "CHOICE",
                questionText: question.question_text,
                timeLimitSeconds: timeLimit,
                pointType: "STANDARD",
                answers: options.map((opt) => ({
                  answerText: opt.option_text,
                  isCorrect: opt.is_correct,
                  explanation: opt.explanation || "",
                })),
              });
              break;

            case "QUIZ_CHECKBOXES":
              await activitiesApi.updateCheckboxesQuiz(activityId, {
                type: "CHOICE",
                questionText: question.question_text,
                timeLimitSeconds: timeLimit,
                pointType: "STANDARD",
                answers: options.map((opt) => ({
                  answerText: opt.option_text,
                  isCorrect: opt.is_correct,
                  explanation: opt.explanation || "",
                })),
              });
              break;

            // Giữ nguyên các trường hợp khác...
          }
        } catch (error) {
          console.error(
            "Lỗi trong quá trình cập nhật API với debounce:",
            error
          );
        }
      },
      500 // Thời gian debounce 500ms
    ),
    [timeLimit]
  );

  /**
   * Xử lý thay đổi văn bản/giá trị tùy chọn
   */
  const handleOptionChange = async (
    questionIndex: number,
    optionIndex: number,
    field: string,
    value: any,
    isTyping: boolean = false
  ) => {
    if (!activity) return;

    // Tạo bản sao sâu để tránh vấn đề tham chiếu
    const updatedQuestions = JSON.parse(JSON.stringify(questions));
    const activeQuestion = updatedQuestions[questionIndex];

    // Bỏ qua cập nhật cho loại INFO_SLIDE vì chúng không có tùy chọn
    if (activity.activity_type_id === "INFO_SLIDE") {
      // Still update local state if needed
      setQuestions(updatedQuestions);
      return;
    }

    if (
      field === "correct_answer_text" ||
      (field === "option_text" &&
        activeQuestion.question_type === "text_answer")
    ) {
      // Cập nhật trực tiếp vào question object, không phải options
      activeQuestion.correct_answer_text = value;

      if (activeQuestion.options && activeQuestion.options.length > 0) {
        activeQuestion.options[0].option_text = value;
        activeQuestion.options[0].is_correct = true;
      }

      setQuestions(updatedQuestions);

      // Nếu đang typing thì không gọi API
      if (isTyping) {
        return;
      }

      // Gọi API cho text_answer question
      if (activity.activity_type_id === "QUIZ_TYPE_ANSWER") {
        try {
          await activitiesApi.updateTypeAnswerQuiz(activity.id, {
            type: "TYPE_ANSWER",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            correctAnswer: value,
          });
        } catch (error) {
          console.error(
            "Error updating TYPE_ANSWER correct_answer_text:",
            error
          );
        }
      }
      return;
    }

    // Kiểm tra xem mảng tùy chọn có tồn tại và có chỉ mục yêu cầu không
    if (
      !activeQuestion.options ||
      !Array.isArray(activeQuestion.options) ||
      activeQuestion.options.length <= optionIndex
    ) {
      console.error(`Tùy chọn tại chỉ mục ${optionIndex} không tồn tại`);
      return;
    }

    // Xử lý đặc biệt cho câu hỏi multiple_choice và true_false
    if (
      field === "is_correct" &&
      value === true &&
      (activeQuestion.question_type === "multiple_choice" ||
        activeQuestion.question_type === "true_false")
    ) {
      // Đầu tiên đặt tất cả các tùy chọn là không chính xác
      activeQuestion.options.forEach((opt: any) => {
        opt.is_correct = false;
      });
      // Sau đó chỉ đặt tùy chọn được chọn là chính xác
      activeQuestion.options[optionIndex][field] = value;
    } else {
      // Đối với các loại câu hỏi hoặc trường khác, chỉ cập nhật bình thường
      activeQuestion.options[optionIndex][field] = value;
    }

    // Cập nhật trạng thái cục bộ
    setQuestions(updatedQuestions);

    if (isTyping && field === "option_text") {
      return;
    }

    // // Sử dụng API call với debounce cho câu hỏi loại CHOICE
    // if (
    //   activity.activity_type_id === 'QUIZ_BUTTONS' ||
    //   activity.activity_type_id === 'QUIZ_CHECKBOXES'
    // ) {
    //   debouncedUpdateAPI(
    //     activity.id,
    //     activity.activity_type_id,
    //     activeQuestion
    //   );
    //   return;
    // }

    if (!isTyping) {
      // Đối với các loại câu hỏi khác, tiếp tục với các API call ngay lập tức
      try {
        const options = activeQuestion.options;

        // Xử lý cập nhật API dựa trên loại câu hỏi
        switch (activity.activity_type_id) {
          case "QUIZ_BUTTONS":
            await activitiesApi.updateButtonsQuiz(activity.id, {
              type: "CHOICE",
              questionText: activeQuestion.question_text,
              timeLimitSeconds: timeLimit,
              pointType: "STANDARD",
              answers: options.map((opt: any) => ({
                answerText: opt.option_text,
                isCorrect: opt.is_correct,
                explanation: opt.explanation || "",
              })),
            });
            break;

          case "QUIZ_CHECKBOXES":
            await activitiesApi.updateCheckboxesQuiz(activity.id, {
              type: "CHOICE",
              questionText: activeQuestion.question_text,
              timeLimitSeconds: timeLimit,
              pointType: "STANDARD",
              answers: options.map((opt: any) => ({
                answerText: opt.option_text,
                isCorrect: opt.is_correct,
                explanation: opt.explanation || "",
              })),
            });
            break;

          case "QUIZ_TRUE_OR_FALSE":
            const correctOption = options.find(
              (opt: { is_correct: boolean }) => opt.is_correct
            );
            await activitiesApi.updateTrueFalseQuiz(activity.id, {
              type: "TRUE_FALSE",
              questionText: activeQuestion.question_text,
              timeLimitSeconds: timeLimit,
              pointType: "STANDARD",
              correctAnswer:
                correctOption?.option_text.toLowerCase() === "true",
            });
            break;

          case "QUIZ_TYPE_ANSWER":
            // For text answer questions, use option_text as the correctAnswer
            const answerText =
              activeQuestion.options[0]?.option_text || "Answer";
            await activitiesApi.updateTypeAnswerQuiz(activity.id, {
              type: "TYPE_ANSWER",
              questionText: activeQuestion.question_text,
              timeLimitSeconds: timeLimit,
              pointType: "STANDARD",
              correctAnswer: answerText,
            });
            break;

          case "QUIZ_REORDER":
            // For reorder questions, update with the current order
            await activitiesApi.updateReorderQuiz(activity.id, {
              type: "REORDER",
              questionText: activeQuestion.question_text,
              timeLimitSeconds: timeLimit,
              pointType: "STANDARD",
              correctOrder: options.map(
                (opt: { option_text: any }) => opt.option_text
              ),
            });
            break;
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật văn bản câu trả lời:", error);
      }
    }
  };

  // Thêm đoạn dọn dẹp cho hàm debounced
  React.useEffect(() => {
    return () => {
      debouncedUpdateAPI.cancel();
    };
  }, [debouncedUpdateAPI]);

  /**
   * Handle reordering of options (specifically for reorder question type)
   */
  const handleReorderOptions = async (
    sourceIndex: number,
    destinationIndex: number
  ) => {
    if (!activity || activity.activity_type_id !== "QUIZ_REORDER") return;

    const updatedQuestions = [...questions];
    const activeQuestion = updatedQuestions[activeQuestionIndex];

    // Use the reorderOptions utility to get the updated options
    const reorderedOptions = reorderOptions(
      activeQuestion.options,
      sourceIndex,
      destinationIndex
    );

    // Update the question with the new options array
    updatedQuestions[activeQuestionIndex] = {
      ...activeQuestion,
      options: reorderedOptions,
    };

    // Update state
    setQuestions(updatedQuestions);

    try {
      const response = await activitiesApi.updateReorderQuiz(activity.id, {
        type: "REORDER",
        questionText: activeQuestion.question_text,
        timeLimitSeconds: timeLimit,
        pointType: "STANDARD",
        correctOrder: reorderedOptions.map((opt) => opt.option_text),
      });
    } catch (error) {
      console.error("Error updating reorder steps:", error);
    }
  };

  /**
   * Add a new option to the current question
   */
  const handleAddOption = async () => {
    if (!activity) return;

    const updatedQuestions = [...questions];
    const activeQuestion = updatedQuestions[activeQuestionIndex];

    // Don't allow more than 8 options
    if (activeQuestion.options.length >= 9) {
      return;
    }

    const newOptionIndex = activeQuestion.options.length;
    const newOption = {
      option_text: `Option ${newOptionIndex + 1}`,
      is_correct: false,
      display_order: newOptionIndex,
      explanation: "",
    };

    // Add the new option
    const updatedOptions = [...activeQuestion.options, newOption];
    updatedQuestions[activeQuestionIndex] = {
      ...activeQuestion,
      options: updatedOptions,
    };

    // Update state
    setQuestions(updatedQuestions);

    // Update API
    try {
      switch (activity.activity_type_id) {
        case "QUIZ_BUTTONS":
          await activitiesApi.updateButtonsQuiz(activity.id, {
            type: "CHOICE",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || "",
            })),
          });
          break;

        case "QUIZ_CHECKBOXES":
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: "CHOICE",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || "",
            })),
          });
          break;

        case "QUIZ_REORDER":
          await activitiesApi.updateReorderQuiz(activity.id, {
            type: "REORDER",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            correctOrder: updatedOptions.map((opt) => opt.option_text),
          });
          break;
      }
    } catch (error) {
      console.error("Error adding option:", error);
    }
  };

  /**
   * Delete an option from the current question
   */
  const handleDeleteOption = async (optionIndex: number) => {
    if (!activity) return;

    const updatedQuestions = [...questions];
    const activeQuestion = updatedQuestions[activeQuestionIndex];

    // Don't allow fewer than 2 options for multiple choice questions
    if (
      activeQuestion.options.length <= 2 &&
      (activeQuestion.question_type === "multiple_choice" ||
        activeQuestion.question_type === "multiple_response")
    ) {
      return;
    }

    // Remove the option
    const updatedOptions = activeQuestion.options.filter(
      (_, idx) => idx !== optionIndex
    );

    // Ensure at least one option is marked as correct for multiple choice
    if (
      activeQuestion.question_type === "multiple_choice" &&
      !updatedOptions.some((opt) => opt.is_correct)
    ) {
      updatedOptions[0] = { ...updatedOptions[0], is_correct: true };
    }

    // Update display order
    updatedOptions.forEach((opt, idx) => {
      updatedOptions[idx] = { ...opt, display_order: idx };
    });

    updatedQuestions[activeQuestionIndex] = {
      ...activeQuestion,
      options: updatedOptions,
    };

    // Update state
    setQuestions(updatedQuestions);

    // Update API
    try {
      switch (activity.activity_type_id) {
        case "QUIZ_BUTTONS":
          await activitiesApi.updateButtonsQuiz(activity.id, {
            type: "CHOICE",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || "",
            })),
          });
          break;

        case "QUIZ_CHECKBOXES":
          await activitiesApi.updateCheckboxesQuiz(activity.id, {
            type: "CHOICE",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            answers: updatedOptions.map((opt) => ({
              answerText: opt.option_text,
              isCorrect: opt.is_correct,
              explanation: opt.explanation || "",
            })),
          });
          break;

        case "QUIZ_REORDER":
          await activitiesApi.updateReorderQuiz(activity.id, {
            type: "REORDER",
            questionText: activeQuestion.question_text,
            timeLimitSeconds: timeLimit,
            pointType: "STANDARD",
            correctOrder: updatedOptions.map((opt) => opt.option_text),
          });
          break;
      }
    } catch (error) {
      console.error("Error deleting option:", error);
    }
  };

  /**
   * Update the correct answer text (for text answer questions)
   */
  const handleCorrectAnswerChange = async (value: string) => {
    if (!activity) return;

    // Create a deep copy of the questions array
    const updatedQuestions = JSON.parse(JSON.stringify(questions));

    // Update the correct_answer_text for the active question
    updatedQuestions[activeQuestionIndex].correct_answer_text = value;

    // Update the local state immediately
    setQuestions(updatedQuestions);

    try {
      // Call API to update the answer
      if (activity.activity_type_id === "QUIZ_TYPE_ANSWER") {
        const response = await activitiesApi.updateTypeAnswerQuiz(activity.id, {
          type: "TYPE_ANSWER",
          questionText: updatedQuestions[activeQuestionIndex].question_text,
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctAnswer: value,
        });
      }
    } catch (error) {
      console.error("Error updating correct answer:", error);
    }
  };

  /**
   * Update content of a reorder option
   */
  const updateReorderOptionContent = async (
    questionIndex: number,
    optionIndex: number,
    value: string,
    isTyping: boolean = false
  ) => {
    if (!activity || activity.activity_type_id !== "QUIZ_REORDER") return;

    // First update local state
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex].option_text = value;
    setQuestions(updatedQuestions);

    if (!isTyping) {
      try {
        const activeQuestion = updatedQuestions[questionIndex];

        await activitiesApi.updateReorderQuiz(activity.id, {
          type: "REORDER",
          questionText: activeQuestion.question_text,
          timeLimitSeconds: timeLimit,
          pointType: "STANDARD",
          correctOrder: activeQuestion.options.map((opt) => opt.option_text),
        });
      } catch (error) {
        console.error("Error updating reorder option:", error);
      }
    }
  };

  return {
    handleOptionChange,
    handleReorderOptions,
    handleAddOption,
    handleDeleteOption,
    handleCorrectAnswerChange,
    updateReorderOptionContent,
  };
}

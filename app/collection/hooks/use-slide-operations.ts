/**
 * Custom hook for managing slide operations
 */
import { useToast } from '@/hooks/use-toast';
import { activitiesApi } from '@/api-client';
import { Activity, QuizQuestion } from '../components/types';

export function useSlideOperations(
  questions: QuizQuestion[],
  setQuestions: (questions: QuizQuestion[]) => void,
  activeQuestionIndex: number,
  activity: Activity | null,
  timeLimit: number
) {
  const { toast } = useToast();

  /**
   * Handle slide content change for info slides
   */
  const handleSlideContentChange = async (value: string) => {
    if (!activity) return;

    // Update local state
    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex] = {
      ...updatedQuestions[activeQuestionIndex],
      slide_content: value,
    };
    setQuestions(updatedQuestions);

    // For now, API doesn't fully support separate slide content updates
    // We'll implement this when the API supports it
    try {
      // Update the activity with the new content
      await activitiesApi.updateActivity(activity.id, {
        description: value,
      });

      toast({
        title: 'Success',
        description: 'Slide content updated',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating slide content:', error);
      toast({
        title: 'Error',
        description: 'Failed to update slide content',
        variant: 'destructive',
      });
    }
  };

  /**
   * Handle slide image change for info slides
   */
  const handleSlideImageChange = async (value: string) => {
    if (!activity) return;

    // Update local state
    const updatedQuestions = [...questions];
    updatedQuestions[activeQuestionIndex] = {
      ...updatedQuestions[activeQuestionIndex],
      slide_image: value,
    };
    setQuestions(updatedQuestions);

    // For now, API doesn't fully support separate slide image updates
    // We'll implement this when the API supports it
    try {
      // Update the activity with the new image URL
      await activitiesApi.updateActivity(activity.id, {
        backgroundImage: value,
      });

      toast({
        title: 'Success',
        description: 'Slide image updated',
        duration: 2000,
      });
    } catch (error) {
      console.error('Error updating slide image:', error);
      toast({
        title: 'Error',
        description: 'Failed to update slide image',
        variant: 'destructive',
      });
    }
  };

  /**
   * Save all changes to the current activity
   */
  const handleSave = async () => {
    if (!activity) return;

    try {
      toast({
        title: 'Saving...',
        description: 'Saving your changes',
      });

      // Most changes are already saved incrementally, but we can update the activity title, etc.
      await activitiesApi.updateActivity(activity.id, {
        title: activity.title,
        description: activity.description,
        isPublished: activity.is_published,
      });

      toast({
        title: 'Success',
        description: 'All changes saved successfully',
      });
    } catch (error) {
      console.error('Error saving changes:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    }
  };

  return {
    handleSlideContentChange,
    handleSlideImageChange,
    handleSave,
  };
}

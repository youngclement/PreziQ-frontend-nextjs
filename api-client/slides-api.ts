import axiosClient from './axios-client';
import { SlideElementPayload } from '@/types/slideInterface';

export const slidesApi = {
  addSlidesElement(id: string, payload: SlideElementPayload) {
    return axiosClient.post(`/slides/${id}/elements`, payload);
  },
};

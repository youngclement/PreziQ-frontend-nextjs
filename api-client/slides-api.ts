import axiosClient from "./axios-client";
import { SlideElementPayload } from "@/types/slideInterface";

export const slidesApi = {
  addSlidesElement(id: string, payload: SlideElementPayload) {
    return axiosClient.post(`/slides/${id}/elements`, payload);
  },
  updateSlidesElement(
    slideId: string,
    elementId: string,
    payload: SlideElementPayload
  ) {
    return axiosClient.put(`/slides/${slideId}/elements/${elementId}`, payload);
  },
  deleteSlidesElement(slideId: string, elementId: string) {
    return axiosClient.delete(`/slides/${slideId}/elements/${elementId}`);
  },
};

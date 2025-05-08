import axios from "axios";

// Re-export the axiosClient from the main API client
import axiosClient from "@/api-client/axios-client";

export const axiosInstance = axiosClient;

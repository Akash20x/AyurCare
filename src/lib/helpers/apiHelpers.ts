import axios, { AxiosError } from "axios";

interface NormalizedError {
  message: string;
  status?: number;
  code?: string;
}  

export const handleAxiosError = (error: unknown, contextMessage?: string): NormalizedError => {
  let normalized: NormalizedError = { message: "An unknown error occurred" };

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ message?: string; error?: string; }>;
    
      const message =
      axiosError.response?.data?.error ||
      axiosError.response?.data?.message || 
      axiosError.message ||
      "An unexpected error occurred";

    normalized = {
      message,
      status: axiosError.response?.status,
      code: axiosError.code,
    };
  } else if (error instanceof Error) {
    normalized = { message: error.message };
  }

  return normalized;
};

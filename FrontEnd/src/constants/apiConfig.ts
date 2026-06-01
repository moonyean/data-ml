export const BASE_URL = "http://localhost:8000";

export const ENDPOINTS = {
  PREDICT: "/predict",
  CROP_REGIONS: (crop: string) => `/crop-regions/${crop}`,
  FERTILIZER:   (crop: string) => `/fertilizer/${crop}`,
} as const;

export const BASE_URL = "https://data-ml-be.onrender.com";

export const ENDPOINTS = {
  PREDICT: "/predict",
  CROP_REGIONS: (crop: string) => `/crop-regions/${crop}`,
  FERTILIZER:   (crop: string) => `/fertilizer/${crop}`,
} as const;

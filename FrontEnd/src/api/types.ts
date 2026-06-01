// ── /predict ─────────────────────────────────────────────────
export interface PredictRequest {
  ph:        number;
  rainfall:  number;
  N:         number;
  K?:        number;
}

export interface CropResult {
  crop:       string;
  confidence: number;
}

export interface PredictResponse {
  recommended_crop: string;
  confidence:       number;
  top3:             CropResult[];
}

// ── /fertilizer/{crop} ───────────────────────────────────────
export interface FertilizerDose {
  nitrogen:   number;
  phosphorus: number;
  potassium:  number;
}

export interface FertilizerResponse {
  crop_en:         string;
  crop_kr:         string;
  fstd_crop_code:  string;
  pre_fertilizer:  FertilizerDose;
  post_fertilizer: FertilizerDose;
  note?:           string;
}

// ── /crop-regions/{crop} ─────────────────────────────────────
export interface Region {
  region:            string;
  country:           string;
  reason:            string;
  climate:           string;
  soil_type:         string;
  growing_season:    string;
  avg_temperature_c: number;
  avg_rainfall_mm:   number;
  major_production:  string;
}

export interface IdealConditions {
  temperature_range: string;
  rainfall_range:    string;
  ph_range:          string;
  humidity_range:    string;
}

export interface CropRegionsResponse {
  crop:              string;
  crop_ko:           string;
  best_regions:      Region[];
  ideal_conditions:  IdealConditions;
  farming_tips:      string[];
  harvest_info:      string;
  source:            string;
}

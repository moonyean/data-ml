/**
 * 신뢰도(0~1)를 퍼센트 문자열로 변환
 * @example formatConfidence(0.9123) → "91.2%"
 */
export function formatConfidence(value: number, decimals = 1): string {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * 신뢰도 수치를 한국어 적합도 레이블로 변환
 */
export function getSuitabilityLabel(confidence: number): string {
  if (confidence >= 0.9) return "최적 (Excellent)";
  if (confidence >= 0.7) return "우수 (Good)";
  return "양호 (Fair)";
}

/**
 * 신뢰도 수치에 따른 Tailwind 색상 클래스 반환
 */
export function getSuitabilityColor(confidence: number): string {
  if (confidence >= 0.9) return "bg-green-100 text-green-800";
  if (confidence >= 0.7) return "bg-yellow-100 text-yellow-800";
  return "bg-gray-100 text-gray-700";
}

/**
 * 숫자에 단위를 붙여 표시
 * @example formatUnit(5, "kg/10a") → "5 kg/10a"
 */
export function formatUnit(value: number, unit: string): string {
  return `${value} ${unit}`;
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Sprout, MapPin, ArrowLeft, Sparkles, Leaf, FlaskConical, CloudRain, Thermometer,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

import { predictCrop, getCropRegions, getFertilizer } from "../../api";
import type { PredictResponse, CropRegionsResponse, FertilizerResponse } from "../../api";
import { CROP_EMOJI } from "../../constants";
import { resolveErrorMessage } from "../../handlers";
import { formatConfidence, getSuitabilityLabel, getSuitabilityColor } from "../../utils";

type LoadingStep = "predict" | "regions" | "done" | "error";

export function ResultsDashboard() {
  const navigate = useNavigate();

  const [step, setStep]       = useState<LoadingStep>("predict");
  const [errorMsg, setErrorMsg] = useState("");

  const [predict,    setPredict]    = useState<PredictResponse | null>(null);
  const [regions,    setRegions]    = useState<CropRegionsResponse | null>(null);
  const [fertilizer, setFertilizer] = useState<FertilizerResponse | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("farmData");
    if (!stored) { navigate("/input"); return; }

    const formData = JSON.parse(stored);

    (async () => {
      try {
        // 1. 작물 예측
        setStep("predict");
        const predictRes = await predictCrop(formData);
        setPredict(predictRes);

        // 2. 지역 정보 + 비료 정보 병렬 호출
        setStep("regions");
        const [regionsRes, fertilizerRes] = await Promise.all([
          getCropRegions(predictRes.recommended_crop),
          getFertilizer(predictRes.recommended_crop),
        ]);
        setRegions(regionsRes);
        setFertilizer(fertilizerRes);

        setStep("done");
      } catch (e) {
        setErrorMsg(resolveErrorMessage(e));
        setStep("error");
      }
    })();
  }, [navigate]);

  // ── 로딩 화면 ──────────────────────────────────────────────
  if (step !== "done" && step !== "error") {
    const messages: Record<LoadingStep, string> = {
      predict: "🤖 ML 모델이 최적 작물을 분석 중입니다...",
      regions: "🗺️ Gemini AI가 재배 지역 정보를 생성 중입니다...",
      done:  "",
      error: "",
    };
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-background">
        <div className="text-center space-y-4">
          <div className="text-5xl animate-bounce">🌱</div>
          <p className="text-lg font-medium text-green-700">{messages[step]}</p>
          <div className="flex justify-center gap-1 mt-2">
            {(["predict", "regions"] as LoadingStep[]).map((s) => (
              <div
                key={s}
                className={`h-2 w-8 rounded-full transition-all duration-500 ${
                  step === s ? "bg-green-600" : "bg-green-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── 에러 화면 ──────────────────────────────────────────────
  if (step === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold">API 연결 실패</h2>
          <p className="text-muted-foreground text-sm">{errorMsg}</p>
          <p className="text-xs text-muted-foreground">
            백엔드 서버(localhost:8000)가 실행 중인지 확인하세요.
          </p>
          <Button onClick={() => navigate("/input")} className="bg-green-600 hover:bg-green-700 text-white">
            다시 입력하기
          </Button>
        </div>
      </div>
    );
  }

  if (!predict || !regions) return null;

  const topCrop = predict.recommended_crop;
  const emoji   = CROP_EMOJI[topCrop] ?? "🌱";

  // 비료 차트 데이터
  const fertChartData = fertilizer
    ? [
        { name: "질소 (N)",  밑거름: fertilizer.pre_fertilizer.nitrogen,   웃거름: fertilizer.post_fertilizer.nitrogen },
        { name: "인산 (P)",  밑거름: fertilizer.pre_fertilizer.phosphorus, 웃거름: fertilizer.post_fertilizer.phosphorus },
        { name: "칼리 (K)",  밑거름: fertilizer.pre_fertilizer.potassium,  웃거름: fertilizer.post_fertilizer.potassium },
      ]
    : [];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" />
            <span className="text-xl font-semibold">Farmlink AI</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/input")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            다시 분석하기
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">

        {/* 결과 배너 */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-green-600 shrink-0" />
            <div>
              <h2 className="text-2xl font-bold text-green-900">
                AI 분석 완료: 최적 작물은{" "}
                <span className="text-green-600">{emoji} {regions.crop_ko}</span> 입니다
              </h2>
              <p className="text-sm text-green-700 mt-1">
                신뢰도 {formatConfidence(predict.confidence)} | Random Forest ML 모델 기반
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">

          {/* ── 좌측 컬럼 ───────────────────────────────────── */}
          <div className="space-y-6">

            {/* 추천 작물 카드 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-green-600" />
                  ML 기반 작물 처방 결과
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-6">
                  <div className="text-6xl mb-3">{emoji}</div>
                  <h3 className="text-3xl font-bold mb-1">{regions.crop_ko}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{topCrop}</p>
                  <Badge variant="secondary" className={`text-base px-4 py-1 ${getSuitabilityColor(predict.confidence)}`}>
                    {getSuitabilityLabel(predict.confidence)}
                  </Badge>
                </div>

                {/* 신뢰도 바 */}
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>종합 적합도</span>
                    <span className="font-medium">{formatConfidence(predict.confidence)}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all duration-1000"
                      style={{ width: `${predict.confidence * 100}%` }}
                    />
                  </div>
                </div>

                {/* Top 3 */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-3 text-sm">후보 작물 Top 3</h4>
                  <div className="space-y-2">
                    {predict.top3.map((c, i) => (
                      <div key={c.crop} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground w-4">{i + 1}</span>
                          <span>{CROP_EMOJI[c.crop] ?? "🌱"} {c.crop}</span>
                        </div>
                        <div className="flex items-center gap-2 w-32">
                          <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-green-500" style={{ width: `${c.confidence * 100}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {formatConfidence(c.confidence, 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 비료 처방 카드 */}
            {fertilizer ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FlaskConical className="h-5 w-5 text-blue-600" />
                    비료 표준사용량 처방
                    <Badge variant="outline" className="text-xs ml-1">
                      {fertilizer.crop_kr} · 코드 {fertilizer.fstd_crop_code}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {fertilizer.note && (
                    <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded p-2">
                      ⚠️ {fertilizer.note}
                    </p>
                  )}

                  <div className="grid grid-cols-4 text-sm font-medium text-center border-b pb-2">
                    <div />
                    <div>질소 (N)</div>
                    <div>인산 (P)</div>
                    <div>칼리 (K)</div>
                  </div>
                  {[
                    { label: "밑거름", data: fertilizer.pre_fertilizer },
                    { label: "웃거름", data: fertilizer.post_fertilizer },
                  ].map(({ label, data }) => (
                    <div key={label} className="grid grid-cols-4 text-sm text-center">
                      <div className="text-muted-foreground font-medium">{label}</div>
                      <div>{data.nitrogen} <span className="text-xs text-muted-foreground">kg/10a</span></div>
                      <div>{data.phosphorus} <span className="text-xs text-muted-foreground">kg/10a</span></div>
                      <div>{data.potassium} <span className="text-xs text-muted-foreground">kg/10a</span></div>
                    </div>
                  ))}

                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={fertChartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="밑거름" fill="#22c55e" />
                      <Bar dataKey="웃거름" fill="#86efac" />
                    </BarChart>
                  </ResponsiveContainer>
                  <p className="text-xs text-muted-foreground text-center">
                    출처: 국립농업과학원 비료 표준사용량 처방 (OpenAPI)
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-dashed">
                <CardContent className="pt-6 text-center text-muted-foreground text-sm">
                  <FlaskConical className="h-8 w-8 mx-auto mb-2 opacity-40" />
                  <p>국내 비료 표준사용량 데이터가 없는 작물입니다.</p>
                  <p className="text-xs mt-1">(열대성 작물 등은 국내 기준 미등록)</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── 우측 컬럼 ───────────────────────────────────── */}
          <div className="space-y-6">

            {/* 재배 최적 지역 */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-primary" />
                  Gemini AI 재배 최적 지역
                  {regions.source === "static_fallback" && (
                    <Badge variant="outline" className="text-xs">기본 데이터</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                {regions.best_regions.map((r, i) => (
                  <div key={i} className="border rounded-lg p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm">📍 {r.region}</span>
                      <Badge variant="secondary" className="text-xs">{r.climate}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{r.reason}</p>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pt-1">
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-3 w-3" />연평균 {r.avg_temperature_c}°C
                      </div>
                      <div className="flex items-center gap-1">
                        <CloudRain className="h-3 w-3" />연강수 {r.avg_rainfall_mm}mm
                      </div>
                      <div className="col-span-2">토양: {r.soil_type}</div>
                      <div className="col-span-2">재배 시기: {r.growing_season}</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 적정 재배 조건 + 영농 팁 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5 text-green-600" />
                  적정 재배 조건 &amp; 영농 팁
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    { label: "기온",     value: regions.ideal_conditions.temperature_range },
                    { label: "강수량",   value: regions.ideal_conditions.rainfall_range },
                    { label: "토양 pH", value: regions.ideal_conditions.ph_range },
                    { label: "습도",     value: regions.ideal_conditions.humidity_range },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-muted/50 rounded p-3">
                      <div className="text-muted-foreground text-xs">{label}</div>
                      <div className="font-medium mt-0.5">{value}</div>
                    </div>
                  ))}
                </div>

                <div className="bg-green-50 border border-green-200 rounded p-3 text-sm">
                  <span className="font-medium text-green-800">🌾 수확 정보</span>
                  <p className="text-green-700 mt-1 text-xs leading-relaxed">{regions.harvest_info}</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-medium">💡 영농 팁</h4>
                  <ul className="space-y-2">
                    {regions.farming_tips.map((tip, i) => (
                      <li key={i} className="text-xs text-muted-foreground flex gap-2">
                        <span className="text-green-600 shrink-0">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Sprout, MapPin, FileText, MessageSquare, ArrowLeft, Download, Sparkles } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface FarmData {
  pH: number;
  organicMatter: number;
  phosphorus: number;
  potassium: number;
}

interface CropRecommendation {
  name: string;
  matchRate: number;
  suitability: string;
  icon: string;
  distance: number;
}

interface NutrientDeficiency {
  name: string;
  current: number;
  optimal: number;
  deficit: number;
  unit: string;
}

export function ResultsDashboard() {
  const navigate = useNavigate();
  const [farmData, setFarmData] = useState<FarmData | null>(null);
  const [crop, setCrop] = useState<CropRecommendation | null>(null);
  const [deficiencies, setDeficiencies] = useState<NutrientDeficiency[]>([]);
  const [llmText, setLlmText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);

  // Standard crop requirements (based on Korean RDA standards)
  const cropStandards = {
    딸기: { pH: 5.8, om: 30, p: 450, k: 0.65 },
    사과: { pH: 6.0, om: 25, p: 350, k: 0.60 },
    벼: { pH: 6.5, om: 25, p: 300, k: 0.55 },
    배추: { pH: 6.5, om: 28, p: 400, k: 0.70 },
    토마토: { pH: 6.2, om: 32, p: 500, k: 0.75 },
  };

  useEffect(() => {
    const storedData = sessionStorage.getItem('farmData');
    if (!storedData) {
      navigate("/input");
      return;
    }

    const data: FarmData = JSON.parse(storedData);
    setFarmData(data);

    // Calculate Euclidean distance for each crop
    const distances = Object.entries(cropStandards).map(([cropName, standard]) => {
      const distance = Math.sqrt(
        Math.pow(data.pH - standard.pH, 2) +
        Math.pow((data.organicMatter - standard.om) / 10, 2) +
        Math.pow((data.phosphorus - standard.p) / 100, 2) +
        Math.pow((data.potassium - standard.k) * 10, 2)
      );
      return { cropName, distance };
    });

    // Find the crop with minimum distance
    const bestMatch = distances.reduce((min, curr) =>
      curr.distance < min.distance ? curr : min
    );

    const matchRate = Math.max(0, Math.min(100, 100 - (bestMatch.distance * 10)));

    const cropIcons: Record<string, string> = {
      딸기: "🍓",
      사과: "🍎",
      벼: "🌾",
      배추: "🥬",
      토마토: "🍅"
    };

    const recommendation: CropRecommendation = {
      name: bestMatch.cropName,
      matchRate: Math.round(matchRate * 10) / 10,
      suitability: matchRate >= 90 ? "최적 (Excellent)" : matchRate >= 75 ? "우수 (Good)" : "양호 (Fair)",
      icon: cropIcons[bestMatch.cropName] || "🌱",
      distance: bestMatch.distance
    };

    setCrop(recommendation);

    // Calculate nutrient deficiencies
    const standard = cropStandards[bestMatch.cropName as keyof typeof cropStandards];
    const deficits: NutrientDeficiency[] = [
      {
        name: "유기물",
        current: data.organicMatter,
        optimal: standard.om,
        deficit: ((data.organicMatter - standard.om) / standard.om) * 100,
        unit: "g/kg"
      },
      {
        name: "인산",
        current: data.phosphorus,
        optimal: standard.p,
        deficit: ((data.phosphorus - standard.p) / standard.p) * 100,
        unit: "mg/kg"
      },
      {
        name: "칼륨",
        current: data.potassium,
        optimal: standard.k,
        deficit: ((data.potassium - standard.k) / standard.k) * 100,
        unit: "cmol⁺/kg"
      }
    ];

    setDeficiencies(deficits);

    // Start typing animation after a short delay
    setTimeout(() => {
      setIsTyping(true);
    }, 500);
  }, [navigate]);

  const fullLlmResponse = farmData && crop ? `**✨ Gemini AI의 실시간 농업 처방 리포트**

입력하신 토양 성분을 분석한 결과, ${crop.name} 재배에 최적화된 토양 조건을 갖추고 있습니다.

**📊 토양 성분 분석 결과:**
• 현재 pH ${farmData.pH.toFixed(1)} (권장: ${cropStandards[crop.name as keyof typeof cropStandards].pH})
• 유기물 ${farmData.organicMatter}g/kg (${deficiencies[0]?.deficit > 0 ? `과잉 ${Math.abs(Math.round(deficiencies[0].deficit))}%` : `부족 ${Math.abs(Math.round(deficiencies[0].deficit))}%`})
• 유효인산 ${farmData.phosphorus}mg/kg (${deficiencies[1]?.deficit > 0 ? `과잉 ${Math.abs(Math.round(deficiencies[1].deficit))}%` : `부족 ${Math.abs(Math.round(deficiencies[1].deficit))}%`})
• 치환성 칼륨 ${farmData.potassium}cmol⁺/kg (${deficiencies[2]?.deficit > 0 ? `과잉 ${Math.abs(Math.round(deficiencies[2].deficit))}%` : `부족 ${Math.abs(Math.round(deficiencies[2].deficit))}%`})

**💡 비료 사용 최적화 방안:**
${deficiencies.some(d => d.deficit < -10) ?
  `현재 토양 상태에서는 일부 성분이 부족합니다. 적절한 비료 투입으로 생산성을 20-30% 향상시킬 수 있습니다.` :
  deficiencies.some(d => d.deficit > 10) ?
  `일부 성분이 과잉 상태입니다. 비료 사용을 ${Math.round(Math.max(...deficiencies.map(d => d.deficit)))}% 절감하여 경제성을 높이고 환경 부담을 줄일 수 있습니다.` :
  `현재 토양 조건이 우수합니다. 유지 관리 수준의 비료 투입만으로 충분합니다.`
}

**🌍 권장 정착 지역: 충청남도 논산시**

논산시는 ${crop.name} 주산지로서 다음과 같은 장점이 있습니다:

• **청년 귀농인 스마트팜 지원 정책**: 최대 3억원 시설비 지원 (국비 70%, 지방비 30%)
• **맞춤형 영농 기술 교육**: 논산시 농업기술센터에서 ${crop.name} 재배 전문 교육 과정 운영
• **판로 지원**: 지역 농협 계약재배 프로그램 및 온라인 직거래 플랫폼 연계
• **정착 지원금**: 귀농 가구당 월 100만원, 최대 3년간 지원

**📞 문의처:**
논산시 농업기술센터: 041-746-5671
귀농귀촌 종합센터: 041-746-8954

지금 바로 상담 신청하시면 1:1 맞춤형 정착 컨설팅을 받으실 수 있습니다.` : "";

  // LLM typing effect
  useEffect(() => {
    if (isTyping && typingIndex < fullLlmResponse.length) {
      const timeout = setTimeout(() => {
        setLlmText(fullLlmResponse.slice(0, typingIndex + 1));
        setTypingIndex(typingIndex + 1);
      }, 15);
      return () => clearTimeout(timeout);
    } else if (typingIndex >= fullLlmResponse.length) {
      setIsTyping(false);
    }
  }, [isTyping, typingIndex, fullLlmResponse]);

  if (!farmData || !crop) {
    return null;
  }

  // Prepare chart data
  const chartData = deficiencies.map(d => ({
    name: d.name,
    현재값: d.current,
    권장값: d.optimal,
    차이: Math.abs(d.current - d.optimal)
  }));

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

      {/* Results Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Success Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-3">
            <Sparkles className="h-6 w-6 text-green-600" />
            <div>
              <h2 className="text-2xl font-bold text-green-900">
                AI 분석 완료: 귀하의 토양에 가장 적합한 작물은 <span className="text-green-600">{crop.name}</span> 입니다.
              </h2>
              <p className="text-sm text-green-700 mt-1">
                유클리드 거리 기반 ML 분석 결과 (거리: {crop.distance.toFixed(3)})
              </p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left Column: ML Results */}
          <div className="space-y-6">
            {/* Crop Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sprout className="h-5 w-5 text-green-600" />
                  ML 기반 작물 처방 결과
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">{crop.icon}</div>
                  <h3 className="text-3xl font-bold mb-2">{crop.name}</h3>
                  <Badge variant="secondary" className="text-lg px-4 py-1">
                    {crop.suitability}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>종합 적합도 점수</span>
                    <span className="font-medium">{crop.matchRate}%</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-600 transition-all duration-1000"
                      style={{ width: `${crop.matchRate}%` }}
                    />
                  </div>
                </div>

                <div className="pt-4 border-t space-y-3">
                  <h4 className="font-medium">입력된 토양 데이터</h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="bg-muted/50 rounded p-3">
                      <div className="text-muted-foreground">pH</div>
                      <div className="font-medium">{farmData.pH.toFixed(1)}</div>
                    </div>
                    <div className="bg-muted/50 rounded p-3">
                      <div className="text-muted-foreground">유기물</div>
                      <div className="font-medium">{farmData.organicMatter} g/kg</div>
                    </div>
                    <div className="bg-muted/50 rounded p-3">
                      <div className="text-muted-foreground">인산</div>
                      <div className="font-medium">{farmData.phosphorus} mg/kg</div>
                    </div>
                    <div className="bg-muted/50 rounded p-3">
                      <div className="text-muted-foreground">칼륨</div>
                      <div className="font-medium">{farmData.potassium} cmol⁺/kg</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Nutrient Deficiency Chart */}
            <Card>
              <CardHeader>
                <CardTitle>처방 데이터: 성분별 현황 분석</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="현재값" fill="#22c55e" />
                    <Bar dataKey="권장값" fill="#94a3b8" />
                  </BarChart>
                </ResponsiveContainer>

                <div className="mt-4 space-y-2">
                  {deficiencies.map((def, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                      <span>{def.name}</span>
                      <Badge variant={Math.abs(def.deficit) < 10 ? "default" : "secondary"}>
                        {def.deficit > 0 ? `+${Math.round(def.deficit)}%` : `${Math.round(def.deficit)}%`}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Gemini LLM Analysis */}
          <div className="space-y-6">
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Gemini AI 실시간 해석 리포트
                  </CardTitle>
                </div>
                {isTyping && (
                  <Badge variant="secondary" className="w-fit gap-2 mt-2">
                    <div className="h-2 w-2 bg-green-600 rounded-full animate-pulse" />
                    Gemini가 분석 중입니다...
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                    {llmText}
                    {isTyping && <span className="inline-block w-2 h-4 bg-foreground animate-pulse ml-1" />}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Cards */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 text-center">
                  <MapPin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">지역 상세 정보</p>
                </CardContent>
              </Card>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors">
                <CardContent className="pt-6 text-center">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm font-medium">정책 전문 보기</p>
                </CardContent>
              </Card>
            </div>

            {/* Chat Input Preview */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Gemini에게 추가 질문하기..."
                    className="flex-1 px-3 py-2 border border-border rounded-md bg-input-background"
                  />
                  <Button className="gap-2">
                    <MessageSquare className="h-4 w-4" />
                    전송
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-4 mt-8 justify-center">
          <Button variant="outline" size="lg" className="gap-2">
            <Download className="h-4 w-4" />
            처방전 PDF 저장하기
          </Button>
        </div>
      </main>
    </div>
  );
}

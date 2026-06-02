import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Slider } from "../components/ui/slider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Sprout, ArrowLeft, Info } from "lucide-react";
import { Badge } from "../components/ui/badge";

export function InputForm() {
  const navigate = useNavigate();

  // 필수 입력
  const [pH, setPH] = useState([6.5]);
  const [nitrogen, setNitrogen] = useState("50");
  const [rainfall, setRainfall] = useState("120");

  // 선택 입력
  const [potassium, setPotassium] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    sessionStorage.setItem(
      "farmData",
      JSON.stringify({
        ph: pH[0],
        N: parseFloat(nitrogen),
        rainfall: parseFloat(rainfall),
        K: potassium ? parseFloat(potassium) : undefined,
      })
    );

    navigate("/results");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" />
            <span className="text-xl font-semibold">작목메이트</span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            돌아가기
          </Button>
        </div>
      </header>

      {/* Form Content */}
      <main className="container mx-auto px-4 py-12 max-w-2xl">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold mb-4">토양 검정 데이터를 입력해주세요</h1>
          <p className="text-muted-foreground mb-4">
            농촌진흥청 토양검정 기준에 따른 정확한 정보를 입력하세요
          </p>
          <Badge variant="secondary" className="gap-2">
            <Info className="h-3 w-3" />
            토양 분석 결과지를 확인하여 입력하시면 더 정확한 처방을 받을 수 있습니다
          </Badge>
        </div>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>토양·기후 분석 데이터</CardTitle>
              <CardDescription>
                ✱ 표시 항목은 필수입니다
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">

              {/* pH Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ph-slider">
                    토양 산도 (pH) <span className="text-red-500">✱</span>
                  </Label>
                  <span className="text-sm font-medium bg-muted px-3 py-1 rounded-md">
                    {pH[0].toFixed(1)}
                  </span>
                </div>
                <Slider
                  id="ph-slider"
                  min={3.5}
                  max={10}
                  step={0.1}
                  value={pH}
                  onValueChange={setPH}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>강산성 (3.5)</span>
                  <span>중성 (7.0)</span>
                  <span>알칼리성 (10.0)</span>
                </div>
              </div>

              {/* 질소량 */}
              <div className="space-y-2">
                <Label htmlFor="nitrogen">
                  토양 질소량 (N) <span className="text-red-500">✱</span>
                </Label>
                <Input
                  id="nitrogen"
                  type="number"
                  placeholder="예: 50"
                  value={nitrogen}
                  onChange={(e) => setNitrogen(e.target.value)}
                  required
                  min="0"
                  max="140"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  범위: 0 ~ 140 | 일반 농경지 기준: 40~60
                </p>
              </div>

              {/* 강수량 */}
              <div className="space-y-2">
                <Label htmlFor="rainfall">
                  연간 강수량 (mm) <span className="text-red-500">✱</span>
                </Label>
                <Input
                  id="rainfall"
                  type="number"
                  placeholder="예: 120"
                  value={rainfall}
                  onChange={(e) => setRainfall(e.target.value)}
                  required
                  min="0"
                  max="500"
                  step="1"
                />
                <p className="text-xs text-muted-foreground">
                  범위: 0 ~ 500mm | 지역 기상 데이터 또는 기상청 자료 참고
                </p>
              </div>

              {/* 칼륨 (선택) */}
              <div className="space-y-2">
                <Label htmlFor="potassium">
                  토양 칼륨량 (K)
                  <span className="ml-2 text-xs text-muted-foreground font-normal">선택 — 미입력 시 평균값 사용</span>
                </Label>
                <Input
                  id="potassium"
                  type="number"
                  placeholder="예: 32"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  min="0"
                  max="205"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  범위: 0 ~ 205
                </p>
              </div>

            </CardContent>
          </Card>

          <Button
            type="submit"
            size="lg"
            className="w-full mt-8 bg-green-600 hover:bg-green-700 text-white"
          >
            AI 작물 처방 및 지역 매칭 시작
          </Button>
        </form>
      </main>
    </div>
  );
}

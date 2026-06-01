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
  const [pH, setPH] = useState([6.5]);
  const [organicMatter, setOrganicMatter] = useState("25");
  const [phosphorus, setPhosphorus] = useState("300");
  const [potassium, setPotassium] = useState("0.6");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store form data in sessionStorage for the results page
    sessionStorage.setItem('farmData', JSON.stringify({
      pH: pH[0],
      organicMatter: parseFloat(organicMatter),
      phosphorus: parseFloat(phosphorus),
      potassium: parseFloat(potassium)
    }));

    navigate("/results");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-background">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" />
            <span className="text-xl font-semibold">Farmlink AI</span>
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
              <CardTitle>토양 화학성 분석 데이터</CardTitle>
              <CardDescription>
                농촌진흥청 표준 검정 항목 기준
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* pH Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="ph-slider">토양 산도 (pH)</Label>
                  <span className="text-sm font-medium bg-muted px-3 py-1 rounded-md">
                    {pH[0].toFixed(1)}
                  </span>
                </div>
                <Slider
                  id="ph-slider"
                  min={4}
                  max={9}
                  step={0.1}
                  value={pH}
                  onValueChange={setPH}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>강산성 (4.0)</span>
                  <span>중성 (7.0)</span>
                  <span>알칼리성 (9.0)</span>
                </div>
              </div>

              {/* Organic Matter Input */}
              <div className="space-y-2">
                <Label htmlFor="organic-matter">유기물 함량 (OM, g/kg)</Label>
                <Input
                  id="organic-matter"
                  type="number"
                  placeholder="예: 25"
                  value={organicMatter}
                  onChange={(e) => setOrganicMatter(e.target.value)}
                  className="bg-input-background"
                  required
                  min="0"
                  step="0.1"
                />
                <p className="text-xs text-muted-foreground">
                  일반 농경지 기준: 20~30 g/kg (적정), 시설재배: 25~35 g/kg
                </p>
              </div>

              {/* Phosphorus Input */}
              <div className="space-y-2">
                <Label htmlFor="phosphorus">유효인산 (P₂O₅, mg/kg)</Label>
                <Input
                  id="phosphorus"
                  type="number"
                  placeholder="예: 300"
                  value={phosphorus}
                  onChange={(e) => setPhosphorus(e.target.value)}
                  className="bg-input-background"
                  required
                  min="0"
                />
                <p className="text-xs text-muted-foreground">
                  일반 농경지 기준: 300~550 mg/kg (적정)
                </p>
              </div>

              {/* Potassium Input */}
              <div className="space-y-2">
                <Label htmlFor="potassium">치환성 칼륨 (K, cmol⁺/kg)</Label>
                <Input
                  id="potassium"
                  type="number"
                  placeholder="예: 0.6"
                  value={potassium}
                  onChange={(e) => setPotassium(e.target.value)}
                  className="bg-input-background"
                  required
                  min="0"
                  step="0.01"
                />
                <p className="text-xs text-muted-foreground">
                  일반 농경지 기준: 0.50~0.80 cmol⁺/kg (적정)
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

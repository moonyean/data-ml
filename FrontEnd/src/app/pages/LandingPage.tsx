import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Sprout, Brain, MapPin } from "lucide-react";

export function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" />
            <span className="text-xl font-semibold">Farmlink AI</span>
          </div>
          <nav>
            <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
              서비스 소개
            </a>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center">
        <div
          className="relative w-full min-h-[600px] flex items-center justify-center bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url('https://images.unsplash.com/photo-1560493676-04071c5f467b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXJtbGFuZCUyMGFncmljdWx0dXJlJTIwc29pbCUyMGNyb3BzfGVufDF8fHx8MTc3OTg2ODc2MXww&ixlib=rb-4.1.0&q=80&w=1080')`,
          }}
        >
          <div className="container mx-auto px-4 text-center text-white z-10">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              데이터 기반 정밀 농업 처방<br />및 정착 지원 서비스
            </h1>
            <p className="text-xl md:text-2xl text-gray-200 mb-8 max-w-3xl mx-auto">
              농촌진흥청 표준 기준 토양 분석으로 최적 작물을 처방하고, Gemini AI가 맞춤형 영농 가이드를 제공합니다.
            </p>
            <Button
              size="lg"
              className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg"
              onClick={() => navigate("/input")}
            >
              AI 분석 및 추천 받기 →
            </Button>

            {/* Feature Pills */}
            <div className="flex flex-wrap gap-4 justify-center mt-12">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Brain className="h-5 w-5" />
                <span>ML 기반 작물 매칭</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <MapPin className="h-5 w-5" />
                <span>LLM 지역 추천</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
                <Sprout className="h-5 w-5" />
                <span>맞춤형 정책 안내</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

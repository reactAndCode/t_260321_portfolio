import { KeywordAnalysisResult, TrendPoint } from "@/lib/types";

function buildMockTrend(keyword: string): TrendPoint[] {
  const seed = Array.from(keyword).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const base = 45 + (seed % 30);

  return Array.from({ length: 12 }, (_, index) => {
    const month = new Date();
    month.setMonth(month.getMonth() - (11 - index));
    const variance = ((seed + index * 17) % 23) - 8;

    return {
      date: `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, "0")}`,
      value: Math.max(10, base + variance)
    };
  });
}

export function getMockAnalysis(keyword: string): KeywordAnalysisResult {
  const trend = buildMockTrend(keyword);
  const monthlySearchPc = 120;
  const monthlySearchMobile = 340;
  const monthlySearchTotal = monthlySearchPc + monthlySearchMobile;

  return {
    keyword,
    summary: {
      monthlySearchPc,
      monthlySearchMobile,
      monthlySearchTotal
    },
    trend,
    relatedKeywords: [
      { keyword: `${keyword} 추천`, monthlyTotal: 260, competition: 0.42 },
      { keyword: `${keyword} 비용`, monthlyTotal: 190, competition: 0.33 },
      { keyword: `${keyword} 후기`, monthlyTotal: 170, competition: 0.57 },
      { keyword: `${keyword} 비교`, monthlyTotal: 130, competition: 0.28 },
      { keyword: `${keyword} 잘하는곳`, monthlyTotal: 110, competition: 0.49 }
    ],
    insights: [
      "모의 데이터 모드입니다. 환경변수를 설정하면 네이버 실데이터를 우선 조회합니다.",
      "모바일 검색량이 PC보다 높은 패턴으로 가정해 초기 UX를 검증하기 좋습니다.",
      "연관 키워드 표와 추이 차트는 실데이터 연결 시 그대로 재사용할 수 있습니다."
    ],
    sourceMeta: {
      provider: "mock",
      fetchedAt: new Date().toISOString(),
      mode: "mock"
    }
  };
}

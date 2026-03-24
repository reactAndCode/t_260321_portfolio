import { getMockAnalysis } from "@/lib/mock-data";
import { fetchDatalabTrend } from "@/lib/naver-datalab";
import { fetchSearchAdKeyword } from "@/lib/naver-searchad";
import { KeywordAnalysisResult } from "@/lib/types";

function buildInsights(result: KeywordAnalysisResult) {
  const { monthlySearchPc, monthlySearchMobile, monthlySearchTotal } = result.summary;
  const insights: string[] = [];

  if (monthlySearchTotal) {
    insights.push(`월간 총 검색량은 약 ${monthlySearchTotal.toLocaleString("ko-KR")}회 수준입니다.`);
  }

  if (
    monthlySearchPc !== null &&
    monthlySearchMobile !== null &&
    monthlySearchMobile > monthlySearchPc
  ) {
    insights.push("모바일 비중이 높아 모바일 우선 랜딩페이지와 짧은 메시지 구성이 유리합니다.");
  }

  const topRelated = result.relatedKeywords[0];
  if (topRelated) {
    insights.push(`연관 확장 키워드 중 '${topRelated.keyword}' 조합을 우선 점검할 가치가 있습니다.`);
  }

  if (result.trend.length >= 2) {
    const first = result.trend[0]?.value ?? 0;
    const last = result.trend[result.trend.length - 1]?.value ?? 0;

    if (last > first) {
      insights.push("최근 추세가 초기 구간보다 높아지는 흐름입니다.");
    } else if (last < first) {
      insights.push("최근 추세가 완만히 내려가고 있어 세부 롱테일 키워드 확장이 필요합니다.");
    }
  }

  return insights.slice(0, 3);
}

export async function analyzeKeyword(keyword: string): Promise<KeywordAnalysisResult> {
  const [searchAdData, trendData] = await Promise.all([
    fetchSearchAdKeyword(keyword),
    fetchDatalabTrend(keyword)
  ]);

  if (!searchAdData && !trendData) {
    return getMockAnalysis(keyword);
  }

  const monthlySearchPc = searchAdData?.keywordSummary.monthlySearchPc ?? null;
  const monthlySearchMobile = searchAdData?.keywordSummary.monthlySearchMobile ?? null;
  const monthlySearchTotal =
    monthlySearchPc !== null && monthlySearchMobile !== null
      ? monthlySearchPc + monthlySearchMobile
      : null;

  const result: KeywordAnalysisResult = {
    keyword,
    summary: {
      monthlySearchPc,
      monthlySearchMobile,
      monthlySearchTotal
    },
    trend: trendData ?? [],
    relatedKeywords: searchAdData?.relatedKeywords ?? [],
    insights: [],
    sourceMeta: {
      provider: searchAdData || trendData ? "naver" : "mock",
      fetchedAt: new Date().toISOString(),
      mode: searchAdData || trendData ? "live" : "mock"
    }
  };

  result.insights = buildInsights(result);

  return result;
}

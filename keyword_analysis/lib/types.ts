export type TrendPoint = {
  date: string;
  value: number;
};

export type RelatedKeyword = {
  keyword: string;
  monthlyTotal: number | null;
  competition: number | null;
};

export type KeywordAnalysisResult = {
  keyword: string;
  summary: {
    monthlySearchPc: number | null;
    monthlySearchMobile: number | null;
    monthlySearchTotal: number | null;
  };
  trend: TrendPoint[];
  relatedKeywords: RelatedKeyword[];
  insights: string[];
  sourceMeta: {
    provider: string;
    fetchedAt: string;
    mode: "live" | "mock";
  };
};
